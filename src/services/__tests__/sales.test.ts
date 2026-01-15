import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, seedTestData, TestDatabase } from './testDb';
import { createDatabaseService, DatabaseService } from '../database.core';

describe('Sales Functions', () => {
  let testDb: TestDatabase;
  let db: DatabaseService;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    db = createDatabaseService(testDb);
    await seedTestData(testDb);
  });

  afterEach(() => {
    testDb.close();
  });

  describe('getAllSales', () => {
    it('should return empty array when no sales exist', async () => {
      const freshDb = await createTestDatabase();
      const freshService = createDatabaseService(freshDb);

      const sales = await freshService.getAllSales();
      expect(sales).toEqual([]);

      freshDb.close();
    });

    it('should return sales ordered by created_at desc', async () => {
      await db.createSale({
        items: [{ product_id: 1, quantity: 1 }],
        payment_method: 'Cash',
      });

      await db.createSale({
        items: [{ product_id: 2, quantity: 1 }],
        payment_method: 'Card',
      });

      const sales = await db.getAllSales();

      expect(sales.length).toBe(2);
      expect(new Date(sales[0].created_at).getTime()).toBeGreaterThanOrEqual(
        new Date(sales[1].created_at).getTime()
      );
    });
  });

  describe('createSale', () => {
    it('should create a sale with single item', async () => {
      const originalProduct = await db.getProductById(1);
      const originalQuantity = originalProduct!.quantity;

      const sale = await db.createSale({
        items: [{ product_id: 1, quantity: 2 }],
        payment_method: 'Cash',
        notes: 'Test sale',
      });

      expect(sale.id).toBeDefined();
      expect(sale.total_amount).toBe(29.99 * 2);
      expect(sale.payment_method).toBe('Cash');
      expect(sale.notes).toBe('Test sale');
      expect(sale.items.length).toBe(1);
      expect(sale.items[0].product_name).toBe('Wireless Mouse');

      const updatedProduct = await db.getProductById(1);
      expect(updatedProduct!.quantity).toBe(originalQuantity - 2);
    });

    it('should create a sale with multiple items', async () => {
      const sale = await db.createSale({
        items: [
          { product_id: 1, quantity: 1 },
          { product_id: 2, quantity: 2 },
        ],
        payment_method: 'Card',
      });

      expect(sale.items.length).toBe(2);
      expect(sale.total_amount).toBe(29.99 + (89.99 * 2));
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        db.createSale({
          items: [{ product_id: 999, quantity: 1 }],
        })
      ).rejects.toThrow('Product 999 not found');
    });

    it('should allow negative stock (no stock validation)', async () => {
      const sale = await db.createSale({
        items: [{ product_id: 1, quantity: 1000 }],
      });

      expect(sale.id).toBeDefined();

      const product = await db.getProductById(1);
      expect(product!.quantity).toBeLessThan(0);
    });

    it('should create sale with null optional fields', async () => {
      const sale = await db.createSale({
        items: [{ product_id: 1, quantity: 1 }],
      });

      expect(sale.payment_method).toBeNull();
      expect(sale.notes).toBeNull();
    });
  });

  describe('getSaleById', () => {
    it('should return null for non-existent sale', async () => {
      const sale = await db.getSaleById(999);

      expect(sale).toBeNull();
    });

    it('should return sale with items', async () => {
      const created = await db.createSale({
        items: [
          { product_id: 1, quantity: 2 },
          { product_id: 2, quantity: 1 },
        ],
        payment_method: 'Cash',
      });

      const sale = await db.getSaleById(created.id);

      expect(sale).not.toBeNull();
      expect(sale!.id).toBe(created.id);
      expect(sale!.items.length).toBe(2);
      expect(sale!.items[0].product_name).toBeDefined();
    });
  });

  describe('getSalesByDateRange', () => {
    it('should return sales within date range', async () => {
      await db.createSale({
        items: [{ product_id: 1, quantity: 1 }],
      });

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const sales = await db.getSalesByDateRange(today, tomorrow);

      expect(sales.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty for date range with no sales', async () => {
      const sales = await db.getSalesByDateRange('2020-01-01', '2020-01-02');

      expect(sales).toEqual([]);
    });
  });

  describe('deleteSale', () => {
    it('should delete existing sale', async () => {
      const created = await db.createSale({
        items: [{ product_id: 1, quantity: 1 }],
      });

      const result = await db.deleteSale(created.id);

      expect(result).toBe(true);

      const sale = await db.getSaleById(created.id);
      expect(sale).toBeNull();
    });

    it('should return false for non-existent sale', async () => {
      const result = await db.deleteSale(999);

      expect(result).toBe(false);
    });
  });
});
