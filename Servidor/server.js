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
// Permitir usar api
const axios = require('axios');

const app = express();

app.use(cors({
  origin: 'https://carla-natura.vercel.app', // Pega aquí TU URL real
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Necesario para crear carpetas si no existen
const fs = require('fs');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de almacenamiento inteligente
const universalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/otros/';

    // Añadimos 'catalogo-admin' a la condición
    if (req.originalUrl.includes('blog')) folder = 'uploads/blog/';
    else if (req.originalUrl.includes('perfil')) folder = 'uploads/perfil/';
    else if (req.originalUrl.includes('productos') || req.originalUrl.includes('catalogo-admin')) {
      folder = 'uploads/productos/';
    }

    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// ESTA ES LA VARIABLE CLAVE
const upload = multer({ storage: universalStorage });

// Conexión MySQL
const conexion = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// conexion.connect((err) => {
//   if (err) {
//     console.error('❌ Error al conectar:', err);
//     return;
//   }
//   console.log('✅ ¡Conectado con éxito a MySQL Workbench!');
// });

// Configuración Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'carlanatura2026@gmail.com',
    pass: 'mfmnmsssyhhozggl'
  }
});

// Verificacion de token
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(403).json({ error: "No se proporcionó un token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token inválido o expirado" });
    req.userId = decoded.id;
    next();
  });
};

