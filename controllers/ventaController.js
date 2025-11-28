// Obtener detalle de una venta
exports.detalleVenta = (req, res) => {
  const id_venta = req.params.id;
  if (!id_venta) return res.status(400).json({ error: 'ID de venta requerido' });
  // Consulta principal de la venta
  db.query(`
    SELECT v.id_venta, v.fecha, v.total, v.medio_compra, v.tipo_pago, v.forma_pago,
           c.nombre AS cliente_nombre, c.apellidos AS cliente_apellidos
      FROM venta v
      JOIN cliente c ON v.id_cliente = c.id_cliente
      WHERE v.id_venta = $1
  `, [id_venta], (err, ventaRows) => {
    if (err || ventaRows.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });
    const venta = ventaRows[0];
    // Consulta productos del detalle
    db.query(`
      SELECT p.nombre AS producto, dv.cantidad, dv.precio_cobrado, dv.subtotal
        FROM detalleVenta dv
        JOIN producto p ON dv.id_producto = p.id_producto
        WHERE dv.id_venta = $1
    `, [id_venta], (err, productos) => {
      if (err) return res.status(500).json({ error: 'Error al obtener productos' });
      // Calcular subtotal e IGV
      const subtotal = productos.reduce((acc, p) => acc + parseFloat(p.subtotal), 0);
      const igv = +(subtotal * 0.18).toFixed(2);
      const total = +(subtotal + igv).toFixed(2);
      res.json({
        id_venta: venta.id_venta,
        cliente: venta.cliente_nombre + ' ' + venta.cliente_apellidos,
        fecha: venta.fecha,
        medio_compra: venta.medio_compra,
        tipo_pago: venta.tipo_pago,
        forma_pago: venta.forma_pago,
        productos,
        subtotal,
        igv,
        total: venta.total
      });
    });
  });
};
const db = require('../models/db');
const moment = require('moment-timezone');

// Registrar una venta
exports.registrarVenta = (req, res) => {
  const { id_cliente, total, medio_compra, tipo_pago, forma_pago, productos, fiado } = req.body;
  // Tomar el id_usuario de la sesión
  const id_usuario = req.session?.usuario?.id_usuario;
  if (!id_usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  // Usar fecha actual en formato DATETIME, zona horaria Perú
  const fecha = moment().tz('America/Lima').format('YYYY-MM-DD HH:mm:ss');
  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: 'Error al iniciar transacción' });
    db.query(
      'INSERT INTO venta (id_cliente, id_usuario, fecha, total, medio_compra, tipo_pago, forma_pago) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_cliente, id_usuario, fecha, total, medio_compra, tipo_pago, forma_pago],
      (err, result) => {
        if (err) {
          console.error('Error MySQL al guardar venta:', err);
          return db.rollback(() => res.status(500).json({ error: err.message, code: err.code }));
        }
        const id_venta = result.insertId;
        // Insertar detalleVenta uno por uno
        let detalleError = false;
        let detallesInsertados = 0;
        productos.forEach((p, idx) => {
          db.query(
            'INSERT INTO detalleVenta (id_venta, id_producto, cantidad, precio_cobrado, subtotal) VALUES (?, ?, ?, ?, ?)',
            [id_venta, p.id_producto, p.cantidad, p.precio, p.subtotal],
            (err) => {
              if (detalleError) return;
              if (err) {
                detalleError = true;
                return db.rollback(() => res.status(500).json({ error: 'Error al guardar detalleVenta' }));
              }
              detallesInsertados++;
              if (detallesInsertados === productos.length) {
                // Si es fiado, guardar en tabla fiado
                if (forma_pago === 'fiado' && fiado) {
                  db.query(
                    'INSERT INTO fiado (id_venta, estado_pago, fecha_limite_pago) VALUES (?, ?, ?)',
                    [id_venta, 'pendiente', fiado.fecha_limite_pago],
                    (err) => {
                      if (err) return db.rollback(() => res.status(500).json({ error: 'Error al guardar fiado' }));
                      db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ error: 'Error al finalizar venta' }));
                        res.json({ success: true, id_venta });
                      });
                    }
                  );
                } else {
                  db.commit(err => {
                    if (err) return db.rollback(() => res.status(500).json({ error: 'Error al finalizar venta' }));
                    res.json({ success: true, id_venta });
                  });
                }
              }
            }
          );
        });
      }
    );
  });
};
