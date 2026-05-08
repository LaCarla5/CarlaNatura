const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
// Base de Datos
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
// Correo
const nodemailer = require('nodemailer');
//const path = require('path');
// Imagenes
const multer = require('multer');
// Contraseñas
const bcrypt = require('bcrypt');
const saltRounds = 10; 
// Tokens
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());


// Servir imágenes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Si la ruta es para el blog, va a uploads/blog, si no a uploads/perfil
    const folder = req.baseUrl.includes('blog') ? 'uploads/blog/' : 'uploads/perfil/';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Conexión MySQL
const conexion = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

conexion.connect((err) => {
  if (err) {
    console.error('❌ Error al conectar:', err);
    return;
  }
  console.log('✅ ¡Conectado con éxito a MySQL Workbench!');
});

// Configuración Nodemailer
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
  // Buscamos al usuario solo por email
  const sql = "SELECT * FROM usuarios WHERE email = ?";
  
  conexion.query(sql, [email], (err, result) => {
    if (err) return res.status(500).json({ error: "Error en el servidor" });
    if (result.length === 0) return res.status(401).json({ error: "Usuario no encontrado" });

    const usuario = result[0];

    // Comparamos la contraseña en texto plano (la que viene del login.ts)
    // con la encriptada que guardamos en la DB
    const esValida = bcrypt.compareSync(password, usuario.password);

    if (esValida) {
      // Si es correcta, devolvemos los datos
      const token = jwt.sign(
                { id: usuario.id, email: usuario.email }, 
                process.env.JWT_SECRET, 
                { expiresIn: '24h' } // El token durará un día
      );

      res.json({
        // Llammos a cada columna de nuestra base de datos
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email, 
        telefono: usuario.telefono,
        genero: usuario.genero,
        domicilio: usuario.domicilio,
        cp: usuario.cp,
        ciudad: usuario.ciudad,
        comunidad: usuario.comunidad_autonoma,
        pais: usuario.pais,
        rol: usuario.rol,
        foto: usuario.foto_perfil,
        // Añadimos el token y lo "enviamos" al front
        token: token
      });
    } else {
      res.status(401).json({ error: "Contraseña incorrecta" });
    }
  });
});

app.post('/api/registro', (req, res) => {
  const { nombre, email, password, rol } = req.body;
  // Encriptamos la contraseña
  const hash = bcrypt.hashSync(password, saltRounds);
  const rolFinal = rol || 'USER';
  // En lugar de una ruta larga, usa solo el nombre del archivo y la carpeta donde esta
  const fotoDef = 'imagenUsuarioEjemplo.jpg';
  const sql = 'INSERT INTO usuarios (nombre, email, password, rol, foto_perfil) VALUES (?, ?, ?, ?, ?)';
  conexion.query(sql, [nombre, email, hash, rolFinal, fotoDef], (err, resultado) => {
    if (err) {
    console.log(err); // Mira la terminal donde corre Node
    return res.status(500).json({ error: err.sqlMessage || 'Error al registrar' });
    }
    res.status(201).json({ mensaje: 'Éxito', id: resultado.insertId });
  });
});


// RUTA PARA OBTENER LOS DATOS 
app.get('/api/perfil/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM usuarios WHERE id = ?";
    conexion.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error en GET:", err);
            return res.status(500).json({ error: err.message });
        }
        if (result.length === 0) return res.status(404).json({ error: "No existe" });
        res.json(result[0]);
    });
});

// RUTA PARA GUARDAR 
app.put('/api/perfil/:id', upload.single('foto'), (req, res) => {
    const { id } = req.params;
    // IMPORTANTE: Extraemos 'ca' (como lo enviamos desde Angular)
    const { nombre, genero, telefono, domicilio, cp, ciudad, ca, pais } = req.body;
    let foto_perfil = req.file ? req.file.filename : null;

    // Consulta SQL con el nombre exacto de tu columna: comunidad_autonoma
    let sql = `UPDATE usuarios SET 
               nombre = ?, genero = ?, telefono = ?, domicilio = ?, 
               cp = ?, ciudad = ?, comunidad_autonoma = ?, pais = ?`;
    
    let params = [nombre, genero, telefono, domicilio, cp, ciudad, ca, pais];

    if (foto_perfil) {
        sql += ", foto_perfil = ?";
        params.push(foto_perfil);
    }

    sql += " WHERE id = ?";
    params.push(id);

    conexion.query(sql, params, (err, result) => {
        if (err) {
            console.error("ERROR SQL AL GUARDAR:", err); // MIRA TU TERMINAL DE NODE AQUÍ
            return res.status(500).json({ error: err.message });
        }
        res.json({ mensaje: "OK", foto: foto_perfil });
    });
});

