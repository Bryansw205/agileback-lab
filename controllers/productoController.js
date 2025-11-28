// Crear producto
exports.crearProducto = (req, res) => {
  const { nombre, categoria, precio, stock, activo } = req.body;
  if (!nombre || !precio || !stock) {
    return res.status(400).json({ error: 'Nombre, precio y stock son obligatorios' });
  }
  db.query(
    'INSERT INTO producto (nombre, categoria, precio, stock, activo) VALUES ($1, $2, $3, $4, $5)',
    [nombre, categoria || '', precio, stock, activo !== false],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al crear producto', detalle: err.message });
      res.json({ id_producto: result.insertId });
    }
  );
};
// Editar producto
exports.editarProducto = (req, res) => {
  const { id_producto } = req.params;
  const { nombre, categoria, precio, stock, activo } = req.body;
  db.query(
    'UPDATE producto SET nombre=$1, categoria=$2, precio=$3, stock=$4, activo=$5 WHERE id_producto=$6',
    [nombre, categoria, precio, stock, activo !== false, id_producto],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al editar producto', detalle: err.message });
      res.json({ success: true });
    }
  );
};
const db = require('../models/db');

exports.getProductos = (req, res) => {
  db.query('SELECT id_producto, nombre, categoria, precio, stock, activo FROM producto', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener productos' });
    res.json(results);
  });
};

// Deshabilitar producto (eliminar lógico)
exports.deshabilitarProducto = (req, res) => {
  const { id_producto } = req.params;
  db.query(
    'UPDATE producto SET activo=FALSE WHERE id_producto=$1',
    [parseInt(id_producto)],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al deshabilitar producto', detalle: err.message });
      res.json({ success: true });
    }
  );
};
