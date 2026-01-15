import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, seedTestData, TestDatabase } from './testDb';
import { createDatabaseService, DatabaseService } from '../database.core';

describe('Report Functions', () => {
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

  describe('getSalesReport', () => {
    it('should return zeros for date range with no sales', async () => {
      const report = await db.getSalesReport('2020-01-01', '2020-01-02');

      expect(report.total_sales).toBe(0);
      expect(report.total_revenue).toBe(0);
      expect(report.items_sold).toBe(0);
      expect(report.sales_by_day).toEqual([]);
    });

    it('should calculate correct totals', async () => {
      await db.createSale({
        items: [{ product_id: 1, quantity: 2 }],
      });

      await db.createSale({
        items: [
          { product_id: 2, quantity: 1 },
          { product_id: 3, quantity: 1 },
        ],
      });

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const report = await db.getSalesReport(today, tomorrow);

      expect(report.total_sales).toBe(2);
      expect(report.total_revenue).toBeCloseTo(59.98 + 89.99 + 49.99, 2);
      expect(report.items_sold).toBe(4);
    });

    it('should group sales by day', async () => {
      await db.createSale({
        items: [{ product_id: 1, quantity: 1 }],
      });

      await db.createSale({
        items: [{ product_id: 2, quantity: 1 }],
      });

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const report = await db.getSalesReport(today, tomorrow);

      expect(report.sales_by_day.length).toBe(1);
      expect(report.sales_by_day[0].date).toBe(today);
      expect(report.sales_by_day[0].count).toBe(2);
    });
  });

  describe('getTodaysSales', () => {
    it('should return zeros when no sales today', async () => {
      const result = await db.getTodaysSales();

      expect(result.count).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should count and sum today sales', async () => {
      await db.createSale({
        items: [{ product_id: 1, quantity: 1 }],
      });

      await db.createSale({
        items: [{ product_id: 2, quantity: 1 }],
      });

      const result = await db.getTodaysSales();

      expect(result.count).toBe(2);
      expect(result.total).toBeCloseTo(29.99 + 89.99, 2);
    });
  });

  describe('getInventoryValue', () => {
    it('should return zeros when no products', async () => {
      const freshDb = await createTestDatabase();
      const freshService = createDatabaseService(freshDb);

      const result = await freshService.getInventoryValue();

      expect(result.totalCost).toBe(0);
      expect(result.totalRetail).toBe(0);

      freshDb.close();
    });

    it('should calculate inventory values correctly', async () => {
      const result = await db.getInventoryValue();

      const expectedCost = (15 * 45) + (45 * 23) + (22 * 67) + (18 * 34) + (28 * 8);
      const expectedRetail = (29.99 * 45) + (89.99 * 23) + (49.99 * 67) + (39.99 * 34) + (59.99 * 8);

      expect(result.totalCost).toBeCloseTo(expectedCost, 2);
      expect(result.totalRetail).toBeCloseTo(expectedRetail, 2);
    });

    it('should update after sales reduce stock', async () => {
      const before = await db.getInventoryValue();

      await db.createSale({
        items: [{ product_id: 1, quantity: 5 }],
      });

      const after = await db.getInventoryValue();

      expect(after.totalCost).toBeCloseTo(before.totalCost - (15 * 5), 2);
      expect(after.totalRetail).toBeCloseTo(before.totalRetail - (29.99 * 5), 2);
    });
  });
});