// --- RUTAS DE USUARIOS ---

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  // Buscamos al usuario solo por email
  const sql = "SELECT * FROM usuarios WHERE email = ? AND activo = 1";

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
      // Verificamos si el error es por entrada duplicada (Código 1062)
      if (err.errno === 1062 || err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          error: "Duplicado",
          message: "El correo electrónico ya está registrado. Intenta iniciar sesión."
        });
      }
      // Error genérico para otros fallos
      return res.status(500).json({ error: "Error en el servidor, usuario bloqueado o eliminado" });
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
  let { nombre, genero, telefono, domicilio, cp, ciudad, ca, pais } = req.body;

  const limpiar = (valor) => (valor === 'indefinido' || valor === '' || valor === 'null' ? null : valor);

  // 1. Limpiamos campos
  nombre = limpiar(nombre);
  genero = limpiar(genero);
  domicilio = limpiar(domicilio);
  cp = limpiar(cp);
  ciudad = limpiar(ciudad);
  ca = limpiar(ca);
  pais = limpiar(pais);

  // 2. Aquí está la clave: usamos la variable limpia
  const valorTelefono = (telefono === 'indefinido' || !telefono || telefono === 'null') ? null : parseInt(telefono);

  let foto_perfil = req.file ? req.file.filename : null;

  // 3. Consulta SQL
  let sql = `UPDATE usuarios SET 
               nombre = ?, genero = ?, telefono = ?, domicilio = ?, 
               cp = ?, ciudad = ?, comunidad_autonoma = ?, pais = ?`;

  // 4. IMPORTANTE: He cambiado 'telefono' por 'valorTelefono' aquí abajo
  let params = [nombre, genero, valorTelefono, domicilio, cp, ciudad, ca, pais];

  // Solo actualizamos la foto si realmente se ha subido una nueva
  if (foto_perfil) {
    sql += ", foto_perfil = ?";
    params.push(foto_perfil);
  }

  sql += " WHERE id = ?";
  params.push(id);

  conexion.query(sql, params, (err, result) => {
    if (err) {
      // CAPTURAMOS EL ERROR DE DUPLICADO (ER_DUP_ENTRY)
      if (err.code === 'ER_DUP_ENTRY') {
        //console.log("Conflicto detectado: Teléfono duplicado");
        return res.status(400).json({
          error_type: 'DUPLICADO_TELEFONO',
          mensaje: 'Este número de teléfono ya está registrado por otro usuario.'
        });
      }

      // Si es otro error, enviamos 500
      console.error("Error en MySQL:", err);
      return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
    res.json({ success: true, 
      mensaje: 'Perfil actualizado', 
      foto_perfil: foto_perfil });
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
        to: email, // Si esto es undefined, Nodemailer falla
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

// Ejemplo de la ruta en el servidor para actualizar el estado
app.put('/api/citas/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado, motivo, email, fecha, hora, servicio } = req.body;

  const sql = "UPDATE citas SET estado = ? WHERE id = ?";
  db.query(sql, [estado, id], (err, result) => {
    if (err) return res.status(500).send(err);

    // CONFIGURACIÓN DEL CORREO
    let asunto = '';
    let cuerpoHtml = '';

    if (estado === 'confirmada') {
      asunto = '¡Cita Confirmada en CarlaNatura! ✅';
      cuerpoHtml = `
                <h2>Hola, tu cita ha sido confirmada</h2>
                <p><b>Servicio:</b> ${servicio}</p>
                <p><b>Fecha:</b> ${fecha}</p>
                <p><b>Hora:</b> ${hora}h</p>
                <p>Te esperamos en nuestro centro. Si necesitas cambiarla, avísanos con 24h de antelación.</p>
            `;
    } else if (estado === 'cancelada') {
      asunto = 'Cita Anulada - CarlaNatura ❌';
      cuerpoHtml = `
                <h2>Tu cita ha sido anulada</h2>
                <p>Lamentamos informarte que tu cita para el día ${fecha} ha sido cancelada.</p>
                <p style="color: red;"><b>Motivo:</b> ${motivo || 'No especificado'}</p>
                <p>Puedes volver a reservar a través de nuestra web.</p>
            `;
    }

    // Aquí llamarías a tu función de nodemailer (transporter.sendMail)
    // enviarEmail(email, asunto, cuerpoHtml);

    res.json({ success: true, message: 'Estado actualizado y correo enviado' });
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
  const { estado, email, nombre, servicio, fecha, hora, motivo } = req.body;

  conexion.query('UPDATE citas SET estado = ? WHERE id = ?', [estado, id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar' });

    let asunto = '';
    let cuerpoHtml = '';

    if (estado === 'confirmada') {
      asunto = '¡Cita Confirmada! - CarlaNatura ✅';
      cuerpoHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h2 style="color: #198754;">Hola ${nombre},</h2>
                <p>Nos alegra informarte que tu solicitud de cita ha sido <strong>confirmada</strong>.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 5px solid #198754;">
                    <p style="margin: 0;"><strong>Servicio:</strong> ${servicio}</p>
                    <p style="margin: 0;"><strong>Fecha:</strong> ${fecha}</p>
                    <p style="margin: 0;"><strong>Hora:</strong> ${hora}h</p>
                </div>
                <p>Te esperamos en nuestro centro. Si necesitas realizar algún cambio, por favor avísanos con antelación.</p>
                <hr>
                <footer style="font-size: 12px; color: #777;">CarlaNatura - Salud y Bienestar</footer>
            </div>
        `;
    } else if (estado === 'cancelada') {
      asunto = 'Información sobre tu cita - CarlaNatura ❌';
      cuerpoHtml = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #d33;">Hola ${nombre},</h2>
                <p>Lamentamos informarte que no hemos podido procesar tu cita para el día <strong>${fecha}</strong>.</p>
                <div style="background-color: #fff3f3; padding: 15px; border-radius: 8px; border: 1px solid #f5c6cb;">
                    <p style="margin: 0; font-weight: bold;">Motivo de la anulación:</p>
                    <p style="margin: 5px 0 0 0;">${motivo}</p>
                </div>
                <p>Puedes intentar reservar en otra fecha disponible a través de nuestra web.</p>
                <hr>
                <footer style="font-size: 12px; color: #777;">CarlaNatura</footer>
            </div>
        `;
    }

    // Envío con Nodemailer
    const mailOptions = {
      from: '"CarlaNatura" <carlanatura2026@gmail.com>',
      to: email,
      subject: asunto,
      html: cuerpoHtml
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return res.status(500).send(error);
      res.json({ message: 'Estado actualizado y correo enviado' });
    });
  });
})


// --- RUTAS DE ADMIN USUARIOS ---
app.get('/api/admin/usuarios', (req, res) => {
  conexion.query('SELECT * FROM usuarios ORDER BY fecha_registro DESC', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json(resultados);
  });
});

// Eliminar usuarios
app.delete('/api/admin/usuarios/:id', (req, res) => {
  const { id } = req.params;

  conexion.query("DELETE FROM usuarios WHERE id = ?", [id], (err, result) => {
    if (err) {
      // Error de restricción de clave foránea (tiene pedidos, citas, etc.)
      if (err.errno === 1451) {
        return res.status(409).json({
          error: "Relacionado",
          message: "No se puede eliminar al usuario porque tiene historial en la tienda. ¡Pero puedes bloquearlo para impedir su acceso!"
        });
      }
      return res.status(500).send("Error en el servidor");
    }
    res.json({ mensaje: "Usuario borrado" });
  });
});

// Bloquear usuarios
app.put('/api/usuarios/bloquear/:id', (req, res) => {
  const id = req.params.id;
  const { activo } = req.body; // Recibimos 0 para bloquear o 1 para desbloquear
  const sql = "UPDATE Usuarios SET activo = ? WHERE id = ?";

  conexion.query(sql, [activo, id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true });
  });
});

