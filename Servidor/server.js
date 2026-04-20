const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const multer = require('multer');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Servir imágenes (Asegúrate de que esta línea esté antes de las rutas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/perfil/'); 
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `user-${Date.now()}${extension}`);
  }
});
const upload = multer({ storage: storage });

// 3. Conexión MySQL
const conexion = mysql.createConnection({
  host: 'localhost',
  user: 'lacarla',
  password: 'Carla1234',
  database: 'carlaNatura' 
});

conexion.connect((err) => {
  if (err) {
    console.error('Error al conectar:', err);
    return;
  }
  console.log('¡Conectado con éxito a MySQL Workbench!');
});

// 4. Configuración Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'carlanatura2026@gmail.com',
    pass: 'mfmnmsssyhhozggl' 
  }
});

// --- RUTAS DE LOGIN (UNIFICADA) ---
  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    // IMPORTANTE: foto_perfil debe coincidir con tu Workbench
    const sql = 'SELECT id, nombre, email, rol, foto_perfil FROM usuarios WHERE email = ? AND password = ?';

    conexion.query(sql, [email, password], (err, resultado) => {
      if (err) return res.status(500).json({ error: 'Error en el servidor' });

      if (resultado.length > 0) {
        const usuario = resultado[0];
        res.json({ 
          token: 'token-falso-generado', 
          id: usuario.id,
          rol: usuario.rol, 
          nombre: usuario.nombre,
          // Enviamos el valor de la columna foto_perfil
          foto: usuario.foto_perfil 
        });
      } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
      }
    });
  });

// --- RUTA DE REGISTRO ---
app.post('/api/registro', (req, res) => {
  const { nombre, email, password, rol, foto_perfil } = req.body;
  const rolFinal = rol || 'USER';
  const foto_perfilDef = '/uploads/perfil/imagenUsuarioEjemplo.jpg';
  const sql = 'INSERT INTO usuarios (nombre, email, password, rol, foto_perfil) VALUES (?, ?, ?, ?, ?)';
  
  conexion.query(sql, [nombre, email, password, rolFinal, foto_perfilDef], (err, resultado) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Correo ya registrado' });
      return res.status(500).json({ error: 'Error al registrar' });
    }
    res.status(201).json({ mensaje: 'Éxito', id: resultado.insertId });
  });
});

// --- RUTA ACTUALIZAR PERFIL ---
app.put('/api/perfil/:id', upload.single('foto'), (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  let foto_perfil = req.file ? `/uploads/perfil/${req.file.filename}` : null;

  let sql = 'UPDATE usuarios SET nombre = ?';
  let params = [nombre];

  if (foto_perfil) {
    sql += ', foto_perfil = ?';
    params.push(foto_perfil);
  }

  sql += ' WHERE id = ?';
  params.push(id);

  conexion.query(sql, params, (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar' });
    res.json({ mensaje: 'Perfil actualizado', nombre, foto: foto_perfil });
  });
});

// --- RUTA CITAS ---
app.post('/api/citas', (req, res) => {
  const { nombre, email, servicio, fecha, hora, descripcion, cliente_id } = req.body;

  const query = "INSERT INTO citas (nombre, email, servicio, fecha, hora, descripcion, usuario_id, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')";
  
  conexion.query(query, [nombre, email, servicio, fecha, hora, descripcion, cliente_id], (err, result) => {
    if (err) {
      console.error('Error SQL:', err); // Esto te dirá en la terminal el error exacto
      return res.status(500).json({ error: "Error al guardar la cita" });
    }
  
    // ENVIAR EL CORREO
    const mailOptions = {
      from: 'CarlaNatura <carlanatura2026@gmail.com>',
      to: email, // El email que viene desde el frontend
      subject: 'Reserva Recibida - CarlaNatura 🌿',
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2 style="color: #198754;">¡Hola ${nombre}!</h2>
          <p>Hemos recibido tu solicitud de cita para el servicio: <b>${servicio}</b>.</p>
          <p>📅 <b>Fecha:</b> ${fecha}</p>
          <p>⏰ <b>Hora:</b> ${hora}</p>
          <hr>
          <p>Tu cita está actualmente en estado <b>PENDIENTE</b>. Te enviaremos otro correo en cuanto el administrador la confirme.</p>
          <br>
          <p>Gracias por confiar en <b>CarlaNatura</b>.</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("❌ Error enviando email:", error);
      } else {
        console.log("📧 Email enviado con éxito: " + info.response);
      }
    });

    // Responder al frontend
    res.status(200).json({ message: "Cita guardada y correo enviado" });
  });
});

