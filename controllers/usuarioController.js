const db = require('../models/db');
const bcrypt = require('bcrypt'); // si lo usas

// Verificar si el usuario está autenticado
exports.verificarSesion = (req, res) => {
    if (req.session && req.session.usuario) {
        res.json({ autenticado: true, usuario: req.session.usuario });
    } else {
        res.json({ autenticado: false });
    }
};

exports.login = (req, res) => {
  const { usuario, contraseña } = req.body;
  
  db.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la BD' });
    }
    
    if (result.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    const user = result[0];
    // Verificar contraseña (bcrypt.compare si está hasheada)
    
    req.session.usuario = user.id;
    res.json({ success: true, usuario: user.usuario });
  });
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.json({ success: true });
};
