const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type Author {
    id: ID!
    name: String!
    profile_url: String!
  }

  type Comments {
    count: Int!
    comments_url: String!
  }

  type Self {
    link: String!
  }

  type Product {
    id: ID!
    titulo: String!
    descripcion: String!
    fechaPublicacion: String!
    autor: Author!
    comentarios: Comments!
    self: Self!
    precio: Float!
    nucleos: Int!
    ram: String!
    disco: String!
  }

  type Query {
    products: [Product]
  }

  type Mutation {
    createProduct(titulo: String!, descripcion: String!, autor: AuthorInput!, precio: Float!, nucleos: Int!, ram: String!, disco: String!): Product
  }

  input AuthorInput {
    id: ID!
    name: String!
    profile_url: String!
  }
`);

module.exports = schema;
