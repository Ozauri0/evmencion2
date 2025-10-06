function createResolvers(getServers, createServer) {
  return {
    productos: async () => await getServers.execute(),
    createProducto: async ({ titulo, descripcion, precio, nucleos, ram, disco, cluster, estado }) => await createServer.execute(titulo, descripcion, precio, nucleos, ram, disco, cluster, estado)
  };
}

module.exports = createResolvers;
