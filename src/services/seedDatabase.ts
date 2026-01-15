import { mockProducts, mockSales, mockSaleItems, mockCategories } from './mockData';

// This will be called on app startup to seed mock data if enabled
export async function seedDatabaseIfNeeded(db: any): Promise<void> {
  const seedEnv = import.meta.env.VITE_SEED_MOCK_DATA;
  console.log(`[Seed Check] VITE_SEED_MOCK_DATA is: "${seedEnv}"`);

  if (seedEnv !== 'true') {
    console.log('[Seed Check] Seeding disabled. Skipping.');
    return;
  }

  // Check if data already exists
  const existingProducts = await db.select('SELECT COUNT(*) as count FROM products') as { count: number }[];
  if (existingProducts[0].count > 0) {
    console.log('Database already has data, skipping seed');
    return;
  }

  console.log('Seeding database with mock data...');

  // Insert categories first
  for (const category of mockCategories) {
    await db.execute(
      `INSERT INTO categories (name, description, color, created_at)
       VALUES ($1, $2, $3, $4)`,
      [
        category.name,
        category.description,
        category.color,
        category.created_at,
      ]
    );
  }

  // Insert products
  for (const product of mockProducts) {
    await db.execute(
      `INSERT INTO products (name, description, sku, price, cost, quantity, min_quantity, category_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        product.name,
        product.description,
        product.sku,
        product.price,
        product.cost,
        product.quantity,
        product.min_quantity,
        product.category_id,
        product.created_at,
        product.updated_at,
      ]
    );
  }

  // Insert sales
  for (const sale of mockSales) {
    await db.execute(
      `INSERT INTO sales (total_amount, payment_method, notes, created_at)
       VALUES ($1, $2, $3, $4)`,
      [sale.total_amount, sale.payment_method, sale.notes, sale.created_at]
    );
  }

  // Insert sale items
  for (const item of mockSaleItems) {
    await db.execute(
      `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5)`,
      [item.sale_id, item.product_id, item.quantity, item.unit_price, item.subtotal]
    );
  }

  console.log('Mock data seeded successfully');
}
