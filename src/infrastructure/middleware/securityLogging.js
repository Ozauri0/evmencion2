/**
 * A09:2021 - Security Logging and Monitoring Failures
 * Sistema completo de logging y monitoreo de seguridad
 */

const fs = require('fs');
const path = require('path');

/**
 * Tipos de eventos de seguridad
 */
const SECURITY_EVENTS = {
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  INJECTION_ATTEMPT: 'INJECTION_ATTEMPT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  DATA_ACCESS: 'DATA_ACCESS',
  ADMIN_ACTION: 'ADMIN_ACTION',
  ERROR_OCCURRED: 'ERROR_OCCURRED',
  CONFIGURATION_CHANGE: 'CONFIGURATION_CHANGE'
};

/**
 * Niveles de severidad
 */
const SEVERITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Logger de seguridad
 */
class SecurityLogger {
  constructor() {
    this.logDirectory = path.join(__dirname, '../../../logs');
    this.securityLogFile = path.join(this.logDirectory, 'security.log');
    this.errorLogFile = path.join(this.logDirectory, 'errors.log');
    this.auditLogFile = path.join(this.logDirectory, 'audit.log');
    
    this.initializeLogDirectory();
    this.setupLogRotation();
  }
  
  /**
   * Inicializar directorio de logs
   */
  initializeLogDirectory() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }
  
  /**
   * Configurar rotación básica de logs
   */
  setupLogRotation() {
    // Rotar logs diariamente (simulación básica)
    setInterval(() => {
      this.rotateLogFile(this.securityLogFile);
      this.rotateLogFile(this.errorLogFile);
      this.rotateLogFile(this.auditLogFile);
    }, 24 * 60 * 60 * 1000); // 24 horas
  }
  
  /**
   * Rotar archivo de log
   */
  rotateLogFile(logFile) {
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      const date = new Date().toISOString().split('T')[0];
      const rotatedFile = `${logFile}.${date}`;
      
      if (!fs.existsSync(rotatedFile)) {
        fs.renameSync(logFile, rotatedFile);
      }
    }
  }
  
  /**
   * Formatear entrada de log
   */
  formatLogEntry(eventType, severity, data) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      eventType,
      severity,
      processId: process.pid,
      ...data
    }) + '\n';
  }
  
  /**
   * Escribir entrada de log de forma segura
   */
  writeLogEntry(logFile, entry) {
    try {
      fs.appendFileSync(logFile, entry, { encoding: 'utf8' });
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }
  
  /**
   * Log de evento de seguridad
   */
  logSecurityEvent(eventType, severity, data) {
    const entry = this.formatLogEntry(eventType, severity, data);
    this.writeLogEntry(this.securityLogFile, entry);
    
    // También enviar a consola eventos críticos
    if (severity === SEVERITY_LEVELS.CRITICAL || severity === SEVERITY_LEVELS.HIGH) {
      console.warn(`🚨 SECURITY ALERT [${severity}]:`, data);
    }
  }
  
  /**
   * Log de error
   */
  logError(error, context = {}) {
    const entry = this.formatLogEntry(SECURITY_EVENTS.ERROR_OCCURRED, SEVERITY_LEVELS.MEDIUM, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context
    });
    this.writeLogEntry(this.errorLogFile, entry);
  }
  
  /**
   * Log de auditoría
   */
  logAudit(action, user, resource, result) {
    const entry = this.formatLogEntry('AUDIT', SEVERITY_LEVELS.LOW, {
      action,
      user: user ? { id: user.id, role: user.role } : null,
      resource,
      result,
      sessionInfo: {
        userAgent: user?.userAgent,
        ip: user?.ip
      }
    });
    this.writeLogEntry(this.auditLogFile, entry);
  }
}

// Instancia singleton del logger
const securityLogger = new SecurityLogger();

/**
 * Middleware de monitoreo de autenticación
 */
