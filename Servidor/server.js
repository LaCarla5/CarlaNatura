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
  const { nombre, email, password, rol } = req.body;
  const rolFinal = rol || 'USER';
  const sql = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)';
  
  conexion.query(sql, [nombre, email, password, rolFinal], (err, resultado) => {
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
  const { nombre, email, servicio, fecha, hora, estado } = req.body;
  const sql = 'INSERT INTO citas (nombre, email, servicio, fecha, hora, estado) VALUES (?, ?, ?, ?, ?, ?)';
  
  conexion.query(sql, [nombre, email, servicio, fecha, hora, estado], (err) => {
    if (err) return res.status(500).json({ error: 'Error al guardar cita' });

    const mailOptions = {
      from: 'CarlaNatura <carlanatura2026@gmail.com>',
      to: email,
      subject: 'Confirmación de Cita',
      html: `<h2>¡Cita confirmada!</h2><p>Hola ${nombre}, te esperamos el ${fecha} a las ${hora}.</p>`
    };

    transporter.sendMail(mailOptions, () => {
      res.status(200).json({ mensaje: 'Cita procesada' });
    });
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