const db = require('../models/db');
const bcrypt = require('bcrypt');

// Verificar si el usuario está autenticado
exports.verificarSesion = (req, res) => {
    if (req.session && req.session.usuario) {
        res.json({ autenticado: true, usuario: req.session.usuario });
    } else {
        res.json({ autenticado: false });
    }
};

exports.login = (req, res) => {
  // El frontend envía 'nombre' y 'contrasena'. Los renombramos para claridad.
  const { nombre: nombreUsuario, contrasena } = req.body;

  // La tabla se llama 'usuario' (singular) y la columna 'nombre' según el esquema.
  db.query('SELECT * FROM usuario WHERE nombre = $1', [nombreUsuario], (err, result) => {
    if (err) {
      console.error('Error en la consulta a la BD:', err);
      return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }

    if (result.length === 0) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }

    const user = result[0];

    // Comparar la contraseña enviada con la hasheada en la BD
    bcrypt.compare(contrasena, user.contrasena, (bcryptErr, match) => {
      if (bcryptErr) {
        console.error('Error en bcrypt.compare:', bcryptErr);
        return res.status(500).json({ mensaje: 'Error interno del servidor' });
      }
      if (!match) {
        return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
      }

      // Guardar datos del usuario en la sesión (sin la contraseña)
      req.session.usuario = { id_usuario: user.id_usuario, nombre: user.nombre, rol: user.rol };
      res.json({ success: true, usuario: req.session.usuario });
    });
  });
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.json({ success: true });
};
