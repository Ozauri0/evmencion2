/**
 * Test unitario 1: Entidad Product
 * Prueba las validaciones de dominio y la creación de productos
 */

const Product = require('../src/domain/entities/Product');

describe('Product Entity', () => {
  const validProductData = {
    id: 1,
    titulo: 'Servidor Test',
    descripcion: 'Descripción de prueba para el servidor',
    precio: 1000,
    nucleos: 4,
    ram: 8,
    disco: 100,
    cluster: 'Cluster Test',
    estado: 'activo',
    fechaCreacion: '2024-01-01T00:00:00Z',
    self: { link: 'https://test.com/productos/1' }
  };

  test('debe crear un producto con datos válidos', () => {
    const product = new Product(...Object.values(validProductData));
    
    expect(product.titulo).toBe('Servidor Test');
    expect(product.precio).toBe(1000);
    expect(product.nucleos).toBe(4);
    expect(product.estado).toBe('activo');
  });

  test('debe fallar si el título está vacío', () => {
    expect(() => {
      new Product(
        1, '', 'Descripción válida', 1000, 4, 8, 100, 
        'Cluster Test', 'activo', '2024-01-01', {}
      );
    }).toThrow('Título es requerido y debe ser un texto');
  });

  test('debe fallar si el precio es negativo', () => {
    expect(() => {
      new Product(
        1, 'Título válido', 'Descripción válida', -100, 4, 8, 100,
        'Cluster Test', 'activo', '2024-01-01', {}
      );
    }).toThrow('Precio es requerido y debe ser un número positivo');
  });

  test('debe fallar si los núcleos no son un entero positivo', () => {
    expect(() => {
      new Product(
        1, 'Título válido', 'Descripción válida', 1000, 0, 8, 100,
        'Cluster Test', 'activo', '2024-01-01', {}
      );
    }).toThrow('Núcleos debe ser un número entero positivo');
  });

  test('debe validar estados permitidos correctamente', () => {
    expect(Product.isValidEstado('activo')).toBe(true);
    expect(Product.isValidEstado('inactivo')).toBe(true);
    expect(Product.isValidEstado('mantenimiento')).toBe(true);
    expect(Product.isValidEstado('invalid')).toBe(false);
  });

  test('debe cambiar estado si es válido', () => {
    const product = new Product(...Object.values(validProductData));
    
    product.cambiarEstado('inactivo');
    expect(product.estado).toBe('inactivo');
  });

  test('debe fallar al cambiar a estado inválido', () => {
    const product = new Product(...Object.values(validProductData));
    
    expect(() => {
      product.cambiarEstado('estado_invalido');
    }).toThrow('Estado inválido. Estados permitidos: activo, inactivo, mantenimiento');
  });
});
