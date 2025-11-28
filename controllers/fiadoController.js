// Actualizar fiado a pagado y guardar método de pago
exports.marcarPagado = (req, res) => {
  const { id_venta } = req.body;
  if (!id_venta) return res.status(400).json({ error: 'Datos incompletos' });
  const query = `UPDATE fiado SET estado_pago = 'pagado', fecha_cancelacion = NOW() WHERE id_venta = $1`;
  db.query(query, [id_venta], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar fiado' });
    res.json({ success: true });
  });
};
const db = require('../models/db');

// Obtener todos los fiados con cliente y estado
exports.listarFiados = (req, res) => {
  const query = `
  SELECT f.id_venta, v.fecha AS fecha_fiado, c.nombre || ' ' || c.apellidos AS cliente, v.total AS monto, f.estado_pago, f.fecha_limite_pago, TO_CHAR(f.fecha_cancelacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_cancelacion
    FROM fiado f
    JOIN venta v ON f.id_venta = v.id_venta
    JOIN cliente c ON v.id_cliente = c.id_cliente
    ORDER BY v.fecha DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener fiados' });
    res.json(results);
  });
};
