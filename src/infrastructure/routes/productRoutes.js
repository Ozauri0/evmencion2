const express = require('express');
const ServerController = require('../controllers/ProductController');
const authenticate = require('../middleware/authMiddleware');

function serverRoutes(getServers, getServerById, createServer, updateServer, deleteServer) {
  const router = express.Router();
  const controller = new ServerController(getServers, getServerById, createServer, updateServer, deleteServer);

  router.get('/', controller.getAll.bind(controller));
  router.get('/:id', controller.getById.bind(controller));
  router.post('/', authenticate, controller.create.bind(controller));
  router.put('/:id', controller.update.bind(controller));
  router.patch('/:id', controller.update.bind(controller)); // PATCH igual que PUT para simplicidad
  router.delete('/:id', controller.delete.bind(controller));

  return router;
}

module.exports = serverRoutes;
