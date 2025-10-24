/**
 * Test unitario 5: Middleware de control de acceso
 * Prueba la autenticación y autorización
 */

const jwt = require('jsonwebtoken');
const { 
  authenticate, 
  requirePermission, 
  ROLES, 
  PERMISSIONS 
} = require('../src/infrastructure/middleware/accessControlMiddleware');

// Mock de JWT
jest.mock('jsonwebtoken');

describe('Access Control Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    test('debe pasar con token válido', () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({
        user: 'testuser',
        role: ROLES.ADMIN
      });

      authenticate(req, res, next);

      expect(req.user).toEqual({
        id: 'testuser',
        role: ROLES.ADMIN,
        permissions: expect.any(Array)
      });
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('debe fallar sin header de autorización', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acceso denegado',
          message: 'Token de autorización requerido'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debe fallar con formato de token inválido', () => {
      req.headers.authorization = 'InvalidFormat';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('debe fallar con token expirado', () => {
      req.headers.authorization = 'Bearer expired-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token inválido'
        })
      );
    });

    test('debe asignar permisos según el rol', () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({
        user: 'testuser',
        role: ROLES.USER
      });

      authenticate(req, res, next);

      expect(req.user.permissions).toEqual([
        PERMISSIONS.READ_PRODUCTS,
        PERMISSIONS.CREATE_PRODUCTS,
        PERMISSIONS.UPDATE_PRODUCTS
      ]);
    });
  });

  describe('requirePermission', () => {
    test('debe pasar si el usuario tiene el permiso requerido', () => {
      req.user = {
        id: 'testuser',
        role: ROLES.ADMIN,
        permissions: [PERMISSIONS.READ_PRODUCTS, PERMISSIONS.CREATE_PRODUCTS]
      };

      const middleware = requirePermission(PERMISSIONS.READ_PRODUCTS);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    test('debe fallar si el usuario no tiene el permiso', () => {
      req.user = {
        id: 'testuser',
        role: ROLES.READONLY,
        permissions: [PERMISSIONS.READ_PRODUCTS]
      };

      const middleware = requirePermission(PERMISSIONS.DELETE_PRODUCTS);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Permisos insuficientes',
          message: `Se requiere el permiso: ${PERMISSIONS.DELETE_PRODUCTS}`
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('debe fallar si no hay usuario autenticado', () => {
      const middleware = requirePermission(PERMISSIONS.READ_PRODUCTS);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No autenticado'
        })
      );
    });
  });

  describe('ROLES y PERMISSIONS', () => {
    test('debe tener roles definidos correctamente', () => {
      expect(ROLES.ADMIN).toBe('admin');
      expect(ROLES.USER).toBe('user');
      expect(ROLES.READONLY).toBe('readonly');
    });

    test('debe tener permisos definidos correctamente', () => {
      expect(PERMISSIONS.READ_PRODUCTS).toBe('read:products');
      expect(PERMISSIONS.CREATE_PRODUCTS).toBe('create:products');
      expect(PERMISSIONS.UPDATE_PRODUCTS).toBe('update:products');
      expect(PERMISSIONS.DELETE_PRODUCTS).toBe('delete:products');
    });

    test('admin debe tener todos los permisos', () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({
        user: 'admin',
        role: ROLES.ADMIN
      });

      authenticate(req, res, next);

      expect(req.user.permissions).toEqual([
        PERMISSIONS.READ_PRODUCTS,
        PERMISSIONS.CREATE_PRODUCTS,
        PERMISSIONS.UPDATE_PRODUCTS,
        PERMISSIONS.DELETE_PRODUCTS
      ]);
    });

    test('readonly solo debe tener permiso de lectura', () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({
        user: 'readonly',
        role: ROLES.READONLY
      });

      authenticate(req, res, next);

      expect(req.user.permissions).toEqual([
        PERMISSIONS.READ_PRODUCTS
      ]);
    });
  });
});
