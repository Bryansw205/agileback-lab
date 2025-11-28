const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const db = require('../models/db');

// Verificar si el usuario está autenticado
exports.verificarSesion = (req, res) => {
    if (req.session && req.session.usuario) {
        res.json({ autenticado: true, usuario: req.session.usuario });
    } else {
        res.json({ autenticado: false });
    }
};

export const login = async (usuario, contraseña) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ usuario, contraseña })
    });
    return response.json();
};

// Para backend, usa process.env:
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
    // Verificar contraseña aquí (bcrypt)
    
    res.json({ success: true, usuario: user.usuario });
  });
};
