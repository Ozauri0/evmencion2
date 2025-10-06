class Server {
  constructor(id, titulo, descripcion, fechaPublicacion, autor, comentarios, self, precio, nucleos, ram, disco) {
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.fechaPublicacion = fechaPublicacion;
    this.autor = autor;
    this.comentarios = comentarios;
    this.self = self;
    this.precio = precio;
    this.nucleos = nucleos;
    this.ram = ram;
    this.disco = disco;
  }
}

module.exports = Server;
