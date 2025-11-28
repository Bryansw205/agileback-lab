const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

router.post('/venta', ventaController.registrarVenta);
router.get('/venta/:id/detalle', ventaController.detalleVenta);

module.exports = router;