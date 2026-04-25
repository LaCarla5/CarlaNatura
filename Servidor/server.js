const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const multer = require('multer');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Servir imágenes
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
    console.error('❌ Error al conectar:', err);
    return;
  }
  console.log('✅ ¡Conectado con éxito a MySQL Workbench!');
});

// 4. Configuración Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'carlanatura2026@gmail.com',
    pass: 'mfmnmsssyhhozggl' 
  }
});

// --- RUTAS DE USUARIOS ---

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
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
        email: usuario.email,
        foto: usuario.foto_perfil 
      });
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  });
});

app.post('/api/registro', (req, res) => {
  const { nombre, email, password, rol } = req.body;
  const rolFinal = rol || 'USER';
  const fotoDef = '/uploads/perfil/imagenUsuarioEjemplo.jpg';
  const sql = 'INSERT INTO usuarios (nombre, email, password, rol, foto_perfil) VALUES (?, ?, ?, ?, ?)';
  conexion.query(sql, [nombre, email, password, rolFinal, fotoDef], (err, resultado) => {
    if (err) return res.status(500).json({ error: 'Error al registrar' });
    res.status(201).json({ mensaje: 'Éxito', id: resultado.insertId });
  });
});

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

// --- RUTAS DE CITAS (CLIENTE) ---

app.post('/api/citas', (req, res) => {
  const { nombre, email, servicio, fecha, hora, descripcion, cliente_id } = req.body;
  // Usamos 'usuario_id' para que coincida con tu tabla SQL
  const sql = "INSERT INTO citas (usuario_id, nombre, email, servicio, descripcion, fecha, hora, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')";
  
  conexion.query(sql, [cliente_id, nombre, email, servicio, descripcion, fecha, hora], (err, result) => {
    if (err) {
      console.error('❌ Error SQL en Citas:', err);
      return res.status(500).json({ error: "Error al guardar la cita" });
    }

    // Nodemailer
    const mailOptions = {
      from: 'CarlaNatura <carlanatura2026@gmail.com>',
      to: email,
      subject: 'Reserva Recibida - CarlaNatura 🌿',
      html: `<h2>¡Hola ${nombre}!</h2><p>Hemos recibido tu solicitud para <b>${servicio}</b> el día ${fecha}. Estás en estado <b>PENDIENTE</b>.</p>`
    };

    transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Cita guardada y correo enviado" });
  });
});

// El cliente no coja horas ya ocupadas
app.get('/api/citas/ocupadas', (req, res) => {
  const { fecha } = req.query; // Recibe la fecha que el usuario pinchó

  // Solo bloqueamos las que ya están confirmadas (o pendientes de revisión)
  // para que nadie más pueda pedirlas en ese hueco.
  const sql = "SELECT hora FROM citas WHERE fecha = ? AND estado IN ('pendiente', 'confirmada')";

  conexion.query(sql, [fecha], (err, resultado) => {
    if (err) {
      console.error('Error al consultar disponibilidad:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    // Convertimos de "09:00:00" a "09:00" para que Angular lo entienda
    const horasOcupadas = resultado.map(fila => fila.hora.substring(0, 5));
    
    console.log(`Día ${fecha} - Horas no disponibles:`, horasOcupadas);
    res.json(horasOcupadas); // Enviamos el array, ej: ["10:00", "16:00"]
  });
});

// --- RUTAS DE ADMIN CITAS ---

// 1. Obtener todas para la tabla general
app.get('/api/admin/citas', (req, res) => {
  conexion.query('SELECT * FROM citas ORDER BY fecha DESC, hora DESC', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json(resultados);
  });
});

// 2. Obtener solo pendientes para la bandeja de entrada
app.get('/api/admin/citas/pendientes', (req, res) => {
  conexion.query("SELECT * FROM citas WHERE estado = 'pendiente' ORDER BY fecha, hora", (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
  });
});

// 3. Obtener solo confirmadas para el calendario
app.get('/api/admin/citas/calendario', (req, res) => {
  conexion.query("SELECT * FROM citas WHERE estado = 'confirmada'", (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
  });
});

// 4. Actualizar estado y enviar mail de confirmación
app.patch('/api/admin/citas/:id', (req, res) => {
  const { id } = req.params;
  const { estado, email } = req.body;
  
  conexion.query('UPDATE citas SET estado = ? WHERE id = ?', [estado, id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar' });

    if (estado === 'confirmada' && email) {
      const mailOptions = {
        from: 'CarlaNatura <carlanatura2026@gmail.com>',
        to: email,
        subject: '✅ Cita Confirmada - CarlaNatura',
        html: `<h2>¡Tu cita ha sido confirmada!</h2><p>Te esperamos en el centro CarlaNatura.</p>`
      };
      transporter.sendMail(mailOptions);
    }
    res.json({ mensaje: 'Cita actualizada' });
  });
});

// --- RUTAS DE CATÁLOGO ---

app.get('/api/catalogo', (req, res) => {
  conexion.query('SELECT * FROM productos', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json(resultados);
  });
});

app.post('/api/catalogo-admin', (req, res) => {
  const { nombre, precio, stock, imagen, descripcion } = req.body;
  const sql = 'INSERT INTO productos (nombre, precio, stock, imagen, descripcion) VALUES (?, ?, ?, ?, ?)';
  conexion.query(sql, [nombre, precio, stock, imagen, descripcion], (err, resultado) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.status(201).json({ id: resultado.insertId });
  });
});

app.delete('/api/catalogo-admin/:id', (req, res) => {
  conexion.query('DELETE FROM productos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json({ mensaje: 'Eliminado' });
  });
});

app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});