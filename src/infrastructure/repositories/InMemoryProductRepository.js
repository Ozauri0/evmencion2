const ServerRepository = require('../../domain/repositories/ProductRepository');
const Server = require('../../domain/entities/Product');

class InMemoryServerRepository extends ServerRepository {
  constructor() {
    super();
    this.servers = [
      new Server(
        1,
        'Servidor VPS Básico',
        'Servidor VPS con recursos básicos.',
        '2023-11-04T14:30:00Z',
        { id: 456, name: 'Christian Ferrer', profile_url: 'https://paginaejemplo.com/autores/69' },
        { count: 5, comments_url: 'https://paginaejemplo.com/servers/1/comments' },
        { link: 'https://paginaejemplo.com/servers/1' },
        9.990,
        1,
        '1GB',
        '20GB'
      ),
      new Server(
        2,
        'Servidor VPS Avanzado',
        'Servidor VPS con más recursos.',
        '2023-11-05T10:00:00Z',
        { id: 789, name: 'Benjamin Sanchez', profile_url: 'https://paginaejemplo.com/autores/420' },
        { count: 2, comments_url: 'https://paginaejemplo.com/servers/2/comments' },
        { link: 'https://paginaejemplo.com/servers/2' },
        9.990,
        2,
        '2GB',
        '50GB'
      )
    ];
    this.nextId = 3;
  }

  async findAll() {
    return this.servers;
  }

  async findById(id) {
    return this.servers.find(s => s.id == id);
  }

  async save(server) {
    this.servers.push(server);
    return server;
  }

  async update(id, updatedServer) {
    const index = this.servers.findIndex(s => s.id == id);
    if (index !== -1) {
      this.servers[index] = { ...this.servers[index], ...updatedServer };
      return this.servers[index];
    }
    return null;
  }

  async delete(id) {
    const index = this.servers.findIndex(s => s.id == id);
    if (index !== -1) {
      this.servers.splice(index, 1);
      return true;
    }
    return false;
  }

  async getNextId() {
    return this.nextId++;
  }
}

module.exports = InMemoryServerRepository;
