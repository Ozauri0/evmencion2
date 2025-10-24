const express = require('express');
const jwt = require('jsonwebtoken');
const { graphqlHTTP } = require('express-graphql');

// Imports de la arquitectura hexagonal
const InMemoryServerRepository = require('./src/infrastructure/repositories/InMemoryProductRepository');
const GetServers = require('./src/application/useCases/GetProducts');
const GetServerById = require('./src/application/useCases/GetProductById');
const CreateServer = require('./src/application/useCases/CreateProduct');
const UpdateServer = require('./src/application/useCases/UpdateProduct');
const DeleteServer = require('./src/application/useCases/DeleteProduct');
const serverRoutes = require('./src/infrastructure/routes/productRoutes');
const schema = require('./src/infrastructure/graphql/schema');
const createResolvers = require('./src/infrastructure/graphql/resolvers');

// 🛡️ OWASP Top 10 2021 - Imports de seguridad
const { authenticate, requirePermission, ROLES, PERMISSIONS } = require('./src/infrastructure/middleware/accessControlMiddleware');
const { maskSensitiveData, setCryptographicHeaders } = require('./src/infrastructure/middleware/cryptoMiddleware');
const { preventInjection, protectGraphQL } = require('./src/infrastructure/middleware/injectionProtection');
const { 
  securityHeaders, 
  createRateLimiter, 
  configureCORS, 
  validateContentType, 
  limitBodySize,
  securityLogger,
  detectSuspiciousUserAgent,
  secureEnvironment
} = require('./src/infrastructure/middleware/securityConfig');
const { 
  monitorAuthentication, 
  monitorDataAccess, 
  detectAnomalies, 
  errorLoggingHandler,
  monitorSystemResources 
} = require('./src/infrastructure/middleware/securityLogging');

const app = express();

// 🛡️ Configurar entorno seguro
secureEnvironment();

// 🛡️ Inicializar monitoreo de recursos
monitorSystemResources();

// 🛡️ A05:2021 - Security Misconfiguration: Headers de seguridad
app.use(securityHeaders);

// 🛡️ A02:2021 - Cryptographic Failures: Headers criptográficos
app.use(setCryptographicHeaders);

// 🛡️ A05:2021 - Security Misconfiguration: CORS configurado
app.use(configureCORS(['http://localhost:3000', 'http://127.0.0.1:3000']));

// 🛡️ A09:2021 - Security Logging: Monitoreo de autenticación
app.use(monitorAuthentication);

// 🛡️ A04:2021 - Insecure Design: Rate limiting
app.use(createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP por ventana
}));

// 🛡️ A04:2021 - Insecure Design: Detectar User-Agents sospechosos
app.use(detectSuspiciousUserAgent);

// 🛡️ A05:2021 - Security Misconfiguration: Validar Content-Type
app.use(validateContentType);

// 🛡️ A05:2021 - Security Misconfiguration: Limitar tamaño del body
app.use(limitBodySize(1024 * 1024)); // 1MB máximo

// 🛡️ A02:2021 - Cryptographic Failures: Enmascarar datos sensibles
app.use(maskSensitiveData);

// 🛡️ A03:2021 - Injection: Prevenir inyecciones
app.use(preventInjection);

// Middleware básico de Express
app.use(express.json({ limit: '1mb' }));

// 🛡️ A09:2021 - Security Logging: Logging de seguridad
app.use(securityLogger);

// Inyección de dependencias
const serverRepository = new InMemoryServerRepository();
const getServers = new GetServers(serverRepository);
const getServerById = new GetServerById(serverRepository);
const createServer = new CreateServer(serverRepository);
const updateServer = new UpdateServer(serverRepository);
const deleteServer = new DeleteServer(serverRepository);

// Endpoint para obtener token (simple como antes)
app.post('/login', (req, res) => {
  // Token simple con rol admin por defecto para trabajo práctico
  const token = jwt.sign(
    { 
      user: 'test', 
      role: ROLES.ADMIN,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
    }, 
    'secreto123'
  );
  
  res.json({ token });
});

