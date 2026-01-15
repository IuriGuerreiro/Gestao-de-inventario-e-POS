import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, seedTestData, TestDatabase } from './testDb';
import { createDatabaseService, DatabaseService } from '../database.core';

describe('Product Functions', () => {
  let testDb: TestDatabase;
  let db: DatabaseService;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    db = createDatabaseService(testDb);
  });

  afterEach(() => {
    testDb.close();
  });

  describe('getAllProducts', () => {
    it('should return empty array when no products exist', async () => {
      const products = await db.getAllProducts();
      expect(products).toEqual([]);
    });

    it('should return all products ordered by name', async () => {
      await seedTestData(testDb);
      const products = await db.getAllProducts();

      expect(products.length).toBe(5);
      expect(products[0].name).toBe('Mechanical Keyboard');
      expect(products[4].name).toBe('Wireless Mouse');
    });
  });

  describe('getProductById', () => {
    it('should return null for non-existent product', async () => {
      const product = await db.getProductById(999);
      expect(product).toBeNull();
    });

    it('should return product by id', async () => {
      await seedTestData(testDb);
      const product = await db.getProductById(1);

      expect(product).not.toBeNull();
      expect(product!.name).toBe('Wireless Mouse');
      expect(product!.price).toBe(29.99);
    });
  });

  describe('searchProducts', () => {
    beforeEach(async () => {
      await seedTestData(testDb);
    });

    it('should find products by name', async () => {
      const products = await db.searchProducts('Mouse');

      expect(products.length).toBe(1);
      expect(products[0].name).toBe('Wireless Mouse');
    });

    it('should find products by SKU', async () => {
      const products = await db.searchProducts('KB-002');

      expect(products.length).toBe(1);
      expect(products[0].name).toBe('Mechanical Keyboard');
    });

    it('should find products by category', async () => {
      const products = await db.searchProducts('Electronics');

      expect(products.length).toBe(4);
    });

    it('should be case insensitive', async () => {
      const products = await db.searchProducts('mouse');

      expect(products.length).toBe(1);
    });

    it('should return empty array for no matches', async () => {
      const products = await db.searchProducts('nonexistent');

      expect(products).toEqual([]);
    });
  });

  describe('getProductsByCategory', () => {
    beforeEach(async () => {
      await seedTestData(testDb);
    });

    it('should return products in category', async () => {
      // Electronics has category_id = 1
      const products = await db.getProductsByCategory(1);

      expect(products.length).toBe(4);
      products.forEach(p => {
        expect(p.category_id).toBe(1);
        expect(p.category_name).toBe('Electronics');
      });
    });

    it('should return empty array for non-existent category', async () => {
      const products = await db.getProductsByCategory(999);

      expect(products).toEqual([]);
    });
  });

  describe('getLowStockProducts', () => {
    beforeEach(async () => {
      await seedTestData(testDb);
    });

    it('should return products with quantity <= min_quantity', async () => {
      const products = await db.getLowStockProducts();

      expect(products.length).toBe(1);
      expect(products[0].name).toBe('Webcam HD');
      expect(products[0].quantity).toBe(8);
      expect(products[0].min_quantity).toBe(10);
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      await seedTestData(testDb); // Need categories to exist
      const newProduct = await db.createProduct({
        name: 'Test Product',
        description: 'A test product',
        sku: 'TEST-001',
        price: 19.99,
        cost: 10.00,
        quantity: 50,
        min_quantity: 5,
        category_id: 1, // Electronics
      });

      expect(newProduct.id).toBeDefined();
      expect(newProduct.name).toBe('Test Product');
      expect(newProduct.price).toBe(19.99);
      expect(newProduct.category_id).toBe(1);
      expect(newProduct.category_name).toBe('Electronics');
      expect(newProduct.created_at).toBeDefined();
    });

    it('should create product with null optional fields', async () => {
      const newProduct = await db.createProduct({
        name: 'Minimal Product',
        description: null,
        sku: null,
        price: 9.99,
        cost: 5.00,
        quantity: 10,
        min_quantity: 2,
        category_id: null,
      });

      expect(newProduct.id).toBeDefined();
      expect(newProduct.description).toBeNull();
      expect(newProduct.sku).toBeNull();
      expect(newProduct.category_id).toBeNull();
    });
  });

  describe('updateProduct', () => {
    beforeEach(async () => {
      await seedTestData(testDb);
    });

    it('should update product fields', async () => {
      const updated = await db.updateProduct(1, {
        name: 'Updated Mouse',
        price: 34.99,
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Mouse');
      expect(updated!.price).toBe(34.99);
      expect(updated!.sku).toBe('WM-001'); // unchanged
    });

    it('should return null for non-existent product', async () => {
      const updated = await db.updateProduct(999, { name: 'Test' });

      expect(updated).toBeNull();
    });

    it('should return unchanged product if no updates provided', async () => {
      const original = await db.getProductById(1);
      const updated = await db.updateProduct(1, {});

      expect(updated!.name).toBe(original!.name);
    });
  });

  describe('deleteProduct', () => {
    beforeEach(async () => {
      await seedTestData(testDb);
    });

    it('should delete existing product', async () => {
      const result = await db.deleteProduct(1);

      expect(result).toBe(true);

      const product = await db.getProductById(1);
      expect(product).toBeNull();
    });

    it('should return false for non-existent product', async () => {
      const result = await db.deleteProduct(999);

      expect(result).toBe(false);
    });
  });

  describe('updateProductQuantity', () => {
    beforeEach(async () => {
      await seedTestData(testDb);
    });

    it('should increase product quantity', async () => {
      const original = await db.getProductById(1);
      const updated = await db.updateProductQuantity(1, 10);

      expect(updated!.quantity).toBe(original!.quantity + 10);
    });

    it('should decrease product quantity', async () => {
      const original = await db.getProductById(1);
      const updated = await db.updateProductQuantity(1, -5);

      expect(updated!.quantity).toBe(original!.quantity - 5);
    });

    it('should return null for non-existent product', async () => {
      const updated = await db.updateProductQuantity(999, 10);

      expect(updated).toBeNull();
    });
  });

  describe('getAllCategories', () => {
    it('should return empty array when no categories', async () => {
      const categories = await db.getAllCategories();

      expect(categories).toEqual([]);
    });

    it('should return all categories sorted alphabetically by name', async () => {
      await seedTestData(testDb);
      const categories = await db.getAllCategories();

      expect(categories.length).toBe(2);
      expect(categories[0].name).toBe('Accessories');
      expect(categories[1].name).toBe('Electronics');
    });

    it('should include category details', async () => {
      await seedTestData(testDb);
      const categories = await db.getAllCategories();

      expect(categories[0].id).toBeDefined();
      expect(categories[0].description).toBeDefined();
      expect(categories[0].color).toBeDefined();
      expect(categories[0].created_at).toBeDefined();
    });
  });
});
