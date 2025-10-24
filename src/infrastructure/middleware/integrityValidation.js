/**
 * A06:2021 - Vulnerable and Outdated Components
 * A08:2021 - Software and Data Integrity Failures
 * Utilidades para validar integridad y seguridad de componentes
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Verificador de integridad de datos
 */
class DataIntegrityValidator {
  constructor() {
    this.checksums = new Map();
  }
  
  /**
   * Generar checksum para datos
   */
  generateChecksum(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }
  
  /**
   * Validar integridad de datos
   */
  validateIntegrity(data, expectedChecksum) {
    const actualChecksum = this.generateChecksum(data);
    return actualChecksum === expectedChecksum;
  }
  
  /**
   * Firmar datos con clave secreta
   */
  signData(data, secretKey = 'default-secret-key') {
    const dataStr = JSON.stringify(data);
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(dataStr)
      .digest('hex');
    
    return {
      data,
      signature,
      timestamp: Date.now()
    };
  }
  
  /**
   * Verificar firma de datos
   */
  verifySignature(signedData, secretKey = 'default-secret-key') {
    const { data, signature, timestamp } = signedData;
    
    // Verificar que los datos no sean demasiado antiguos (24 horas)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) {
      return { valid: false, reason: 'Datos expirados' };
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(data))
      .digest('hex');
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    
    return { valid: isValid, reason: isValid ? 'Válido' : 'Firma inválida' };
  }
}

/**
 * Middleware para validar integridad de datos en requests
 */
const validateDataIntegrity = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const { data, signature, timestamp } = req.body;
    
    // Solo validar si viene con firma
    if (signature && timestamp) {
      const validator = new DataIntegrityValidator();
      const result = validator.verifySignature({ data, signature, timestamp });
      
      if (!result.valid) {
        return res.status(400).json({
          error: 'Integridad de datos comprometida',
          message: result.reason
        });
      }
      
      // Reemplazar el body con los datos validados
      req.body = data;
    }
  }
  
  next();
};

/**
 * Validador de versiones de dependencias
 */
class DependencyValidator {
  constructor() {
    this.vulnerablePackages = new Set([
      // Lista simulada de paquetes vulnerables para el ejemplo
      'lodash@4.17.20',
      'express@4.16.0',
      'jsonwebtoken@8.5.0'
    ]);
    
    this.loadPackageInfo();
  }
  
  /**
   * Cargar información del package.json
   */
  loadPackageInfo() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      this.dependencies = {
        ...packageData.dependencies,
        ...packageData.devDependencies
      };
    } catch (error) {
      console.warn('No se pudo cargar package.json:', error.message);
      this.dependencies = {};
    }
  }
  
  /**
   * Verificar vulnerabilidades conocidas
   */
  checkVulnerabilities() {
    const vulnerabilities = [];
    
    Object.entries(this.dependencies).forEach(([name, version]) => {
      const packageId = `${name}@${version.replace('^', '').replace('~', '')}`;
      
      if (this.vulnerablePackages.has(packageId)) {
        vulnerabilities.push({
          package: name,
          version: version,
          severity: 'HIGH',
          description: `Versión vulnerable detectada: ${packageId}`
        });
      }
      
      // Verificar versiones muy antiguas (simulación)
      if (name === 'express' && version.startsWith('4.16')) {
        vulnerabilities.push({
          package: name,
          version: version,
          severity: 'MEDIUM',
          description: 'Versión antigua de Express detectada'
        });
      }
    });
    
    return vulnerabilities;
  }
  
  /**
   * Generar reporte de seguridad
   */
  generateSecurityReport() {
    const vulnerabilities = this.checkVulnerabilities();
    
    return {
      timestamp: new Date().toISOString(),
      totalDependencies: Object.keys(this.dependencies).length,
      vulnerabilityCount: vulnerabilities.length,
      vulnerabilities,
      recommendations: this.generateRecommendations(vulnerabilities)
    };
  }
  
  /**
   * Generar recomendaciones de seguridad
   */
  generateRecommendations(vulnerabilities) {
    const recommendations = [];
    
    if (vulnerabilities.length > 0) {
      recommendations.push('Actualizar dependencias vulnerables inmediatamente');
      recommendations.push('Ejecutar npm audit para más detalles');
      recommendations.push('Considerar usar dependabot o herramientas similares');
    }
    
    recommendations.push('Revisar dependencias regularmente');
    recommendations.push('Usar versiones específicas en lugar de rangos amplios');
    
    return recommendations;
  }
}

/**
 * Middleware para verificar integridad de archivos críticos
 */
const checkFileIntegrity = (filePaths = []) => {
  const checksums = new Map();
  
  // Generar checksums iniciales
  filePaths.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const checksum = crypto.createHash('sha256').update(content).digest('hex');
      checksums.set(filePath, checksum);
    } catch (error) {
      console.warn(`No se pudo verificar integridad de ${filePath}:`, error.message);
    }
  });
  
  return (req, res, next) => {
    // Verificar integridad de archivos críticos en cada request
    let integrityCompromised = false;
    
    checksums.forEach((expectedChecksum, filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const currentChecksum = crypto.createHash('sha256').update(content).digest('hex');
        
        if (currentChecksum !== expectedChecksum) {
          console.error(`🚨 INTEGRIDAD COMPROMETIDA: ${filePath}`);
          integrityCompromised = true;
        }
      } catch (error) {
        console.warn(`Error verificando ${filePath}:`, error.message);
      }
    });
    
    if (integrityCompromised) {
      return res.status(500).json({
        error: 'Integridad del sistema comprometida',
        message: 'Se detectaron modificaciones no autorizadas en archivos críticos'
      });
    }
    
    next();
  };
};

/**
 * Middleware para validar headers de integridad en uploads
 */
const validateUploadIntegrity = (req, res, next) => {
  if (req.method === 'POST' && req.headers['content-type']?.includes('multipart/form-data')) {
    const expectedChecksum = req.headers['x-file-checksum'];
    
    if (expectedChecksum) {
      // En una implementación real, validarías el checksum del archivo
      console.log(`Validando checksum de archivo: ${expectedChecksum}`);
    }
  }
  
  next();
};

/**
 * Endpoint para verificar estado de seguridad del sistema
 */
const createSecurityStatusEndpoint = () => {
  return (req, res) => {
    const dependencyValidator = new DependencyValidator();
    const securityReport = dependencyValidator.generateSecurityReport();
    
    const systemStatus = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      security: {
        dependencyReport: securityReport,
        integrityChecks: 'ACTIVE',
        dataValidation: 'ACTIVE'
      }
    };
    
    // Determinar estado general
    const hasVulnerabilities = securityReport.vulnerabilityCount > 0;
    systemStatus.overallStatus = hasVulnerabilities ? 'WARNING' : 'SECURE';
    
    res.json(systemStatus);
  };
};

module.exports = {
  DataIntegrityValidator,
  DependencyValidator,
  validateDataIntegrity,
  checkFileIntegrity,
  validateUploadIntegrity,
  createSecurityStatusEndpoint
};
