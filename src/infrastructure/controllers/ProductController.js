class ServerController {
  constructor(getServers, getServerById, createServer, updateServer, deleteServer) {
    this.getServers = getServers;
    this.getServerById = getServerById;
    this.createServer = createServer;
    this.updateServer = updateServer;
    this.deleteServer = deleteServer;
  }

  async getAll(req, res) {
    try {
      const servers = await this.getServers.execute();
      res.json(servers);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  async getById(req, res) {
    try {
      const server = await this.getServerById.execute(req.params.id);
      server ? res.json(server) : res.status(404).send('Servidor no encontrado');
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  async create(req, res) {
    try {
      const { titulo, descripcion, autor, precio, nucleos, ram, disco } = req.body;
      const server = await this.createServer.execute(titulo, descripcion, autor, precio, nucleos, ram, disco);
      res.status(201).json(server);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  async update(req, res) {
    try {
      const server = await this.updateServer.execute(req.params.id, req.body);
      server ? res.json(server) : res.status(404).send('Servidor no encontrado');
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  async delete(req, res) {
    try {
      const deleted = await this.deleteServer.execute(req.params.id);
      deleted ? res.send('Servidor eliminado') : res.status(404).send('Servidor no encontrado');
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
}

module.exports = ServerController;
