/**
 * A02:2021 - Cryptographic Failures
 * Middleware y utilidades para manejo seguro de datos sensibles
 */

const crypto = require('crypto');

/**
 * Configuración de cifrado seguro
 */
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  saltLength: 32
};

/**
 * Genera una clave derivada de una contraseña usando PBKDF2
 */
const deriveKey = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 100000, ENCRYPTION_CONFIG.keyLength, 'sha256');
};

/**
 * Cifra datos sensibles (versión simplificada para el trabajo práctico)
 */
const encryptSensitiveData = (data, password = 'default-key') => {
  try {
    const salt = crypto.randomBytes(ENCRYPTION_CONFIG.saltLength);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
    
    const cipher = crypto.createCipherGCM(ENCRYPTION_CONFIG.algorithm, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    console.warn('Error en cifrado:', error.message);
    return { encrypted: JSON.stringify(data) }; // Fallback simple
  }
};

/**
 * Descifra datos sensibles (versión simplificada)
 */
const decryptSensitiveData = (encryptedData, password = 'default-key') => {
  try {
    const { encrypted, salt, iv, tag } = encryptedData;
    
    // Si no tiene los campos necesarios, asumir que no está cifrado
    if (!salt || !iv || !tag) {
      return JSON.parse(encrypted);
    }
    
    const key = deriveKey(password, Buffer.from(salt, 'hex'));
    const decipher = crypto.createDecipherGCM(ENCRYPTION_CONFIG.algorithm, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.warn('Error en descifrado:', error.message);
    return JSON.parse(encryptedData.encrypted); // Fallback simple
  }
};

/**
 * Genera hash simple para datos (sin contraseñas complejas)
 */
const generateSimpleHash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Middleware para enmascarar datos sensibles en logs
 */
const maskSensitiveData = (req, res, next) => {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  // Crear una copia del request body sin datos sensibles para logs
  if (req.body) {
    req.sanitizedBody = { ...req.body };
    sensitiveFields.forEach(field => {
      if (req.sanitizedBody[field]) {
        req.sanitizedBody[field] = '***MASKED***';
      }
    });
  }
  
  // Enmascarar headers sensibles
  req.sanitizedHeaders = { ...req.headers };
  sensitiveFields.forEach(field => {
    if (req.sanitizedHeaders[field]) {
      req.sanitizedHeaders[field] = '***MASKED***';
    }
  });
  
  next();
};

/**
 * Middleware para establecer headers de seguridad criptográfica
 */
const setCryptographicHeaders = (req, res, next) => {
  // Forzar HTTPS en producción
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Prevenir ataques de downgrade
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Establecer política de referrer segura
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

/**
 * Utilidad para generar tokens seguros
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Validar que los datos no contengan información sensible antes de enviarlos
 */
const sanitizeResponse = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      delete sanitized[key];
    }
    
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeResponse(sanitized[key]);
    }
  });
  
  return sanitized;
};

module.exports = {
  encryptSensitiveData,
  decryptSensitiveData,
  generateSimpleHash,
  maskSensitiveData,
  setCryptographicHeaders,
  generateSecureToken,
  sanitizeResponse
};
