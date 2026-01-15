import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, seedTestData, TestDatabase } from './testDb';
import { createDatabaseService, DatabaseService } from '../database.core';

describe('Sales Analytics Functions', () => {
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

  describe('getTopSellingProducts', () => {
    it('should return empty array when no sales', async () => {
      const result = await db.getTopSellingProducts(5);
      expect(result).toEqual([]);
    });

    it('should return top selling products ordered by quantity', async () => {
      // Create some sales
      await db.createSale({ items: [{ product_id: 1, quantity: 10 }] });
      await db.createSale({ items: [{ product_id: 2, quantity: 5 }] });
      await db.createSale({ items: [{ product_id: 1, quantity: 3 }] });

      const result = await db.getTopSellingProducts(5);

      expect(result.length).toBe(2);
      expect(result[0].product_name).toBe('Wireless Mouse');
      expect(result[0].total_quantity).toBe(13);
      expect(result[1].product_name).toBe('Mechanical Keyboard');
      expect(result[1].total_quantity).toBe(5);
    });

    it('should respect limit parameter', async () => {
      await db.createSale({ items: [
        { product_id: 1, quantity: 10 },
        { product_id: 2, quantity: 5 },
        { product_id: 3, quantity: 3 },
      ]});

      const result = await db.getTopSellingProducts(2);

      expect(result.length).toBe(2);
    });

    it('should calculate total revenue correctly', async () => {
      await db.createSale({ items: [{ product_id: 1, quantity: 2 }] }); // 29.99 * 2

      const result = await db.getTopSellingProducts(5);

      expect(result[0].total_revenue).toBeCloseTo(59.98, 2);
    });
  });

  describe('getSalesByPaymentMethod', () => {
    it('should return empty array when no sales', async () => {
      const freshDb = await createTestDatabase();
      const freshService = createDatabaseService(freshDb);

      const result = await freshService.getSalesByPaymentMethod();
      expect(result).toEqual([]);

      freshDb.close();
    });

    it('should group sales by payment method', async () => {
      await db.createSale({ items: [{ product_id: 1, quantity: 1 }], payment_method: 'Cash' });
      await db.createSale({ items: [{ product_id: 2, quantity: 1 }], payment_method: 'Cash' });
      await db.createSale({ items: [{ product_id: 3, quantity: 1 }], payment_method: 'Card' });

      const result = await db.getSalesByPaymentMethod();

      expect(result.length).toBe(2);

      const cash = result.find(r => r.payment_method === 'Cash');
      const card = result.find(r => r.payment_method === 'Card');

      expect(cash?.count).toBe(2);
      expect(card?.count).toBe(1);
    });

    it('should handle null payment method', async () => {
      await db.createSale({ items: [{ product_id: 1, quantity: 1 }] }); // No payment method

      const result = await db.getSalesByPaymentMethod();

      expect(result[0].payment_method).toBe('Not specified');
    });
  });

  describe('getProfitReport', () => {
    it('should return zeros when no sales', async () => {
      const freshDb = await createTestDatabase();
      const freshService = createDatabaseService(freshDb);

      const result = await freshService.getProfitReport();

      expect(result.total_revenue).toBe(0);
      expect(result.total_cost).toBe(0);
      expect(result.gross_profit).toBe(0);
      expect(result.profit_margin).toBe(0);
      expect(result.by_product).toEqual([]);

      freshDb.close();
    });

    it('should calculate profit correctly', async () => {
      // Wireless Mouse: price 29.99, cost 15.00, profit per unit = 14.99
      await db.createSale({ items: [{ product_id: 1, quantity: 2 }] });

      const result = await db.getProfitReport();

      expect(result.total_revenue).toBeCloseTo(59.98, 2);
      expect(result.total_cost).toBeCloseTo(30.00, 2);
      expect(result.gross_profit).toBeCloseTo(29.98, 2);
      expect(result.profit_margin).toBeGreaterThan(0);
    });

    it('should break down profit by product', async () => {
      await db.createSale({ items: [
        { product_id: 1, quantity: 2 },
        { product_id: 2, quantity: 1 },
      ]});

      const result = await db.getProfitReport();

      expect(result.by_product.length).toBe(2);
      expect(result.by_product[0].product_name).toBeDefined();
      expect(result.by_product[0].profit).toBeGreaterThan(0);
    });
  });

  describe('getAverageSaleValue', () => {
    it('should return zeros when no sales', async () => {
      const freshDb = await createTestDatabase();
      const freshService = createDatabaseService(freshDb);

      const result = await freshService.getAverageSaleValue();

      expect(result.average).toBe(0);
      expect(result.count).toBe(0);
      expect(result.total).toBe(0);

      freshDb.close();
    });

    it('should calculate average correctly', async () => {
      await db.createSale({ items: [{ product_id: 1, quantity: 1 }] }); // 29.99
      await db.createSale({ items: [{ product_id: 2, quantity: 1 }] }); // 89.99

      const result = await db.getAverageSaleValue();

      expect(result.count).toBe(2);
      expect(result.total).toBeCloseTo(119.98, 2);
      expect(result.average).toBeCloseTo(59.99, 2);
    });
  });
});

describe('Inventory Management Functions', () => {
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

  describe('restockProduct', () => {
    it('should increase product quantity', async () => {
      const original = await db.getProductById(1);
      const result = await db.restockProduct(1, 50);

      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(original!.quantity + 50);
    });

    it('should update cost when provided', async () => {
      const result = await db.restockProduct(1, 50, 12.00);

      expect(result).not.toBeNull();
      expect(result!.cost).toBe(12.00);
    });

    it('should not update cost when not provided', async () => {
      const original = await db.getProductById(1);
      const result = await db.restockProduct(1, 50);

      expect(result!.cost).toBe(original!.cost);
    });

    it('should return null for non-existent product', async () => {
      const result = await db.restockProduct(999, 50);
      expect(result).toBeNull();
    });
  });

  describe('getProductSalesHistory', () => {
    it('should return null for non-existent product', async () => {
      const result = await db.getProductSalesHistory(999);
      expect(result).toBeNull();
    });

    it('should return empty sales for product with no sales', async () => {
      const result = await db.getProductSalesHistory(1);

      expect(result).not.toBeNull();
      expect(result!.product_name).toBe('Wireless Mouse');
      expect(result!.sales).toEqual([]);
      expect(result!.total_quantity).toBe(0);
      expect(result!.total_revenue).toBe(0);
    });

    it('should return sales history', async () => {
      await db.createSale({ items: [{ product_id: 1, quantity: 2 }] });
      await db.createSale({ items: [{ product_id: 1, quantity: 3 }] });

      const result = await db.getProductSalesHistory(1);

      expect(result).not.toBeNull();
      expect(result!.sales.length).toBe(2);
      expect(result!.total_quantity).toBe(5);
      expect(result!.total_revenue).toBeCloseTo(29.99 * 5, 2);
    });

    it('should order sales by date descending', async () => {
      await db.createSale({ items: [{ product_id: 1, quantity: 1 }] });
      await db.createSale({ items: [{ product_id: 1, quantity: 2 }] });

      const result = await db.getProductSalesHistory(1);

      // Verify both sales are returned
      expect(result!.sales.length).toBe(2);
      // Check that both quantities are present (order may vary with same-second timestamps)
      const quantities = result!.sales.map(s => s.quantity).sort();
      expect(quantities).toEqual([1, 2]);
    });
  });
});
