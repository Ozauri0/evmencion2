function createResolvers(getServers, createServer) {
  return {
    products: async () => await getServers.execute(),
    createProduct: async ({ titulo, descripcion, autor, precio, nucleos, ram, disco }) => await createServer.execute(titulo, descripcion, autor, precio, nucleos, ram, disco)
  };
}

module.exports = createResolvers;
