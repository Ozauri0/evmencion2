class UpdateServer {
  constructor(serverRepository) {
    this.serverRepository = serverRepository;
  }

  async execute(id, updatedData) {
    return await this.serverRepository.update(id, updatedData);
  }
}

module.exports = UpdateServer;