const monitorAuthentication = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    const clientInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    };
    
    if (req.url.includes('/login')) {
      if (res.statusCode === 200) {
        securityLogger.logSecurityEvent(
          SECURITY_EVENTS.AUTH_SUCCESS,
          SEVERITY_LEVELS.LOW,
          { ...clientInfo, event: 'Login successful' }
        );
      } else {
        securityLogger.logSecurityEvent(
          SECURITY_EVENTS.AUTH_FAILURE,
          SEVERITY_LEVELS.MEDIUM,
          { ...clientInfo, event: 'Login failed', statusCode: res.statusCode }
        );
      }
    }
    
    // Monitorear accesos no autorizados
    if (res.statusCode === 401 || res.statusCode === 403) {
      securityLogger.logSecurityEvent(
        SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
        SEVERITY_LEVELS.HIGH,
        { ...clientInfo, statusCode: res.statusCode, event: 'Unauthorized access attempt' }
      );
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware de monitoreo de acceso a datos
 */
const monitorDataAccess = (req, res, next) => {
  // Monitorear endpoints que acceden a datos sensibles
  const sensitiveEndpoints = ['/productos', '/graphql', '/admin'];
  const isSensitive = sensitiveEndpoints.some(endpoint => req.url.includes(endpoint));
  
  if (isSensitive && req.user) {
    securityLogger.logAudit(
      `${req.method} ${req.url}`,
      {
        id: req.user.id,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      req.url,
      'ATTEMPTED'
    );
  }
  
  next();
};

/**
 * Detector de anomalías de comportamiento
 */
class AnomalyDetector {
  constructor() {
    this.userBehavior = new Map();
    this.ipBehavior = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000); // 1 hora
  }
  
  /**
   * Registrar comportamiento del usuario
   */
  recordUserBehavior(userId, action, ip) {
    const now = Date.now();
    
    if (!this.userBehavior.has(userId)) {
      this.userBehavior.set(userId, {
        actions: [],
        ips: new Set(),
        firstSeen: now
      });
    }
    
    const userInfo = this.userBehavior.get(userId);
    userInfo.actions.push({ action, timestamp: now, ip });
    userInfo.ips.add(ip);
    
    // Mantener solo las últimas 100 acciones
    if (userInfo.actions.length > 100) {
      userInfo.actions = userInfo.actions.slice(-100);
    }
    
    // Detectar anomalías
    this.detectUserAnomalies(userId, userInfo);
  }
  
  /**
   * Detectar anomalías de usuario
   */
  detectUserAnomalies(userId, userInfo) {
    const now = Date.now();
    const recentActions = userInfo.actions.filter(a => now - a.timestamp < 60 * 1000); // Último minuto
    
    // Detectar demasiadas acciones en poco tiempo
    if (recentActions.length > 50) {
      securityLogger.logSecurityEvent(
        SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
        SEVERITY_LEVELS.HIGH,
        {
          userId,
          anomaly: 'HIGH_FREQUENCY_ACTIONS',
          actionsInLastMinute: recentActions.length,
          description: 'Usuario realizando demasiadas acciones por minuto'
        }
      );
    }
    
    // Detectar múltiples IPs para el mismo usuario
    if (userInfo.ips.size > 3) {
      securityLogger.logSecurityEvent(
        SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
        SEVERITY_LEVELS.MEDIUM,
        {
          userId,
          anomaly: 'MULTIPLE_IPS',
          ipCount: userInfo.ips.size,
          ips: Array.from(userInfo.ips),
          description: 'Usuario accediendo desde múltiples IPs'
        }
      );
    }
  }
  
  /**
   * Limpiar datos antiguos
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    for (const [userId, userInfo] of this.userBehavior.entries()) {
      if (now - userInfo.firstSeen > maxAge) {
        this.userBehavior.delete(userId);
      }
    }
  }
}

const anomalyDetector = new AnomalyDetector();

/**
 * Middleware de detección de anomalías
 */
const detectAnomalies = (req, res, next) => {
  if (req.user) {
    const action = `${req.method} ${req.url}`;
    const ip = req.ip || req.connection.remoteAddress;
    
    anomalyDetector.recordUserBehavior(req.user.id, action, ip);
  }
  
  next();
};

/**
 * Middleware de manejo de errores con logging
 */
const errorLoggingHandler = (err, req, res, next) => {
  const context = {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    user: req.user ? { id: req.user.id, role: req.user.role } : null,
    body: req.body,
    query: req.query
  };
  
  securityLogger.logError(err, context);
  
  // No exponer detalles del error en producción
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ha ocurrido un error inesperado'
    });
  } else {
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
};

/**
 * Monitor de recursos del sistema
 */
const monitorSystemResources = () => {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memoryThreshold = 100 * 1024 * 1024; // 100MB
    
    if (memUsage.heapUsed > memoryThreshold) {
      securityLogger.logSecurityEvent(
        SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
        SEVERITY_LEVELS.MEDIUM,
        {
          event: 'HIGH_MEMORY_USAGE',
          memoryUsage: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
          }
        }
      );
    }
  }, 5 * 60 * 1000); // Cada 5 minutos
};

module.exports = {
  SecurityLogger,
  securityLogger,
  SECURITY_EVENTS,
  SEVERITY_LEVELS,
  monitorAuthentication,
  monitorDataAccess,
  detectAnomalies,
  errorLoggingHandler,
  monitorSystemResources,
  AnomalyDetector
};
