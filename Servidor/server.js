// Base de datos
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
// Correo
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json());

// Configuración de MySQL
const conexion = mysql.createConnection({
  host: 'localhost',
  user: 'lacarla',
  password: 'Carla1234',
  database: 'carlaNatura' 
});

conexion.connect((err) => {
  if (err) {
    console.error('Error al conectar a Workbench:', err);
    return;
  }
  console.log('¡Conectado con éxito a MySQL Workbench!');
});

// CONFIGURACIÓN DE NODEMAILER (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'carlanatura2026@gmail.com', // Cambia por tu correo
    pass: 'mfmnmsssyhhozggl'  // Tu contraseña de aplicación de 16 letras
  }
});

// RUTA PARA PEDIR CITA
app.post('/api/citas', (req, res) => {
  const { nombre, email, servicio, fecha, hora, estado } = req.body;

  // 1. Insertar en la base de datos
  const sql = 'INSERT INTO citas (nombre, email, servicio, fecha, hora, estado) VALUES (?, ?, ?, ?, ?, ?)';
  
  conexion.query(sql, [nombre, email, servicio, fecha, hora, estado], (err, resultado) => {
    if (err) {
      console.error('Error al guardar en DB:', err);
      return res.status(500).json({ error: 'Error al guardar la cita' });
    }

    // 2. Si se guardó bien, enviar el correo
    const mailOptions = {
      from: 'CarlaNatura <carlanatura2026@gmail.com>',
      to: email,
      subject: 'Confirmación de tu Cita - CarlaNatura',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: #4CAF50;">¡Cita confirmada!</h2>
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Tu cita se ha registrado correctamente en nuestro sistema.</p>
          <p><strong>Fecha:</strong> ${fecha}</p>
          <p><strong>Hora:</strong> ${hora}</p>
          <p>¡Te esperamos en CarlaNatura!</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar correo:', error);
        // Aunque el correo falle, la cita ya se guardó en DB
        return res.status(200).json({ mensaje: 'Cita guardada pero el correo falló' });
      }
      
      res.status(200).json({ mensaje: 'Cita guardada y correo enviado con éxito' });
    });
  });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en el puerto 3000');
});

// --- RUTAS PARA EL ADMINISTRADOR ---

// 1. Obtener TODAS las citas (para la tabla del admin)
app.get('/api/admin/citas', (req, res) => {
  const sql = 'SELECT * FROM citas ORDER BY fecha DESC, hora DESC';
  
  conexion.query(sql, (err, resultados) => {
    if (err) {
      console.error('Error al obtener citas:', err);
      return res.status(500).json({ error: 'Error al consultar la base de datos' });
    }
    res.json(resultados);
  });
});

// 2. Actualizar el estado de una cita (Confirmar/Cancelar)
app.patch('/api/admin/citas/:id', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body; // El admin enviará "Confirmada" o "Cancelada"

  const sql = 'UPDATE citas SET estado = ? WHERE id = ?';

  conexion.query(sql, [estado, id], (err, resultado) => {
    if (err) {
      console.error('Error al actualizar cita:', err);
      return res.status(500).json({ error: 'No se pudo actualizar la cita' });
    }
    res.json({ mensaje: `Cita ${id} actualizada a ${estado}` });
  });
});

// -- Rutas Login --

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT id, nombre, rol FROM usuarios WHERE email = ? AND password = ?';

  conexion.query(sql, [email, password], (err, resultado) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });

    if (resultado.length > 0) {
      const usuario = resultado[0];
      // Devolvemos el rol que viene de la base de datos (ej: 'ADMIN' o 'USER')
      res.json({ 
        token: 'token-falso-generado', 
        rol: usuario.rol, 
        nombre: usuario.nombre 
      });
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  });
});

// RUTA PARA REGISTRO DE USUARIOS
app.post('/api/registro', (req, res) => {
  const { nombre, email, password, rol } = req.body;

  // Asignamos 'USER' si no viene ningún rol (por seguridad)
  const rolFinal = rol || 'USER';

  const sql = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)';
  
  conexion.query(sql, [nombre, email, password, rolFinal], (err, resultado) => {
    if (err) {
      console.error('Error al registrar usuario:', err);
      // Si el email ya existe (asumiendo que es UNIQUE en tu DB)
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'El correo ya está registrado en la base de datos' });
      }
      return res.status(500).json({ error: 'Error al registrar el usuario' });
    }

    res.status(201).json({ 
      mensaje: 'Usuario registrado con éxito',
      id: resultado.insertId 
    });
  });
});