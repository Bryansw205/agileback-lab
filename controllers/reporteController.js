const db = require('../models/db');

// Obtener todas las ventas con cliente y vendedor
exports.listarVentas = (req, res) => {
  const query = `
    SELECT v.id_venta, v.fecha, v.total, CONCAT(c.nombre, ' ', c.apellidos) AS cliente, u.nombre AS vendedor
    FROM venta v
    JOIN cliente c ON v.id_cliente = c.id_cliente
    JOIN usuario u ON v.id_usuario = u.id_usuario
    ORDER BY v.fecha DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener ventas' });
    res.json(results);
  });
};
