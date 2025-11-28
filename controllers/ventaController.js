const db = require('../models/db');
const moment = require('moment-timezone');

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

// Registrar una venta
exports.registrarVenta = async (req, res) => {
  const { id_cliente, medio_compra, tipo_pago, forma_pago, productos, fiado } = req.body;
  const id_usuario = req.session?.usuario?.id_usuario;

  if (!id_usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // Validaciones básicas
  if (!id_cliente || !productos || productos.length === 0) {
    return res.status(400).json({ error: 'Faltan datos requeridos para la venta.' });
  }

  const fecha = moment().tz('America/Lima').format('YYYY-MM-DD HH:mm:ss');
  const client = await db.pool.connect(); // Obtener un cliente del pool

  try {
    await client.query('BEGIN'); // Iniciar transacción

    // 1. Insertar en la tabla 'venta'
    // El total se deja en 0 inicialmente, los triggers lo calcularán
    const ventaInsertQuery = `
      INSERT INTO venta (id_cliente, id_usuario, fecha, total, medio_compra, tipo_pago, forma_pago) 
      VALUES ($1, $2, $3, 0, $4, $5, $6) 
      RETURNING id_venta;
    `;
    const ventaValues = [id_cliente, id_usuario, fecha, medio_compra, tipo_pago, forma_pago];
    const ventaResult = await client.query(ventaInsertQuery, ventaValues);
    const id_venta = ventaResult.rows[0].id_venta;

    // 2. Insertar cada producto en 'detalleVenta'
    // Usamos Promise.all para ejecutar todas las inserciones en paralelo
    const detallePromises = productos.map(p => {
      const detalleInsertQuery = `
        INSERT INTO detalleVenta (id_venta, id_producto, cantidad, precio_cobrado, subtotal) 
        VALUES ($1, $2, $3, $4, $5);
      `;
      // El frontend envía 'precio', que usamos como 'precio_cobrado'
      const detalleValues = [id_venta, p.id_producto, p.cantidad, p.precio, p.subtotal];
      return client.query(detalleInsertQuery, detalleValues);
    });
    
    await Promise.all(detallePromises);

    // 3. Si es 'fiado', insertar en la tabla 'fiado'
    if (forma_pago === 'fiado' && fiado) {
      if (!fiado.fecha_limite_pago) {
        throw new Error('La fecha límite de pago es requerida para un fiado.');
      }
      const fiadoInsertQuery = `
        INSERT INTO fiado (id_venta, estado_pago, fecha_limite_pago) 
        VALUES ($1, 'pendiente', $2);
      `;
      await client.query(fiadoInsertQuery, [id_venta, fiado.fecha_limite_pago]);
    }

    await client.query('COMMIT'); // Finalizar la transacción
    
    res.json({ success: true, id_venta });

  } catch (error) {
    await client.query('ROLLBACK'); // Revertir en caso de error
    console.error('Error en transacción de venta:', error);
    // Devuelve un mensaje de error más específico si es una excepción de la base de datos
    if (error.routine && (error.routine.includes('RI_FKey_') || error.routine.includes('check_violation'))) {
        return res.status(400).json({ error: 'Error de validación de datos. Verifique que el cliente y los productos existan.' });
    }
    if (error.message.includes('stock')) {
       return res.status(400).json({ error: 'No hay suficiente stock para uno de los productos.' });
    }
    res.status(500).json({ error: 'Error al registrar la venta.', detalle: error.message });
  } finally {
    client.release(); // Liberar el cliente de vuelta al pool
  }
};
