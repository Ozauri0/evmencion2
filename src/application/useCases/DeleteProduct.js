class DeleteServer {
  constructor(serverRepository) {
    this.serverRepository = serverRepository;
  }

  async execute(id) {
    return await this.serverRepository.delete(id);
  }
}

module.exports = DeleteServer;
