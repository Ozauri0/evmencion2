const jwt = require('jsonwebtoken');

/**
 * A01:2021 - Broken Access Control
 * Middleware para controlar el acceso basado en roles y permisos
 */

// Simulamos roles y permisos para el trabajo práctico
const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  READONLY: 'readonly'
};

const PERMISSIONS = {
  READ_PRODUCTS: 'read:products',
  CREATE_PRODUCTS: 'create:products',
  UPDATE_PRODUCTS: 'update:products',
  DELETE_PRODUCTS: 'delete:products'
};

// Mapeo de roles a permisos
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.READ_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.UPDATE_PRODUCTS,
    PERMISSIONS.DELETE_PRODUCTS
  ],
  [ROLES.USER]: [
    PERMISSIONS.READ_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.UPDATE_PRODUCTS
  ],
  [ROLES.READONLY]: [
    PERMISSIONS.READ_PRODUCTS
  ]
};

/**
 * Middleware de autenticación mejorado
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso denegado',
      message: 'Token de autorización requerido'
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, 'secreto123');
    
    // Validación adicional del token
    if (!decoded.user || !decoded.role) {
      return res.status(403).json({
        error: 'Token inválido',
        message: 'El token no contiene información válida de usuario'
      });
    }
    
    // Agregar información del usuario al request
    req.user = {
      id: decoded.user,
      role: decoded.role,
      permissions: ROLE_PERMISSIONS[decoded.role] || []
    };
    
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Token inválido',
      message: 'El token proporcionado no es válido o ha expirado'
    });
  }
};

/**
 * Middleware para verificar permisos específicos
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debe autenticarse primero'
      });
    }
    
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        message: `Se requiere el permiso: ${permission}`
      });
    }
    
    next();
  };
};

/**
 * Middleware para verificar acceso a recursos específicos
 * Previene acceso horizontal no autorizado
 */
const checkResourceOwnership = (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // En un entorno real, aquí validaríamos contra la base de datos
  // Para el trabajo práctico, simulamos la validación
  if (req.user.role === ROLES.ADMIN) {
    // Los administradores pueden acceder a cualquier recurso
    return next();
  }
  
  // Simular validación de propiedad del recurso
  // En la práctica, esto consultaría la base de datos
  req.resourceOwner = userId; // Simulación
  next();
};

/**
 * Middleware para limitar acceso a endpoints administrativos
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requieren privilegios de administrador'
    });
  }
  next();
};

module.exports = {
  authenticate,
  requirePermission,
  checkResourceOwnership,
  requireAdmin,
  ROLES,
  PERMISSIONS
};