// --- RUTAS DE CITAS ---

app.post('/api/citas', (req, res) => {
  const { nombre, email, servicio, fecha, hora, descripcion, cliente_id } = req.body;

  // Validación de seguridad: Si no hay email, no intentamos enviar correo
  if (!email) {
    console.error('❌ Intento de reserva sin email');
    // Guardamos la cita igualmente o devolvemos error según prefieras
  }

  const sql = "INSERT INTO citas (usuario_id, nombre, email, servicio, descripcion, fecha, hora, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')";
  
  conexion.query(sql, [cliente_id, nombre, email, servicio, descripcion, fecha, hora], (err, result) => {
    if (err) {
      console.error('❌ Error SQL en Citas:', err);
      return res.status(500).json({ error: "Error al guardar la cita" });
    }

    // Solo intentamos enviar el correo si existe el email
    if (email) {
      const mailOptions = {
        from: 'CarlaNatura <carlanatura2026@gmail.com>',
        to: email, // 👈 Si esto es undefined, Nodemailer falla
        subject: 'Reserva Recibida - CarlaNatura 🌿',
        html: `<h2>¡Hola ${nombre}!</h2><p>Hemos recibido tu solicitud para <b>${servicio}</b> el día ${fecha} a las ${hora}.</p>`
      };
    }

    // Respondemos al cliente de Angular inmediatamente
    res.status(200).json({ message: "Cita guardada correctamente" });
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
    
    // console.log(`Día ${fecha} - Horas no disponibles:`, horasOcupadas);
    res.json(horasOcupadas); // Enviamos el array, ej: ["10:00", "16:00"]
  });
});

// --- RUTAS DE ADMIN CITAS ---

// Obtener todas para la tabla general
app.get('/api/admin/citas', (req, res) => {
  conexion.query('SELECT * FROM citas ORDER BY fecha DESC, hora DESC', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json(resultados);
  });
});

// Obtener solo pendientes para la bandeja de entrada
app.get('/api/admin/citas/pendientes', (req, res) => {
  conexion.query("SELECT * FROM citas WHERE estado = 'pendiente' ORDER BY fecha, hora", (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
  });
});

// Obtener solo confirmadas para el calendario
app.get('/api/admin/citas/calendario', (req, res) => {
  conexion.query("SELECT * FROM citas WHERE estado = 'confirmada'", (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
  });
});

// Actualizar estado y enviar mail de confirmación
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


// --- RUTAS DE ADMIN USUARIOS ---
app.get('/api/admin/usuarios', (req, res) => {
  conexion.query('SELECT * FROM usuarios ORDER BY fecha_registro DESC', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json(resultados);
  });
});

app.delete('/api/admin/usuarios/:id', (req, res) => {
    const { id } = req.params;
    conexion.query("DELETE FROM Usuarios WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.log("EL ERROR ES ESTE:", err.message); // Mira esto en la terminal negra
            return res.status(500).json({ error: err.message });
        }
        res.json({ mensaje: "Usuario borrado" });
    });
});

// --- RUTAS DE CATÁLOGO ---
app.get('/api/catalogo', (req, res) => {
  conexion.query('SELECT * FROM productos', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json(resultados);
  });
});


// --- RUTAS DE BLOG ---

// Obtener todas para la tabla general
app.get('/api/blog', (req, res) => {
  conexion.query('SELECT * FROM blog_posts ORDER BY fecha_publicacion DESC', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json(resultados);
  });
});

// Obtener noticias individialmente
app.get('/api/blog/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM blog_posts WHERE id = ?";
    conexion.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result[0]); // Devolvemos solo el primer objeto
    });
});

// --- RUTAS DE ADMIN BLOG ---

app.get('/api/admin/blog', (req, res) => {
  conexion.query('SELECT * FROM blog_posts ORDER BY fecha_publicacion DESC', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json(resultados);
  });
});

app.post('/api/admin/blog', (req, res) => {
  const { titulo, categoria, contenido, imagen, urlExterna, autor_id, fecha_publicacion } = req.body;

  // Verificamos que los datos mínimos existan
  if (!titulo || !contenido || !categoria) {
    return res.status(400).json({ error: 'Título y contenido son obligatorios' });
  }

  // SQL con los 7 parámetros correspondientes
  const sql = 'INSERT INTO blog_posts (titulo, categoria, contenido, imagen, urlExterna, autor_id, fecha_publicacion) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  const fechaFormateada = new Date(fecha_publicacion)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  const valores = [
    titulo, 
    categoria, 
    contenido, 
    imagen || null, 
    urlExterna || null, 
    autor_id || 1, // Si no llega autor, le ponemos el 1 por defecto (Admin)
    fechaFormateada
  ];

  conexion.query(sql, valores, (err, resultado) => {
    if (err) {
      console.error("Error en el INSERT:", err);
      return res.status(500).json({ error: 'No se pudo guardar el post' });
    }
    res.status(201).json({ mensaje: 'Post creado', id: resultado.insertId });
  });
});

