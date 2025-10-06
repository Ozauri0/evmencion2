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
        9990,
        1,
        '1GB',
        '20GB',
        { id: 1, nombre: 'Cluster Norte', ubicacion: { region: 'Región de La Araucanía', ciudad: 'Temuco' } },
        'activo',
        '2023-11-04T14:30:00Z',
        { link: 'https://ejemplo.com/productos/1' }
      ),
      new Server(
        2,
        'Servidor VPS Avanzado',
        'Servidor VPS con más recursos.',
        12990,
        2,
        '2GB',
        '50GB',
        { id: 2, nombre: 'Cluster Sur', ubicacion: { region: 'Región Metropolitana', ciudad: 'Santiago' } },
        'activo',
        '2023-11-05T10:00:00Z',
        { link: 'https://ejemplo.com/productos/2' }
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