// 🛡️ A01:2021 - Broken Access Control & A09:2021 - Security Logging: Rutas protegidas
app.use('/productos', 
  authenticate, // Requerir autenticación
  monitorDataAccess, // Monitorear acceso a datos
  detectAnomalies, // Detectar comportamientos anómalos
  serverRoutes(getServers, getServerById, createServer, updateServer, deleteServer)
);

// 🛡️ A03:2021 - Injection & A01:2021 - Broken Access Control: GraphQL protegido
app.use('/graphql', 
  authenticate, // Requerir autenticación
  protectGraphQL, // Protección específica para GraphQL
  monitorDataAccess, // Monitorear acceso
  graphqlHTTP({
    schema: schema,
    rootValue: createResolvers(getServers, createServer),
    graphiql: process.env.NODE_ENV !== 'production' // Solo en desarrollo
  })
);

// 🛡️ Endpoint de salud (sin autenticación pero con rate limiting)
app.get('/health', createRateLimiter({ windowMs: 60 * 1000, max: 10 }), (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'API de Productos - Protegida con OWASP Top 10 2021',
    version: '1.0.0',
    security: 'Habilitada',
    endpoints: {
      auth: 'POST /login',
      products: 'GET|POST|PUT|DELETE /productos',
      graphql: 'POST /graphql',
      health: 'GET /health'
    }
  });
});

// 🛡️ A06:2021 & A08:2021 - Imports adicionales para integridad
const { 
  validateDataIntegrity, 
  checkFileIntegrity, 
  createSecurityStatusEndpoint 
} = require('./src/infrastructure/middleware/integrityValidation');

// 🛡️ A08:2021 - Software and Data Integrity Failures: Validación de integridad
app.use(validateDataIntegrity);

// 🛡️ A08:2021 - Verificar integridad de archivos críticos
const criticalFiles = [
  './package.json',
  './src/infrastructure/middleware/accessControlMiddleware.js'
];
app.use(checkFileIntegrity(criticalFiles));

// 🛡️ A06:2021 & A08:2021 - Endpoint de estado de seguridad
app.get('/security-status', 
  authenticate, 
  requirePermission(PERMISSIONS.READ_PRODUCTS),
  createSecurityStatusEndpoint()
);

// 🛡️ A10:2021 - Server-Side Request Forgery: Endpoint para pruebas de SSRF
app.post('/webhook', authenticate, requirePermission(PERMISSIONS.CREATE_PRODUCTS), (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL requerida' });
  }
  
  // Validar URL para prevenir SSRF
  try {
    const parsedUrl = new URL(url);
    
    // Lista blanca de dominios permitidos
    const allowedDomains = ['api.example.com', 'webhook.site'];
    const allowedProtocols = ['http:', 'https:'];
    
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return res.status(400).json({ 
        error: 'Protocolo no permitido',
        message: 'Solo se permiten HTTP y HTTPS'
      });
    }
    
    if (!allowedDomains.includes(parsedUrl.hostname)) {
      return res.status(400).json({ 
        error: 'Dominio no permitido',
        message: 'El dominio no está en la lista blanca'
      });
    }
    
    // Prevenir acceso a IPs locales
    const forbiddenHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    if (forbiddenHosts.includes(parsedUrl.hostname)) {
      return res.status(400).json({ 
        error: 'Host no permitido',
        message: 'No se permite acceso a recursos locales'
      });
    }
    
    res.json({ 
      message: 'URL validada correctamente',
      url: parsedUrl.toString()
    });
    
  } catch (error) {
    return res.status(400).json({ 
      error: 'URL inválida',
      message: 'El formato de URL no es válido'
    });
  }
});

// 🛡️ Ruta 404 personalizada
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: 'La ruta solicitada no existe',
    requestedPath: req.originalUrl
  });
});

// 🛡️ A09:2021 - Security Logging: Manejo global de errores
app.use(errorLoggingHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log('📝 Logs de seguridad disponibles en: ./logs/');
});