// --- RUTAS DE CATÁLOGO ---
app.get('/api/catalogo', (req, res) => {
  conexion.query('SELECT * FROM productos', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json(resultados);
  });
});

app.post('/api/productos/reducir-stock', (req, res) => {
  const { carrito } = req.body; // Un array de productos: [{id: 1, cantidad: 2}, ...]

  // Usamos una promesa para manejar múltiples actualizaciones
  const promesas = carrito.map(item => {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?";
      conexion.query(sql, [item.cantidad, item.id, item.cantidad], (err, result) => {
        if (err) reject(err);
        if (result.affectedRows === 0) reject(new Error(`Sin stock para el producto ID: ${item.id}`));
        resolve(result);
      });
    });
  });

  Promise.all(promesas)
    .then(() => res.json({ mensaje: "Stock actualizado correctamente" }))
    .catch(err => res.status(400).json({ error: err.message }));
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

// Usamos el "disparador" de Multer para el blog que configuramos antes
app.post('/api/admin/blog', upload.single('imagen'), (req, res) => {
  const { titulo, categoria, contenido, urlExterna, autor_id, fecha_publicacion } = req.body;

  // Si no hay archivo, usamos la imagen de ejemplo por defecto
  const nombreImagen = req.file ? req.file.filename : 'imagenDefecto.jpg';

  // Validación en servidor: El contenido es opcional si hay URL, pero el título/categoría no
  if (!titulo || !categoria) {
    return res.status(400).json({ error: 'Título y categoría son obligatorios' });
  }

  const sql = 'INSERT INTO blog_posts (titulo, categoria, contenido, imagen, urlExterna, autor_id, fecha_publicacion) VALUES (?, ?, ?, ?, ?, ?, ?)';

  const fechaFormateada = new Date(fecha_publicacion || Date.now())
    .toISOString().slice(0, 19).replace('T', ' ');

  const valores = [
    titulo,
    categoria,
    contenido || '', // Evitamos NULL si viene vacío
    nombreImagen,
    urlExterna || null,
    autor_id || 1,
    fechaFormateada
  ];

  conexion.query(sql, valores, (err, resultado) => {
    if (err) {
      console.error("Error en el INSERT:", err);
      return res.status(500).json({ error: 'Error al guardar' });
    }
    res.status(201).json({ mensaje: 'Post creado', id: resultado.insertId, foto: nombreImagen });
  });
});

app.delete('/api/admin/blog/:id', (req, res) => {
  const id = req.params.id;
  // Asegúrate de si la tabla es 'blog_posts' o 'blog_post'
  conexion.query('DELETE FROM blog_posts WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'No se pudo eliminar' });
    res.json({ mensaje: 'Post eliminado correctamente' });
  });
});

app.put('/api/admin/blog/:id', upload.single('imagen'), (req, res) => {
  const { id } = req.params;
  // IMPORTANTE: Ahora extraemos también urlExterna del cuerpo de la petición
  const { titulo, contenido, categoria, urlExterna } = req.body;
  const fotoNueva = req.file ? req.file.filename : null;

  // 1. Base de la consulta: Incluimos urlExterna
  let sql = "UPDATE Blog_Posts SET titulo = ?, contenido = ?, categoria = ?, urlExterna = ?";
  
  // Si hay urlExterna, el contenido debería guardarse como string vacío o null 
  // para cumplir con tu lógica de "Si hay URL no hay contenido"
  const contenidoFinal = (urlExterna && urlExterna.trim() !== '') ? '' : contenido;
  
  let params = [titulo, contenidoFinal, categoria, urlExterna || null];

  // 2. Manejo de la imagen
  if (fotoNueva) {
    sql += ", imagen = ?";
    params.push(fotoNueva);
  }
  
  // 3. Condición final
  sql += " WHERE id = ?";
  params.push(id);

  conexion.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error MySQL detallado:", err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "No se encontró el registro con ID: " + id });
    }

    res.json({ 
      success: true, 
      mensaje: "Post actualizado correctamente", 
      nuevaImagen: fotoNueva 
    });
  });
});

// --- RUTAS DE CATÁLOGO ADMIN ---

// Obtener productos
app.get('/api/catalogo-admin', (req, res) => {
  conexion.query('SELECT * FROM productos', (err, resultados) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json(resultados);
  });
});


