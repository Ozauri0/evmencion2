const Server = require('../../domain/entities/Product');

class CreateServer {
  constructor(serverRepository) {
    this.serverRepository = serverRepository;
  }

  async execute(titulo, descripcion, precio, nucleos, ram, disco, cluster, estado = 'activo') {
    const id = await this.serverRepository.getNextId();
    const fechaCreacion = new Date().toISOString();
    const self = { link: `https://ejemplo.com/productos/${id}` };
    const server = new Server(id, titulo, descripcion, precio, nucleos, ram, disco, cluster, estado, fechaCreacion, self);
    return await this.serverRepository.save(server);
  }
}

module.exports = CreateServer;