app.delete('/api/admin/blog/:id', (req, res) => {
  conexion.query('DELETE FROM blog_post WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json({ mensaje: 'Eliminado' });
  });
});


// --- RUTAS DE CATÁLOGO ADMIN---

app.get('/api/catalogo-admin', (req, res) => {
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

// --- RUTAS DE CARRITO AÑADIR PEDIDOS ---
app.post('/api/pedidos', (req, res) => {
    const { usuario_id, total, productos } = req.body;

    // Insertamos el Pedido principal
    const sqlPedido = "INSERT INTO Pedidos (usuario_id, total, estado_pago) VALUES (?, ?, 'pagado')";
    
    conexion.query(sqlPedido, [usuario_id, total], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const pedidoId = result.insertId;

        // Preparamos los detalles
        const valoresDetalles = productos.map(p => [pedidoId, p.producto_id || p.id, p.cantidad, p.precio]);
        const sqlDetalles = "INSERT INTO Detalle_Pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES ?";

        // Insertamos los detalles
        conexion.query(sqlDetalles, [valoresDetalles], (errDetalle) => {
            if (errDetalle) return res.status(500).json({ error: errDetalle.message });

            // Limpiamos el carrito SOLO cuando lo anterior ha salido bien
            const sqlBorrarCarrito = 'DELETE FROM carrito WHERE usuario_id = ?';
            conexion.query(sqlBorrarCarrito, [usuario_id], (errBorrar) => {
                if (errBorrar) console.error("Error al limpiar carrito:", errBorrar);
                
                // 5. UNA SOLA RESPUESTA AL FINAL
                res.json({ 
                    success: true, 
                    message: "Pedido completado y carrito limpio", 
                    pedidoId: pedidoId 
                });
            });
        });
    });
});

// --- RUTAS DE CARRITO---

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    //console.log("Token recibido para validar:", token);

    if (!token) return res.status(403).json({ error: "No se proporcionó un token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("Error al verificar token:", err.message);
            return res.status(401).json({ error: "Token inválido o expirado" });
        }
        
        // Guardamos el ID que viene dentro del token para usarlo en las rutas
        req.userId = decoded.id; 
        next();
    });
};

app.get('/api/carrito', verificarToken, (req, res) => {
    const sql = `
        SELECT c.*, p.nombre, p.precio, p.imagen 
        FROM carrito c 
        INNER JOIN Productos p ON c.producto_id = p.id 
        WHERE c.usuario_id = ?`;
    
    conexion.query(sql, [req.userId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// Añadir o actualizar producto en el carrito
app.post('/api/carrito', verificarToken, (req, res) => {
    const { producto_id, cantidad } = req.body;
    const usuario_id = req.userId;

    if (!usuario_id) return res.status(401).json({ error: "No se identificó al usuario" });

    const sql = `
      INSERT INTO carrito (usuario_id, producto_id, cantidad) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE cantidad = cantidad + ?`;
    
    conexion.query(sql, [usuario_id, producto_id, cantidad, cantidad], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// Vaciar el carrito completo de un usuario
app.delete('/api/carrito/vaciar/todo', verificarToken, (req, res) => {
    const sql = 'DELETE FROM carrito WHERE usuario_id = ?';
    conexion.query(sql, [req.userId], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, mensaje: "Carrito vaciado" });
    });
});

// Eliminar un único producto del carrito
app.delete('/api/carrito/:producto_id', verificarToken, (req, res) => {
    const { producto_id } = req.params;
    const sql = 'DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?';
    conexion.query(sql, [req.userId, producto_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// --- RUTAS DE PEDIDOS ADMIN---
// Ruta para enviar el correo y "desbloquear" la edición
app.get('/api/admin/pedidos', (req, res) => {
    const sql = `
        SELECT p.*, u.nombre AS nombre_usuario, u.email 
        FROM Pedidos p
        INNER JOIN Usuarios u ON p.usuario_id = u.id
        ORDER BY p.fecha_pedido DESC`;

    conexion.query(sql, (err, result) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).json({ error: "Error en la base de datos" });
        }
        res.json(result);
    });
});

app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});