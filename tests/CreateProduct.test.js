/**
 * Test unitario 2: Caso de uso CreateProduct
 * Prueba la lógica de negocio para crear productos
 */

const CreateProduct = require('../src/application/useCases/CreateProduct');

// Mock del repositorio
const mockRepository = {
  getNextId: jest.fn(),
  save: jest.fn()
};

describe('CreateProduct Use Case', () => {
  let createProduct;

  beforeEach(() => {
    createProduct = new CreateProduct(mockRepository);
    // Resetear mocks antes de cada test
    jest.clearAllMocks();
  });

  test('debe crear un producto con todos los parámetros', async () => {
    // Arrange
    mockRepository.getNextId.mockResolvedValue(1);
    mockRepository.save.mockResolvedValue({
      id: 1,
      titulo: 'Servidor Test',
      descripcion: 'Descripción de test',
      precio: 1000,
      nucleos: 4,
      ram: 8,
      disco: 100
    });

    // Act
    const result = await createProduct.execute(
      'Servidor Test',
      'Descripción de test',
      1000,
      4,
      8,
      100,
      'Cluster Test',
      'activo'
    );

    // Assert
    expect(mockRepository.getNextId).toHaveBeenCalledTimes(1);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(result.titulo).toBe('Servidor Test');
  });

  test('debe usar estado "activo" por defecto', async () => {
    // Arrange
    mockRepository.getNextId.mockResolvedValue(1);
    mockRepository.save.mockImplementation(product => Promise.resolve(product));

    // Act
    const result = await createProduct.execute(
      'Servidor Test',
      'Descripción de test',
      1000,
      4,
      8,
      100,
      'Cluster Test'
      // Sin estado - debe usar por defecto
    );

    // Assert
    expect(result.estado).toBe('activo');
  });

  test('debe generar fecha de creación automáticamente', async () => {
    // Arrange
    const beforeTest = new Date().toISOString();
    mockRepository.getNextId.mockResolvedValue(1);
    mockRepository.save.mockImplementation(product => Promise.resolve(product));

    // Act
    const result = await createProduct.execute(
      'Servidor Test',
      'Descripción de test',
      1000,
      4,
      8,
      100
    );

    const afterTest = new Date().toISOString();

    // Assert
    expect(result.fechaCreacion).toBeDefined();
    expect(result.fechaCreacion >= beforeTest).toBe(true);
    expect(result.fechaCreacion <= afterTest).toBe(true);
  });

  test('debe generar link self automáticamente', async () => {
    // Arrange
    mockRepository.getNextId.mockResolvedValue(42);
    mockRepository.save.mockImplementation(product => Promise.resolve(product));

    // Act
    const result = await createProduct.execute(
      'Servidor Test',
      'Descripción de test',
      1000,
      4,
      8,
      100
    );

    // Assert
    expect(result.self.link).toBe('https://ejemplo.com/productos/42');
  });

  test('debe propagar errores del repositorio', async () => {
    // Arrange
    mockRepository.getNextId.mockRejectedValue(new Error('Database error'));

    // Act & Assert
    await expect(
      createProduct.execute('Servidor Test', 'Descripción', 1000, 4, 8, 100)
    ).rejects.toThrow('Database error');
  });
});
