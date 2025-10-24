/**
 * A04:2021 - Insecure Design & A05:2021 - Security Misconfiguration
 * Middleware para establecer configuraciones de seguridad y patrones de diseño seguro
 */

/**
 * Middleware de cabeceras de seguridad (reemplazo básico de Helmet)
 */
const securityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Para desarrollo, en producción eliminar unsafe-inline
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));

  // Prevenir ataques de clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevenir MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Habilitar protección XSS del navegador
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Política de referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Eliminar header que revela información del servidor
  res.removeHeader('X-Powered-By');
  
  // Configurar HSTS (solo en HTTPS)
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Prevenir caching de contenido sensible
  if (req.path.includes('/api/') || req.path.includes('/graphql')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

/**
 * Rate Limiting básico sin dependencias externas
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos
    max = 100, // máximo 100 requests por ventana
    message = 'Demasiadas solicitudes, intente más tarde'
  } = options;
  
  const clients = new Map();
  
  // Limpiar registros antiguos cada 5 minutos
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of clients.entries()) {
      if (now - data.resetTime > windowMs) {
        clients.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
  
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    let clientData = clients.get(clientIP);
    
    if (!clientData) {
      clientData = {
        count: 0,
        resetTime: now
      };
      clients.set(clientIP, clientData);
    }
    
    // Reset si ha pasado la ventana de tiempo
    if (now - clientData.resetTime > windowMs) {
      clientData.count = 0;
      clientData.resetTime = now;
    }
    
    clientData.count++;
    
    // Agregar headers informativos
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - clientData.count));
    res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime + windowMs));
    
    if (clientData.count > max) {
      console.warn(`🚨 Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil((clientData.resetTime + windowMs - now) / 1000)
      });
    }
    
    next();
  };
};

/**
 * Configuración CORS segura
 */
const configureCORS = (allowedOrigins = ['http://localhost:3000']) => {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  };
};

/**
 * Middleware para validar Content-Type
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type requerido',
        message: 'Debe especificar el Content-Type de la solicitud'
      });
    }
    
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data'
    ];
    
    const isAllowed = allowedTypes.some(type => contentType.startsWith(type));
    
    if (!isAllowed) {
      return res.status(415).json({
        error: 'Content-Type no soportado',
        message: 'Tipo de contenido no permitido'
      });
    }
  }
  
  next();
};

/**
 * Middleware para limitar el tamaño del body
 */
const limitBodySize = (maxSize = 1024 * 1024) => { // 1MB por defecto
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Payload demasiado grande',
        message: `El tamaño máximo permitido es ${Math.round(maxSize / 1024)}KB`
      });
    }
    
    next();
  };
};

/**
 * Middleware para logging de seguridad
 */
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log de la solicitud
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    contentLength: req.headers['content-length'] || '0'
  };
  
  // Interceptar la respuesta para logging
  const originalSend = res.send;
  res.send = function(data) {
    logData.statusCode = res.statusCode;
    logData.responseTime = Date.now() - startTime;
    
    // Log solo eventos importantes para seguridad
    if (res.statusCode >= 400 || req.url.includes('/admin') || req.url.includes('/graphql')) {
      console.log('🔍 Security Log:', logData);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware para detectar User-Agents sospechosos
 */
const detectSuspiciousUserAgent = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  const suspiciousPatterns = [
    /sqlmap/i,
    /nmap/i,
    /nikto/i,
    /wget/i,
    /curl/i,
    /python-requests/i,
    /bot/i,
    /scanner/i,
    /crawl/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious) {
    console.warn('🚨 Suspicious User-Agent detected:', {
      ip: req.ip,
      userAgent,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    // En producción podrías bloquear completamente
    // return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
};

/**
 * Configuración de entorno seguro
 */
const secureEnvironment = () => {
  // Establecer NODE_ENV por defecto si no existe
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
    console.log('📝 NODE_ENV establecido como "development"');
  }
  
  // Configurar modo seguro para producción
  if (process.env.NODE_ENV === 'production') {
    // Desactivar stack traces detallados
    console.log('🔒 Modo producción activado');
    
    // Configurar limits más estrictos
    process.setMaxListeners(10);
  } else {
    console.log('🛠️ Modo desarrollo activado');
  }
};

module.exports = {
  securityHeaders,
  createRateLimiter,
  configureCORS,
  validateContentType,
  limitBodySize,
  securityLogger,
  detectSuspiciousUserAgent,
  secureEnvironment
};
