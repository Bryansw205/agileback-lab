// Verificar si el usuario está autenticado
exports.verificarSesion = (req, res) => {
    if (req.session && req.session.usuario) {
        res.json({ autenticado: true, usuario: req.session.usuario });
    } else {
        res.json({ autenticado: false });
    }
};
const db = require('../models/db');

exports.login = (req, res) => {
    const { nombre, contrasena } = req.body;
    if (!nombre || !contrasena) {
        return res.status(400).json({ mensaje: 'Faltan datos' });
    }
    const query = 'SELECT * FROM usuario WHERE nombre = ? AND contrasena = ?';
    db.query(query, [nombre, contrasena], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error en el servidor' });
        if (results.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }
        // Guardar solo el id_usuario y nombre en la sesión (básico)
        req.session.usuario = {
            id_usuario: results[0].id_usuario,
            nombre: results[0].nombre
        };
        res.json({ mensaje: 'Login exitoso', usuario: req.session.usuario });
    });
};
