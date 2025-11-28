const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
