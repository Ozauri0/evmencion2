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

const app = express();
app.use(express.json());

// Inyección de dependencias
const serverRepository = new InMemoryServerRepository();
const getServers = new GetServers(serverRepository);
const getServerById = new GetServerById(serverRepository);
const createServer = new CreateServer(serverRepository);
const updateServer = new UpdateServer(serverRepository);
const deleteServer = new DeleteServer(serverRepository);

// Endpoint para obtener token (simulado)
app.post('/login', (req, res) => {
  const token = jwt.sign({ user: 'test' }, 'secreto123');
  res.json({ token });
});

// Rutas REST
app.use('/productos', serverRoutes(getServers, getServerById, createServer, updateServer, deleteServer));

// Endpoint GraphQL
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: createResolvers(getServers, createServer),
  graphiql: true
}));

app.get('/', (req, res) => {
  res.send('Express funcionando');
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});