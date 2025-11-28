const db = require('../models/db');

// Solo clientes activos (para ventas)
exports.getClientes = (req, res) => {
  db.query('SELECT id_cliente, nombre, apellidos, direccion, telefono, activo FROM cliente WHERE activo=1', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener clientes' });
    res.json(results);
  });
};

// Todos los clientes (para módulo de clientes)
exports.getTodosClientes = (req, res) => {
  db.query('SELECT id_cliente, nombre, apellidos, direccion, telefono, activo FROM cliente', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener clientes' });
    res.json(results);
  });
};

  // Registrar un nuevo cliente
  exports.crearCliente = (req, res) => {
    const { nombre, apellidos, direccion, telefono } = req.body;
    if (!nombre || !apellidos) {
      return res.status(400).json({ error: 'Nombre y apellidos son obligatorios' });
    }
    db.query(
      'INSERT INTO cliente (nombre, apellidos, direccion, telefono, activo) VALUES ($1, $2, $3, $4, $5)',
      [nombre, apellidos, direccion || '', telefono || '', true],
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al crear cliente', detalle: err.message });
        res.json({ id_cliente: result.insertId });
      }
    );
  };

    // Editar cliente
    exports.editarCliente = (req, res) => {
      const { id_cliente } = req.params;
      const { nombre, apellidos, direccion, telefono, activo } = req.body;
      const activoValue = (activo === true || activo === 'true' || activo === 1 || activo === '1') ? 1 : 0;
      db.query(
        'UPDATE cliente SET nombre=$1, apellidos=$2, direccion=$3, telefono=$4, activo=$5 WHERE id_cliente=$6',
        [nombre, apellidos, direccion || '', telefono || '', activoValue, id_cliente],
        (err) => {
          if (err) return res.status(500).json({ error: 'Error al editar cliente', detalle: err.message });
          res.json({ success: true });
        }
      );
    };

    // Deshabilitar cliente (eliminar lógico)
    exports.deshabilitarCliente = (req, res) => {
      const { id_cliente } = req.params;
      db.query(
        'UPDATE cliente SET activo=FALSE WHERE id_cliente=$1',
        [parseInt(id_cliente)],
        (err) => {
          if (err) return res.status(500).json({ error: 'Error al deshabilitar cliente', detalle: err.message });
          res.json({ success: true });
        }
      );
    };
