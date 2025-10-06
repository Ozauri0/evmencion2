class GetServers {
  constructor(serverRepository) {
    this.serverRepository = serverRepository;
  }

  async execute() {
    return await this.serverRepository.findAll();
  }
}

module.exports = GetServers;
