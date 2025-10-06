class Server {
  constructor(id, titulo, descripcion, precio, nucleos, ram, disco, cluster, estado, fechaCreacion, self) {
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.precio = precio;
    this.nucleos = nucleos;
    this.ram = ram;
    this.disco = disco;
    this.cluster = cluster;
    this.estado = estado;
    this.fechaCreacion = fechaCreacion;
    this.self = self;
  }
}

module.exports = Server;
