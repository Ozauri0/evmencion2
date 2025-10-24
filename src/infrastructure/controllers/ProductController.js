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
      const { titulo, descripcion, precio, nucleos, ram, disco, cluster, estado } = req.body;
      const server = await this.createServer.execute(titulo, descripcion, precio, nucleos, ram, disco, cluster, estado);
      res.status(201).json(server);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  async update(req, res) {
    try {
      // Validar que solo se actualicen campos permitidos
      const allowedFields = ['titulo', 'descripcion', 'precio', 'nucleos', 'ram', 'disco', 'cluster', 'estado'];
      const updateData = {};
      
      // Filtrar solo los campos permitidos
      for (const [key, value] of Object.entries(req.body)) {
        if (allowedFields.includes(key)) {
          updateData[key] = value;
        }
      }
      
      // Verificar que se envió al menos un campo válido
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ 
          error: 'No se proporcionaron campos válidos para actualizar',
          allowedFields: allowedFields 
        });
      }
      
      const server = await this.updateServer.execute(req.params.id, updateData);
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
