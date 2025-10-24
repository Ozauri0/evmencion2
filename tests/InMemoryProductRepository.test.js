/**
 * Test unitario 4: InMemoryProductRepository
 * Prueba las operaciones de persistencia en memoria
 */

const InMemoryProductRepository = require('../src/infrastructure/repositories/InMemoryProductRepository');
const Product = require('../src/domain/entities/Product');

describe('InMemoryProductRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new InMemoryProductRepository();
  });

  test('debe inicializar con productos por defecto', async () => {
    const products = await repository.findAll();
    
    expect(products).toHaveLength(2);
    expect(products[0].titulo).toBe('Servidor VPS Básico');
    expect(products[1].titulo).toBe('Servidor VPS Avanzado');
  });

  test('debe encontrar producto por ID existente', async () => {
    const product = await repository.findById(1);
    
    expect(product).toBeDefined();
    expect(product.id).toBe(1);
    expect(product.titulo).toBe('Servidor VPS Básico');
  });

  test('debe retornar undefined para ID inexistente', async () => {
    const product = await repository.findById(999);
    
    expect(product).toBeUndefined();
  });

  test('debe guardar un nuevo producto', async () => {
    const newProduct = new Product(
      3,
      'Nuevo Servidor',
      'Descripción del nuevo servidor de prueba',
      2000,
      8,
      16,
      200,
      'Test Cluster',
      'activo',
      '2024-01-01T00:00:00Z',
      { link: 'https://test.com/productos/3' }
    );

    const savedProduct = await repository.save(newProduct);
    
    expect(savedProduct.id).toBe(3);
    expect(savedProduct.titulo).toBe('Nuevo Servidor');
    
    // Verificar que se agregó a la lista
    const allProducts = await repository.findAll();
    expect(allProducts).toHaveLength(3);
  });

  test('debe generar ID incremental', async () => {
    const firstId = await repository.getNextId();
    const secondId = await repository.getNextId();
    
    expect(firstId).toBe(3);
    expect(secondId).toBe(4);
  });

  test('debe actualizar producto existente', async () => {
    const updatedData = { titulo: 'Título Actualizado', precio: 5000 };
    
    const updatedProduct = await repository.update(1, updatedData);
    
    expect(updatedProduct.titulo).toBe('Título Actualizado');
    expect(updatedProduct.precio).toBe(5000);
    expect(updatedProduct.id).toBe(1); // ID no debe cambiar
  });

  test('debe retornar null al actualizar producto inexistente', async () => {
    const result = await repository.update(999, { titulo: 'Test' });
    
    expect(result).toBeNull();
  });

  test('debe eliminar producto existente', async () => {
    const result = await repository.delete(1);
    
    expect(result).toBe(true);
    
    // Verificar que se eliminó
    const product = await repository.findById(1);
    expect(product).toBeUndefined();
    
    const allProducts = await repository.findAll();
    expect(allProducts).toHaveLength(1);
  });

  test('debe retornar false al eliminar producto inexistente', async () => {
    const result = await repository.delete(999);
    
    expect(result).toBe(false);
  });

  test('debe buscar productos por título', async () => {
    const products = await repository.findByTitle('VPS');
    
    expect(products).toHaveLength(2);
    expect(products.every(p => p.titulo.includes('VPS'))).toBe(true);
  });

  test('debe filtrar productos por estado', async () => {
    const activeProducts = await repository.findByEstado('activo');
    
    expect(activeProducts).toHaveLength(2);
    expect(activeProducts.every(p => p.estado === 'activo')).toBe(true);
  });
});
