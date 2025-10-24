const express = require('express');
const ServerController = require('../controllers/ProductController');
const { requirePermission, checkResourceOwnership, PERMISSIONS } = require('../middleware/accessControlMiddleware');
const { 
  validateCreateProduct, 
  validateUpdateProduct, 
  validateProductId 
} = require('../middleware/productValidation');

/**
 * A01:2021 - Broken Access Control
 * Rutas de productos con control de acceso basado en permisos
 */
function serverRoutes(getServers, getServerById, createServer, updateServer, deleteServer) {
  const router = express.Router();
  const controller = new ServerController(getServers, getServerById, createServer, updateServer, deleteServer);

  //GET /productos - Requiere permiso de lectura
  router.get('/', 
    requirePermission(PERMISSIONS.READ_PRODUCTS),
    controller.getAll.bind(controller)
  );
  
  //GET /productos/:id - Requiere permiso de lectura + validación de ID + propiedad
  router.get('/:id', 
    validateProductId,
    requirePermission(PERMISSIONS.READ_PRODUCTS),
    checkResourceOwnership,
    controller.getById.bind(controller)
  );
  
  //POST /productos - Requiere permiso de creación + validación de datos
  router.post('/', 
    requirePermission(PERMISSIONS.CREATE_PRODUCTS),
    validateCreateProduct,
    controller.create.bind(controller)
  );
  
  //PUT /productos/:id - Requiere validación + permisos + propiedad
  router.put('/:id', 
    validateProductId,
    requirePermission(PERMISSIONS.UPDATE_PRODUCTS),
    validateUpdateProduct,
    checkResourceOwnership,
    controller.update.bind(controller)
  );
  
  //PATCH /productos/:id - Requiere validación + permisos + propiedad
  router.patch('/:id', 
    validateProductId,
    requirePermission(PERMISSIONS.UPDATE_PRODUCTS),
    validateUpdateProduct,
    checkResourceOwnership,
    controller.update.bind(controller)
  );
  
  //DELETE /productos/:id - Requiere validación + permisos + propiedad
  router.delete('/:id', 
    validateProductId,
    requirePermission(PERMISSIONS.DELETE_PRODUCTS),
    checkResourceOwnership,
    controller.delete.bind(controller)
  );

  return router;
}

module.exports = serverRoutes;
