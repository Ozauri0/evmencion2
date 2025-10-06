const Server = require('../../domain/entities/Product');

class CreateServer {
  constructor(serverRepository) {
    this.serverRepository = serverRepository;
  }

  async execute(titulo, descripcion, autor, precio, nucleos, ram, disco) {
    const id = await this.serverRepository.getNextId();
    const fechaPublicacion = new Date().toISOString();
    const comentarios = { count: 0, comments_url: `https://ejemplo.com/servers/${id}/comments` };
    const self = { link: `https://ejemplo.com/servers/${id}` };
    const server = new Server(id, titulo, descripcion, fechaPublicacion, autor, comentarios, self, precio, nucleos, ram, disco);
    return await this.serverRepository.save(server);
  }
}

module.exports = CreateServer;
