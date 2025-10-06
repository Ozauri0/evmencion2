class GetServerById {
  constructor(serverRepository) {
    this.serverRepository = serverRepository;
  }

  async execute(id) {
    return await this.serverRepository.findById(id);
  }
}

module.exports = GetServerById;
