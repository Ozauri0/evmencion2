class UpdateServer {
  constructor(serverRepository) {
    this.serverRepository = serverRepository;
  }

  async execute(id, updatedData) {
    // Proteger campos que no deben ser modificados
    const protectedFields = ['id', 'fechaCreacion', 'link'];
    const filteredData = { ...updatedData };
    
    // Eliminar campos protegidos
    protectedFields.forEach(field => {
      if (filteredData.hasOwnProperty(field)) {
        delete filteredData[field];
      }
    });
    
    return await this.serverRepository.update(id, filteredData);
  }
}

module.exports = UpdateServer;
