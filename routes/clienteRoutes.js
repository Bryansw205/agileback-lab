const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');


// Solo clientes activos (para ventas)
router.get('/clientes', clienteController.getClientes);
// Todos los clientes (para módulo de clientes)
router.get('/clientes-todos', clienteController.getTodosClientes);
router.put('/clientes/:id_cliente', clienteController.editarCliente);
router.delete('/clientes/:id_cliente', clienteController.deshabilitarCliente);
router.post('/clientes', clienteController.crearCliente);

module.exports = router;
