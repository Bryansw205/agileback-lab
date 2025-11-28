const express = require('express');
const router = express.Router();
const fiadoController = require('../controllers/fiadoController');


router.get('/fiados', fiadoController.listarFiados);
router.post('/fiado/pagar', fiadoController.marcarPagado);

module.exports = router;
