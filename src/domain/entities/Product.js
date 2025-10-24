class Server {
  constructor(id, titulo, descripcion, precio, nucleos, ram, disco, cluster, estado, fechaCreacion, self) {
    // Validaciones básicas en la entidad de dominio
    if (!titulo || typeof titulo !== 'string') {
      throw new Error('Título es requerido y debe ser un texto');
    }
    
    if (!descripcion || typeof descripcion !== 'string') {
      throw new Error('Descripción es requerida y debe ser un texto');
    }
    
    if (precio === undefined || precio === null || typeof precio !== 'number' || precio < 0) {
      throw new Error('Precio es requerido y debe ser un número positivo');
    }
    
    if (!Number.isInteger(nucleos) || nucleos < 1) {
      throw new Error('Núcleos debe ser un número entero positivo');
    }
    
    if (!Number.isInteger(ram) || ram < 1) {
      throw new Error('RAM debe ser un número entero positivo');
    }
    
    if (!Number.isInteger(disco) || disco < 1) {
      throw new Error('Disco debe ser un número entero positivo');
    }

    this.id = id;
    this.titulo = titulo.trim();
    this.descripcion = descripcion.trim();
    this.precio = precio;
    this.nucleos = nucleos;
    this.ram = ram;
    this.disco = disco;
    this.cluster = cluster ? cluster.trim() : null;
    this.estado = estado || 'activo';
    this.fechaCreacion = fechaCreacion;
    this.self = self;
  }
  
  /**
   * Método para validar el estado del producto
   */
  static isValidEstado(estado) {
    const validStates = ['activo', 'inactivo', 'mantenimiento'];
    return validStates.includes(estado);
  }
  
  /**
   * Método para cambiar estado del producto
   */
  cambiarEstado(nuevoEstado) {
    if (!Server.isValidEstado(nuevoEstado)) {
      throw new Error('Estado inválido. Estados permitidos: activo, inactivo, mantenimiento');
    }
    this.estado = nuevoEstado;
  }
}

module.exports = Server;