// --- RUTA ACTUALIZAR PERFIL ---
app.put('/api/perfil/:id', upload.single('foto'), (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  let foto_perfil = req.file ? `/uploads/perfil/${req.file.filename}` : null;

  let sql = 'UPDATE usuarios SET nombre = ?';
  let params = [nombre];

  if (foto_perfil) {
    sql += ', foto_perfil = ?';
    params.push(foto_perfil);
  }

  sql += ' WHERE id = ?';
  params.push(id);

  conexion.query(sql, params, (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar' });
    res.json({ mensaje: 'Perfil actualizado', nombre, foto: foto_perfil });
  });
});

// ADMIN CITAS
app.patch('/api/admin/citas/:id', (req, res) => {
  const { id } = req.params;
  const { estado, email } = req.body;

  const query = "UPDATE Citas SET estado = ? WHERE id = ?";
  
  db.query(query, [estado, id], (err, result) => {
    if (err) return res.status(500).send(err);

    // 📧 Si el estado es 'confirmada', enviamos el segundo email
    if (estado === 'confirmada') {
      const mailOptions = {
        from: 'CarlaNatura <carlanatura2026@gmail.com>',
        to: email,
        subject: '✅ Cita Confirmada - CarlaNatura',
        html: `
          <div style="font-family: sans-serif; border: 1px solid #198754; padding: 20px; border-radius: 10px;">
            <h2 style="color: #198754;">¡Buenas noticias!</h2>
            <p>Tu cita en <b>CarlaNatura</b> ha sido confirmada por nuestro equipo.</p>
            <p>Te esperamos en el horario seleccionado. Si necesitas cambiarla, contáctanos.</p>
            <br>
            <p><i>Naturalmente contigo, Carla.</i></p>
          </div>
        `
      };

      transporter.sendMail(mailOptions);
    }

    res.json({ message: "Estado actualizado" });
  });
});

// Obtener solo las pendientes para la "bandeja de entrada"
app.get('/api/admin/citas/pendientes', (req, res) => {
    db.query("SELECT * FROM Citas WHERE estado = 'pendiente' ORDER BY fecha, hora", (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// Obtener todas las confirmadas para el calendario
app.get('/api/admin/citas/calendario', (req, res) => {
    db.query("SELECT * FROM Citas WHERE estado = 'confirmada'", (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// -- CATALOGO USER
app.get('/api/catalogo', (req, res) => {
  const sql = 'SELECT * FROM productos'; 
  conexion.query(sql, (err, resultados) => {
    if (err) {
      console.error('Error en la base de datos:', err);
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
    // Enviamos los productos a la web del usuario
    res.json(resultados);
  });
});


// --- RUTAS DE GESTIÓN (CATALOGO-ADMIN) ---
// Obtener productos
app.get('/api/catalogo-admin', (req, res) => {
  const sql = 'SELECT * FROM productos'; // La tabla se sigue llamando productos en SQL
  conexion.query(sql, (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error al obtener datos' });
    res.json(resultados);
  });
});

// Añadir producto
app.post('/api/catalogo-admin', (req, res) => {
  const { nombre, precio, stock, imagen, descripcion } = req.body;
  const sql = 'INSERT INTO productos (nombre, precio, stock, imagen, descripcion) VALUES (?, ?, ?, ?, ?)';
  
  conexion.query(sql, [nombre, precio, stock, imagen, descripcion], (err, resultado) => {
    if (err) return res.status(500).json({ error: 'Error al insertar' });
    res.status(201).json({ mensaje: 'Creado con éxito', id: resultado.insertId });
  });
});

// Eliminar producto
app.delete('/api/catalogo-admin/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM productos WHERE id = ?';
  
  conexion.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar' });
    res.json({ mensaje: 'Eliminado' });
  });
});


// --- RUTAS ADMIN ---
app.get('/api/admin/citas', (req, res) => {
  conexion.query('SELECT * FROM citas ORDER BY fecha DESC, hora DESC', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json(resultados);
  });
});

app.patch('/api/admin/citas/:id', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  conexion.query('UPDATE citas SET estado = ? WHERE id = ?', [estado, id], (err) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json({ mensaje: 'Cita actualizada' });
  });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en el puerto 3000');
});