// Guardar nuevo producto (con imagen Multer)
app.post('/api/catalogo-admin', upload.single('imagen'), (req, res) => {
  // console.log("Archivo recibido:", req.file); // Si esto sale 'undefined', el problema es el FormData
  // console.log("Cuerpo recibido:", req.body);

  // if (!req.file) {
  //     return res.status(400).json({ error: "No se ha subido ninguna imagen" });
  // }

  const { nombre, precio, stock, descripcion } = req.body;
  const nombreImagen = req.file ? req.file.filename : 'imagen_articulo_por_defecto.jpg';

  const sql = 'INSERT INTO productos (nombre, precio, stock, imagen, descripcion) VALUES (?, ?, ?, ?, ?)';
  conexion.query(sql, [nombre, precio, stock, nombreImagen, descripcion], (err, resultado) => {
    if (err) return res.status(500).json({ error: 'Error al guardar' });
    res.status(201).json({ mensaje: 'Producto creado', id: resultado.insertId });
  });
});

// Editar producto existente
app.put('/api/catalogo-admin/:id', upload.single('imagen'), (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock, descripcion, categoria_id } = req.body;

  // 1. Limpieza de datos (Evita el Error 500 si algún número llega como string vacío)
  const finalPrecio = parseFloat(precio) || 0;
  const finalStock = parseInt(stock) || 0;
  const finalCategoria = parseInt(categoria_id) || 1; // 1 es tu categoría por defecto

  let sql = "UPDATE productos SET nombre = ?, precio = ?, stock = ?, descripcion = ?, categoria_id = ?";
  let params = [nombre, finalPrecio, finalStock, descripcion, finalCategoria];

  if (req.file) {
    // Si el usuario subió una imagen nueva, la añadimos a la consulta
    sql += ", imagen = ?";
    params.push(req.file.filename);
  }

  sql += " WHERE id = ?";
  params.push(id);

  conexion.query(sql, params, (err, result) => {
    if (err) {
      // 2. Log detallado para que sepas por qué falló exactamente
      console.error("❌ ERROR SQL EN UPDATE:", err.message);
      return res.status(500).json({
        error: 'Error al actualizar el producto',
        detalle: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'No se encontró el producto con ese ID' });
    }

    res.json({ mensaje: 'Producto actualizado con éxito' });
  });
});

// Eliminar producto
app.delete('/api/catalogo-admin/:id', (req, res) => {
  const { id } = req.params;

  conexion.query("DELETE FROM productos WHERE id = ?", [id], (err, result) => {
    if (err) {
      // Código 1451: El producto está en Detalle_Pedidos o Carrito
      if (err.errno === 1451) {
        return res.status(409).json({
          mensaje: 'Este producto no se puede eliminar físicamente porque ya aparece en pedidos realizados.'
        });
      }
      return res.status(500).json({ error: 'Error al eliminar' });
    }
    res.json({ mensaje: 'Borrado correctamente' });
  });
});


// --- RUTAS DE CARRITO  ---
app.post('/api/pedidos', (req, res) => {
  const { usuario_id, total, productos } = req.body;

  // PRIMERO: Validar que el usuario tenga los datos completos
  const sqlCheckUser = "SELECT telefono, genero, domicilio, cp, ciudad, comunidad_autonoma, pais FROM usuarios WHERE id = ?";

  conexion.query(sqlCheckUser, [usuario_id], (errUser, users) => {
    if (errUser) return res.status(500).json({ error: "Error al verificar usuario" });

    const u = users[0];
    // Comprobamos si falta algún dato esencial para el envío
    if (!u.telefono || !u.domicilio || !u.cp || !u.ciudad || !u.genero || !u.comunidad_autonoma) {
      return res.status(403).json({
        code: 'INCOMPLETE_PROFILE',
        message: 'Debes completar tu perfil (dirección, teléfono, CP) antes de realizar una compra.'
      });
    }

    // SI ESTÁ COMPLETO: Proceder con la creación del pedido (tu código original)
    const sqlPedido = "INSERT INTO Pedidos (usuario_id, total, estado_pago) VALUES (?, ?, 'pagado')";

    conexion.query(sqlPedido, [usuario_id, total], (err, result) => {
      if (err) return res.status(500).json({ error: "Error al crear pedido" });

      const pedidoId = result.insertId;
      const valoresDetalles = productos.map(p => [pedidoId, p.producto_id || p.id, p.cantidad, p.precio_unitario || p.precio]);
      const sqlDetalles = "INSERT INTO Detalle_Pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES ?";

      conexion.query(sqlDetalles, [valoresDetalles], (errDetalle) => {
        if (errDetalle) return res.status(500).json({ error: "Error en detalles" });

        // Actualizar Stock
        const promesasStock = productos.map(p => {
          return new Promise((resolve, reject) => {
            const idProd = p.producto_id || p.id;
            const sqlUpdate = "UPDATE Productos SET stock = stock - ? WHERE id = ? AND stock >= ?";
            conexion.query(sqlUpdate, [p.cantidad, idProd, p.cantidad], (errS, resS) => {
              if (errS) return reject(errS);
              if (resS.affectedRows === 0) return reject(new Error(`Sin stock para ID ${idProd}`));
              resolve();
            });
          });
        });

        Promise.all(promesasStock)
          .then(() => {
            const sqlBorrar = "DELETE FROM carrito WHERE usuario_id = ?";
            conexion.query(sqlBorrar, [usuario_id], (errBorrar) => {
              if (errBorrar) return res.status(500).json({ error: "No se pudo vaciar el carrito" });
              res.json({ success: true, pedidoId: pedidoId });
            });
          })
          .catch(error => res.status(400).json({ error: error.message }));
      });
    });
  });
});

