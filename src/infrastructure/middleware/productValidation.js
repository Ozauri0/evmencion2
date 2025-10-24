/**
 * Middleware de validación para productos
 * Asegura integridad de datos y campos requeridos
 */

/**
 * Esquema de validación para productos
 */
const PRODUCT_SCHEMA = {
  titulo: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-\_\.]+$/
  },
  descripcion: {
    required: true,
    type: 'string',
    minLength: 10,
    maxLength: 500
  },
  precio: {
    required: true,
    type: 'number',
    min: 0,
    max: 999999
  },
  nucleos: {
    required: true,
    type: 'number',
    min: 1,
    max: 128,
    integer: true
  },
  ram: {
    required: true,
    type: 'number',
    min: 1,
    max: 1024,
    integer: true
  },
  disco: {
    required: true,
    type: 'number',
    min: 1,
    max: 10000,
    integer: true
  },
  cluster: {
    required: false,
    type: 'string',
    maxLength: 50
  },
  estado: {
    required: false,
    type: 'string',
    enum: ['activo', 'inactivo', 'mantenimiento']
  }
};

/**
 * Validar un campo individual
 */
const validateField = (fieldName, value, rules) => {
  const errors = [];

  // Verificar si es requerido
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} es requerido`);
    return errors;
  }

  // Si no es requerido y está vacío, no validar más
  if (!rules.required && (value === undefined || value === null || value === '')) {
    return errors;
  }

  // Validar tipo
  if (rules.type === 'string' && typeof value !== 'string') {
    errors.push(`${fieldName} debe ser un texto`);
  }

  if (rules.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
    errors.push(`${fieldName} debe ser un número válido`);
  }

  // Validaciones específicas para strings
  if (rules.type === 'string' && typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${fieldName} debe tener al menos ${rules.minLength} caracteres`);
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${fieldName} debe tener máximo ${rules.maxLength} caracteres`);
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${fieldName} contiene caracteres no válidos`);
    }

    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${fieldName} debe ser uno de: ${rules.enum.join(', ')}`);
    }
  }

  // Validaciones específicas para números
  if (rules.type === 'number' && typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${fieldName} debe ser mayor o igual a ${rules.min}`);
    }

    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${fieldName} debe ser menor o igual a ${rules.max}`);
    }

    if (rules.integer && !Number.isInteger(value)) {
      errors.push(`${fieldName} debe ser un número entero`);
    }
  }

  return errors;
};

/**
 * Validar objeto completo contra esquema
 */
const validateObject = (data, schema) => {
  const errors = [];
  const validatedData = {};

  // Validar cada campo del esquema
  Object.keys(schema).forEach(fieldName => {
    const rules = schema[fieldName];
    const value = data[fieldName];
    
    const fieldErrors = validateField(fieldName, value, rules);
    errors.push(...fieldErrors);

    // Si no hay errores, agregar al objeto validado
    if (fieldErrors.length === 0 && value !== undefined) {
      validatedData[fieldName] = value;
    }
  });

  // Verificar campos no permitidos
  Object.keys(data).forEach(fieldName => {
    if (!schema[fieldName]) {
      errors.push(`Campo no permitido: ${fieldName}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    validatedData
  };
};

/**
 * Middleware para validar creación de productos
 */
const validateCreateProduct = (req, res, next) => {
  const validation = validateObject(req.body, PRODUCT_SCHEMA);

  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Datos de producto inválidos',
      message: 'Los datos proporcionados no cumplen con los requisitos',
      details: validation.errors
    });
  }

  // Reemplazar el body con los datos validados
  req.body = validation.validatedData;
  
  // Establecer valores por defecto si no se proporcionaron
  if (!req.body.estado) {
    req.body.estado = 'activo';
  }

  next();
};

/**
 * Middleware para validar actualización de productos
 */
const validateUpdateProduct = (req, res, next) => {
  // Para actualización, los campos no son todos requeridos
  const updateSchema = { ...PRODUCT_SCHEMA };
  
  // Hacer todos los campos no requeridos para actualización
  Object.keys(updateSchema).forEach(key => {
    updateSchema[key] = { ...updateSchema[key], required: false };
  });

  const validation = validateObject(req.body, updateSchema);

  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Datos de actualización inválidos',
      message: 'Los datos proporcionados no cumplen con los requisitos',
      details: validation.errors
    });
  }

  // Verificar que al menos un campo se esté actualizando
  if (Object.keys(validation.validatedData).length === 0) {
    return res.status(400).json({
      error: 'Sin datos para actualizar',
      message: 'Debe proporcionar al menos un campo válido para actualizar'
    });
  }

  req.body = validation.validatedData;
  next();
};

/**
 * Middleware para validar parámetros de ID
 */
const validateProductId = (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      error: 'ID requerido',
      message: 'Debe proporcionar un ID de producto válido'
    });
  }

  // Validar que sea un número entero positivo
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El ID debe ser un número entero positivo'
    });
  }

  // Convertir a número para facilitar su uso
  req.params.id = numericId;
  next();
};

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  PRODUCT_SCHEMA
};
