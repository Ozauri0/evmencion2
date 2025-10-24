/**
 * A03:2021 - Injection
 * Middleware y utilidades para prevenir ataques de inyección
 */

/**
 * Lista de patrones peligrosos para detectar intentos de inyección
 */
const DANGEROUS_PATTERNS = [
  // SQL Injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  /(UNION\s+SELECT)/gi,
  /('|(\\x27)|(\\x2D\\x2D)|(\\\'))/gi,
  /(;|\|\||&&)/gi,
  
  // NoSQL Injection patterns
  /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex)/gi,
  
  // Command Injection patterns
  /(;|&&|\|\||`|\$\()/gi,
  /(\.\.)/gi,
  /(\/bin\/|\/usr\/|\/etc\/|\/var\/)/gi,
  
  // XSS patterns
  /(<script|<\/script>|javascript:|on\w+\s*=)/gi,
  /(<iframe|<object|<embed|<link|<meta)/gi,
  /(expression\(|url\(|@import)/gi,
  
  // LDAP Injection patterns
  /(\*|\(\)|\|\||&&)/gi,
  
  // XML Injection patterns
  /(<!DOCTYPE|<!ENTITY|<\?xml)/gi
];

/**
 * Caracteres que deben ser escapados o eliminados
 */
const DANGEROUS_CHARS = [
  '<', '>', '"', "'", '&', '/', '\\', 
  ';', '|', '&', '$', '`', '(', ')', 
  '{', '}', '[', ']', '*', '?', '+', 
  '^', '!', '=', '%'
];

/**
 * Sanitiza entrada de texto para prevenir inyecciones
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  let sanitized = input;
  
  // Eliminar caracteres nulos
  sanitized = sanitized.replace(/\0/g, '');
  
  // Escapar caracteres peligrosos
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
};

/**
 * Valida entrada para detectar patrones de inyección
 */
const validateInput = (input) => {
  if (typeof input !== 'string') {
    return { isValid: true, threats: [] };
  }
  
  const threats = [];
  
  DANGEROUS_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(input)) {
      threats.push({
        type: 'injection_pattern',
        pattern: pattern.source,
        description: 'Patrón de inyección detectado'
      });
    }
  });
  
  return {
    isValid: threats.length === 0,
    threats
  };
};

/**
 * Middleware para validar entrada contra inyecciones
 */
const preventInjection = (req, res, next) => {
  const checkObject = (obj, path = '') => {
    const threats = [];
    
    if (typeof obj === 'string') {
      const validation = validateInput(obj);
      if (!validation.isValid) {
        threats.push(...validation.threats.map(threat => ({
          ...threat,
          field: path,
          value: obj.substring(0, 50) + (obj.length > 50 ? '...' : '')
        })));
      }
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const fieldPath = path ? `${path}.${key}` : key;
        threats.push(...checkObject(obj[key], fieldPath));
      });
    }
    
    return threats;
  };
  
  const allThreats = [];
  
  // Validar query parameters
  if (req.query) {
    allThreats.push(...checkObject(req.query, 'query'));
  }
  
  // Validar body parameters
  if (req.body) {
    allThreats.push(...checkObject(req.body, 'body'));
  }
  
  // Validar headers sospechosos
  const suspiciousHeaders = ['user-agent', 'referer', 'x-forwarded-for'];
  suspiciousHeaders.forEach(header => {
    if (req.headers[header]) {
      const validation = validateInput(req.headers[header]);
      if (!validation.isValid) {
        allThreats.push(...validation.threats.map(threat => ({
          ...threat,
          field: `headers.${header}`,
          value: req.headers[header].substring(0, 50)
        })));
      }
    }
  });
  
  if (allThreats.length > 0) {
    console.warn('🚨 Intento de inyección detectado:', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      threats: allThreats,
      timestamp: new Date().toISOString()
    });
    
    return res.status(400).json({
      error: 'Entrada inválida',
      message: 'Se detectaron patrones potencialmente peligrosos en la entrada',
      details: 'Por razones de seguridad, la solicitud ha sido rechazada'
    });
  }
  
  next();
};

/**
 * Sanitiza recursivamente un objeto
 */
const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  } else if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    Object.keys(obj).forEach(key => {
      sanitized[key] = sanitizeObject(obj[key]);
    });
    return sanitized;
  }
  return obj;
};

/**
 * Middleware para sanitizar automáticamente las entradas
 */
const autoSanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

/**
 * Validador específico para GraphQL para prevenir inyecciones
 */
const validateGraphQLQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return { isValid: false, error: 'Query inválido' };
  }
  
  // Patrones específicos para GraphQL
  const dangerousGraphQLPatterns = [
    /introspection/gi,
    /__schema/gi,
    /__type/gi,
    /\.\.\./g, // Fragment spread attacks
    /union\s+\w+\s*=/gi
  ];
  
  const threats = [];
  dangerousGraphQLPatterns.forEach(pattern => {
    if (pattern.test(query)) {
      threats.push(`Patrón peligroso detectado: ${pattern.source}`);
    }
  });
  
  // Verificar profundidad de la query (prevenir DoS por queries complejas)
  const depth = (query.match(/\{/g) || []).length;
  if (depth > 10) {
    threats.push('Query demasiado profunda (posible ataque DoS)');
  }
  
  return {
    isValid: threats.length === 0,
    threats
  };
};

/**
 * Middleware específico para proteger endpoints GraphQL
 */
const protectGraphQL = (req, res, next) => {
  if (req.body && req.body.query) {
    const validation = validateGraphQLQuery(req.body.query);
    if (!validation.isValid) {
      console.warn('🚨 GraphQL injection attempt:', {
        ip: req.ip,
        threats: validation.threats,
        query: req.body.query.substring(0, 200)
      });
      
      return res.status(400).json({
        error: 'Query GraphQL inválida',
        message: 'La query contiene patrones potencialmente peligrosos'
      });
    }
  }
  
  next();
};

module.exports = {
  sanitizeInput,
  validateInput,
  preventInjection,
  autoSanitize,
  sanitizeObject,
  validateGraphQLQuery,
  protectGraphQL
};