// --- RUTAS DE CARRITO  ---

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

app.post('/api/carrito', verificarToken, (req, res) => {
  const { producto_id, cantidad } = req.body;
  const sql = `
        INSERT INTO carrito (usuario_id, producto_id, cantidad) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE cantidad = cantidad + ?`;

  conexion.query(sql, [req.userId, producto_id, cantidad, cantidad], (err) => {
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
        FROM pedidos p
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

// Ruta para enviar el aviso por correo al cliente
app.post('/api/admin/pedidos/notificar', (req, res) => {
  const { pedidoId, emailCliente, motivo } = req.body;

  // Configuración del mensaje
  const mailOptions = {
    from: 'CarlaNatura <carlanatura2026@gmail.com>',
    to: emailCliente,
    subject: `⚠️ Información sobre su pedido #${pedidoId} - CarlaNatura`,
    html: `
            <div style="font-family: sans-serif; color: #333;">
                <h2 style="color: #2d7a4d;">Hola,</h2>
                <p>Le escribimos desde <b>CarlaNatura</b> en relación a su pedido con número de referencia <b>#${pedidoId}</b>.</p>
                <p>Nuestro equipo de administración necesita realizar un ajuste manual en su pedido por el siguiente motivo:</p>
                <blockquote style="background: #f4f4f4; padding: 15px; border-left: 5px solid #2d7a4d;">
                    ${motivo}
                </blockquote>
                <p>No es necesario que realice ninguna acción. Este correo es puramente informativo para mantener la transparencia en nuestra gestión.</p>
                <p>Gracias por su confianza.</p>
                <hr>
                <small>Atentamente, el equipo de CarlaNatura.</small>
            </div>
        `
  };

  // Envío real del correo
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      //console.error("Error al enviar email de notificación:", error);
      return res.status(500).json({ success: false, error: "Error al enviar el correo" });
    }
    //console.log("Email enviado: " + info.response);
    res.json({ success: true, message: "Correo enviado correctamente" });
  });
});

// Ruta para obtener los productos de UN pedido específico
app.get('/api/admin/pedidos/detalles/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
        SELECT d.*, p.nombre, p.imagen 
        FROM detalle_pedidos d
        INNER JOIN Productos p ON d.producto_id = p.id
        WHERE d.pedido_id = ?`;

  conexion.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.put('/api/admin/pedidos/:id', (req, res) => {
  const { id } = req.params; // Aquí Node recoge el "3" de la URL
  const { total, estado_pago } = req.body;

  const sql = "UPDATE pedidos SET total = ?, estado_pago = ? WHERE id = ?";

  conexion.query(sql, [total, estado_pago, id], (err, result) => {
    if (err) {
      console.error("Error al actualizar:", err);
      return res.status(500).json({ success: false, error: err.message });
    }

    // Si el ID no existe en la DB, result.affectedRows será 0
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, mensaje: "Pedido no encontrado" });
    }

    res.json({ success: true, mensaje: "Pedido actualizado correctamente" });
  });
});

// -- PERMITIR EL USO DE LA API Y USAR MI SERVIDOR DE PUENTE --
app.get('/api/proxy/cp/:cp', async (req, res) => {
  try {
    const { cp } = req.params;
    const response = await axios.get(`https://api.zippopotam.us/es/${cp}`);
    res.json(response.data);
  } catch (error) {
    res.status(404).json({ error: 'CP no encontrado' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});