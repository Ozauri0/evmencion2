const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type Cluster {
    id: ID!
    nombre: String!
    ubicacion: Ubicacion!
  }

  type Ubicacion {
    region: String!
    ciudad: String!
  }

  type Self {
    link: String!
  }

  type Producto {
    id: ID!
    titulo: String!
    descripcion: String!
    precio: Float!
    nucleos: Int!
    ram: String!
    disco: String!
    cluster: Cluster!
    estado: String!
    fechaCreacion: String!
    self: Self!
  }

  type Query {
    productos: [Producto]
  }

  type Mutation {
    createProducto(titulo: String!, descripcion: String!, precio: Float!, nucleos: Int!, ram: String!, disco: String!, cluster: ClusterInput!, estado: String): Producto
  }

  input ClusterInput {
    id: ID!
    nombre: String!
    ubicacion: UbicacionInput!
  }

  input UbicacionInput {
    region: String!
    ciudad: String!
  }
`);

module.exports = schema;
