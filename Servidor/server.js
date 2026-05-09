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
      console.log(err);
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
      console.error("ERROR SQL AL GUARDAR:", err);
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
  // Los textos vienen en req.body
  const { titulo, categoria, contenido, urlExterna, autor_id, fecha_publicacion } = req.body;

  // El nombre del archivo viene de Multer (si se subió uno)
  const nombreImagen = req.file ? req.file.filename : null;

  if (!titulo || !contenido || !categoria) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const sql = 'INSERT INTO blog_posts (titulo, categoria, contenido, imagen, urlExterna, autor_id, fecha_publicacion) VALUES (?, ?, ?, ?, ?, ?, ?)';

  const fechaFormateada = new Date(fecha_publicacion || Date.now())
    .toISOString().slice(0, 19).replace('T', ' ');

  const valores = [
    titulo,
    categoria,
    contenido,
    nombreImagen, // <--- Solo el nombre del archivo
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
  const { nombre, precio, stock, descripcion } = req.body;
  let sql = "UPDATE productos SET nombre = ?, precio = ?, stock = ?, descripcion = ?";
  let params = [nombre, precio, stock, descripcion];

  if (req.file) {
    // SI HAY FOTO NUEVA, SOLO GUARDAMOS EL NOMBRE
    sql += ", imagen = ?";
    params.push(req.file.filename);
  }

  sql += " WHERE id = ?";
  params.push(id);

  conexion.query(sql, params, (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar' });
    res.json({ mensaje: 'Producto actualizado' });
  });
});

// Eliminar producto
app.delete('/api/catalogo-admin/:id', (req, res) => {
  conexion.query('DELETE FROM productos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error' });
    res.json({ mensaje: 'Eliminado' });
  });
});


// --- RUTAS DE CARRITO  ---
app.post('/api/pedidos', (req, res) => {
  const { usuario_id, total, productos } = req.body;
  //console.log("ID de usuario recibido:", usuario_id);

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
          // AQUÍ ESTÁ LA CLAVE: Borrar de la tabla Carrito
          const sqlBorrar = "DELETE FROM Carrito WHERE usuario_id = ?";
          conexion.query(sqlBorrar, [usuario_id], (errBorrar) => {
            if (errBorrar) return res.status(500).json({ error: "No se pudo vaciar el carrito" });

            // Enviamos éxito SOLO tras borrar de la BD
            res.json({ success: true, pedidoId: pedidoId });
          });
        })
        .catch(error => res.status(400).json({ error: error.message }));
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
        FROM Detalle_Pedidos d
        INNER JOIN Productos p ON d.producto_id = p.id
        WHERE d.pedido_id = ?`;

    conexion.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.put('/api/admin/pedidos/:id', (req, res) => {
    const { id } = req.params;
    const { total, estado_pago } = req.body;

    const sql = "UPDATE Pedidos SET total = ?, estado_pago = ? WHERE id = ?";
    
    conexion.query(sql, [total, estado_pago, id], (err, result) => {
        if (err) {
            console.error("Error SQL:", err);
            return res.status(500).json({ error: "Error al actualizar" });
        }
        res.json({ success: true, mensaje: "Pedido actualizado" });
    });
});

app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});