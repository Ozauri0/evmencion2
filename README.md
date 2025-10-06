# Proyecto de API REST y GraphQL: Gestión de Servidores VPS

## Descripción
Este proyecto implementa una API híbrida utilizando **Express.js** en Node.js, combinando **endpoints REST** tradicionales con **GraphQL** para la gestión de recursos de servidores VPS. Se aplica la **arquitectura hexagonal (Ports & Adapters)** para promover un diseño limpio, modular y testable. El sistema incluye protección JWT para operaciones sensibles, cumpliendo con los requisitos académicos especificados.

El proyecto simula un catálogo de servidores VPS, permitiendo operaciones CRUD (Crear, Leer, Actualizar, Eliminar) a través de REST, y consultas flexibles mediante GraphQL. Está diseñado para demostrar principios de desarrollo de software como SOLID, separación de responsabilidades y integración de tecnologías modernas en aplicaciones backend.

## Características Principales
- **API REST completa**: Endpoints para GET (lista y por ID), POST (crear), PUT (actualizar completo), PATCH (actualizar parcial) y DELETE.
- **Protección JWT**: El endpoint POST requiere autenticación con token Bearer (`secreto123`).
- **GraphQL integrado**: Query `products` para listar recursos y Mutation `createProduct` para crear nuevos.
- **Arquitectura Hexagonal**: Separación en capas (Dominio, Aplicación, Infraestructura) para alta mantenibilidad.
- **Persistencia en memoria**: Uso de arrays para simulación de base de datos (fácil reemplazo por BD real).
- **Campos especializados**: Incluye precio, núcleos, RAM y disco para representar servidores VPS.

## Tecnologías Utilizadas
- **Node.js**: Entorno de ejecución.
- **Express.js**: Framework para APIs REST.
- **GraphQL**: Lenguaje de consultas para APIs flexibles.
- **jsonwebtoken**: Librería para manejo de JWT.
- **express-graphql**: Integración de GraphQL en Express.
- **Arquitectura**: Hexagonal (Clean Architecture).

## Instalación y Configuración
### Prerrequisitos
- Node.js (versión 14 o superior).
- npm (viene con Node.js).

### Pasos de Instalación
1. Clona el repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd evmencion2
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

4. El servidor estará disponible en `http://localhost:3000`.

## Uso de la API
### Generación de Token JWT
Para operaciones protegidas, obtén un token:
```bash
curl -X POST http://localhost:3000/login
```
Respuesta: `{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}`

### Endpoints REST
- **GET /productos**: Lista todos los servidores.
  ```bash
  curl http://localhost:3000/productos
  ```

- **GET /productos/:id**: Obtiene un servidor por ID.
  ```bash
  curl http://localhost:3000/productos/1
  ```

- **POST /productos**: Crea un nuevo servidor (requiere JWT).
  ```bash
  curl -X POST http://localhost:3000/productos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <TOKEN>" \
    -d '{
      "titulo": "Servidor VPS Premium",
      "descripcion": "Plan de alto rendimiento",
      "autor": {"id": 1, "name": "Admin", "profile_url": "https://ejemplo.com/authors/1"},
      "precio": 50.0,
      "nucleos": 4,
      "ram": "8GB",
      "disco": "120GB"
    }'
  ```

- **PUT /productos/:id**: Actualiza completamente un servidor.
  ```bash
  curl -X PUT http://localhost:3000/productos/1 \
    -H "Content-Type: application/json" \
    -d '{"titulo": "Actualizado", ...}'
  ```

- **PATCH /productos/:id**: Actualiza parcialmente un servidor.
  ```bash
  curl -X PATCH http://localhost:3000/productos/1 \
    -H "Content-Type: application/json" \
    -d '{"precio": 45.0}'
  ```

- **DELETE /productos/:id**: Elimina un servidor.
  ```bash
  curl -X DELETE http://localhost:3000/productos/1
  ```

### Uso de GraphQL
Accede a `http://localhost:3000/graphql` para usar GraphiQL.

- **Query para listar productos**:
  ```graphql
  {
    products {
      id
      titulo
      autor {
        id
        name
        profile_url
      }
      precio
      nucleos
      ram
      disco
      comentarios{
        count
      }
      self{
        link
      }
    }
  }
  ```

- **Mutation para crear producto**:
  ```graphql
  mutation {
    createProduct(
      titulo: "Nuevo Servidor"
      descripcion: "Descripción"
      autor: { id: 1, name: "Autor", profile_url: "https://ejemplo.com/authors/1" }
      precio: 25.0
      nucleos: 2
      ram: "4GB"
      disco: "60GB"
    ) {
      id
      titulo
    }
  }
  ```

## Arquitectura del Sistema
### Patrón Hexagonal
- **Capa de Dominio**: Entidades (`Server`) y contratos (`ServerRepository`). Independiente de frameworks.
- **Capa de Aplicación**: Casos de uso (`GetServers`, `CreateServer`, etc.). Contienen lógica de negocio.
- **Capa de Infraestructura**: Adaptadores primarios (controladores REST/GraphQL, rutas) y secundarios (repositorio en memoria, middleware JWT).

### Estructura de Archivos
```
src/
├── domain/
│   ├── entities/          # Modelos de negocio
│   └── repositories/      # Interfaces de repositorios
├── application/
│   └── useCases/          # Lógica de aplicación
└── infrastructure/
    ├── controllers/       # Controladores HTTP
    ├── repositories/      # Implementaciones de repositorios
    ├── routes/            # Definición de rutas
    ├── graphql/           # Esquema y resolvers GraphQL
    └── middleware/        # Autenticación JWT
app.js                     # Punto de entrada
```

## Cumplimiento de Requisitos
1. **Endpoints REST**: Implementados para productos (GET, POST, GET by ID, PUT, PATCH, DELETE, GET ALL).
2. **Protección JWT en POST**: Solo el POST requiere Bearer token con secreto `secreto123`.
3. **GraphQL**: Query `products` y Mutation `createProduct`.
4. **Presentación**: Preparado para explicación en sala (orden alfabético).

## Pruebas
- Usa Postman o curl para probar endpoints REST.
- Usa GraphiQL para GraphQL.
- Verifica autenticación: POST sin token debe fallar (401/403).
