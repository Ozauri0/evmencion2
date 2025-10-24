/**
 * Test unitario 3: Middleware de validación de productos
 * Prueba las validaciones de entrada de la API
 */

const { 
  validateCreateProduct, 
  validateUpdateProduct, 
  validateProductId 
} = require('../src/infrastructure/middleware/productValidation');

describe('Product Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('validateCreateProduct', () => {
    test('debe pasar con datos válidos', () => {
      req.body = {
        titulo: 'Servidor Test',
        descripcion: 'Descripción válida de al menos 10 caracteres',
        precio: 1000,
        nucleos: 4,
        ram: 8,
        disco: 100,
        cluster: 'Test Cluster',
        estado: 'activo'
      };

      validateCreateProduct(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe fallar con título faltante', () => {
      req.body = {
        descripcion: 'Descripción válida',
        precio: 1000,
        nucleos: 4,
        ram: 8,
        disco: 100
      };

      validateCreateProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Datos de producto inválidos',
          details: expect.arrayContaining(['titulo es requerido'])
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debe fallar con precio negativo', () => {
      req.body = {
        titulo: 'Test',
        descripcion: 'Descripción válida',
        precio: -100,
        nucleos: 4,
        ram: 8,
        disco: 100
      };

      validateCreateProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining(['precio debe ser mayor o igual a 0'])
        })
      );
    });

    test('debe establecer estado por defecto si no se proporciona', () => {
      req.body = {
        titulo: 'Servidor Test',
        descripcion: 'Descripción válida de prueba',
        precio: 1000,
        nucleos: 4,
        ram: 8,
        disco: 100
      };

      validateCreateProduct(req, res, next);

      expect(req.body.estado).toBe('activo');
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateProductId', () => {
    test('debe pasar con ID válido', () => {
      req.params.id = '123';

      validateProductId(req, res, next);

      expect(req.params.id).toBe(123);
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('debe fallar con ID no numérico', () => {
      req.params.id = 'abc';

      validateProductId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ID inválido',
          message: 'El ID debe ser un número entero positivo'
        })
      );
    });

    test('debe fallar con ID negativo', () => {
      req.params.id = '-5';

      validateProductId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateUpdateProduct', () => {
    test('debe pasar con al menos un campo válido', () => {
      req.body = {
        titulo: 'Test123' // Título que cumpla el patrón regex
      };

      validateUpdateProduct(req, res, next);

      if (!next.mock.calls.length) {
        // Si no funcionó, imprimir el error para debugear
        console.log('Status calls:', res.status.mock.calls);
        console.log('JSON calls:', res.json.mock.calls);
      }

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('debe fallar sin ningún campo válido', () => {
      req.body = {};

      validateUpdateProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Sin datos para actualizar'
        })
      );
    });
  });
});
