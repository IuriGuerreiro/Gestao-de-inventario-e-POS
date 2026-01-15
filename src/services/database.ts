import Database from '@tauri-apps/plugin-sql';
import {
  Product,
  Sale,
  SaleWithItems,
  SalesReport,
  CreateProduct,
  UpdateProduct,
  CreateSale,
  SaleItem,
  TopSellingProduct,
  PaymentMethodBreakdown,
  ProfitReport,
  ProductSalesHistory,
  Category,
  CreateCategory,
  UpdateCategory,
} from '../types';
import { seedDatabaseIfNeeded } from './seedDatabase';

let db: Database | null = null;

export async function initDatabase(): Promise<void> {
  if (db) return;
  db = await Database.load('sqlite:inventory_v2.db');
  
  // Migration: Add deleted_at column if it doesn't exist
  try {
    await db.execute('ALTER TABLE products ADD COLUMN deleted_at DATETIME DEFAULT NULL');
  } catch (e: any) {
    // Column likely already exists, ignore error
  }

  await seedDatabaseIfNeeded(db);
}

function getDb(): Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

// ============ CATEGORIES ============

export async function getAllCategories(): Promise<Category[]> {
  return getDb().select<Category[]>('SELECT * FROM categories ORDER BY name');
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const results = await getDb().select<Category[]>('SELECT * FROM categories WHERE id = $1', [id]);
  return results[0] || null;
}

export async function getCategories(): Promise<Category[]> {
    return getAllCategories();
}


export async function createCategory(data: CreateCategory): Promise<Category> {
  const result = await getDb().execute(
    'INSERT INTO categories (name, description, color) VALUES ($1, $2, $3)',
    [data.name, data.description || null, data.color || null]
  );
  if (!result.lastInsertId) throw new Error('Failed to retrieve category ID');
  const category = await getCategoryById(result.lastInsertId);
  if (!category) throw new Error('Failed to create category');
  return category;
}

export async function updateCategory(id: number, data: UpdateCategory): Promise<Category | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
  if (data.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(data.description); }
  if (data.color !== undefined) { fields.push(`color = $${paramIndex++}`); values.push(data.color); }

  if (fields.length === 0) return getCategoryById(id);

  values.push(id);

  await getDb().execute(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return getCategoryById(id);
}

export async function deleteCategory(id: number): Promise<boolean> {
  await getDb().execute('UPDATE products SET category_id = NULL WHERE category_id = $1', [id]);
  const result = await getDb().execute('DELETE FROM categories WHERE id = $1', [id]);
  return result.rowsAffected > 0;
}

// ============ PRODUCTS ============

export async function getAllProducts(): Promise<Product[]> {
  return getDb().select<Product[]>(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.deleted_at IS NULL
     ORDER BY p.name`
  );
}

export async function getProductById(id: number): Promise<Product | null> {
  const results = await getDb().select<Product[]>(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [id]
  );
  return results[0] || null;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const pattern = `%${query}%`;
  return getDb().select<Product[]>(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE (p.name LIKE $1 OR p.sku LIKE $1 OR c.name LIKE $1) AND p.deleted_at IS NULL
     ORDER BY p.name`,
    [pattern]
  );
}

export async function getProductsByCategory(categoryId: number | string): Promise<Product[]> {
  // Handle case where category might be passed as string name from legacy code, though ideally should be ID
  if (typeof categoryId === 'string') {
      // Try to find category by name first
       const cats = await getDb().select<Category[]>('SELECT * FROM categories WHERE name = $1', [categoryId]);
       if (cats.length > 0) {
           categoryId = cats[0].id;
       } else {
           return [];
       }
  }

  return getDb().select<Product[]>(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.category_id = $1 AND p.deleted_at IS NULL
     ORDER BY p.name`,
    [categoryId]
  );
}

export async function getLowStockProducts(): Promise<Product[]> {
  return getDb().select<Product[]>(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.quantity <= p.min_quantity AND p.deleted_at IS NULL
     ORDER BY p.quantity ASC`
  );
}

export async function createProduct(data: CreateProduct): Promise<Product> {
  const result = await getDb().execute(
    `INSERT INTO products (name, description, sku, price, cost, quantity, min_quantity, category_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [data.name, data.description, data.sku, data.price, data.cost, data.quantity, data.min_quantity, data.category_id]
  );
  if (!result.lastInsertId) throw new Error('Failed to retrieve product ID');
  const product = await getProductById(result.lastInsertId);
  if (!product) throw new Error('Failed to create product');
  return product;
}

export async function updateProduct(id: number, data: UpdateProduct): Promise<Product | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
  if (data.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(data.description); }
  if (data.sku !== undefined) { fields.push(`sku = $${paramIndex++}`); values.push(data.sku); }
  if (data.price !== undefined) { fields.push(`price = $${paramIndex++}`); values.push(data.price); }
  if (data.cost !== undefined) { fields.push(`cost = $${paramIndex++}`); values.push(data.cost); }
  if (data.quantity !== undefined) { fields.push(`quantity = $${paramIndex++}`); values.push(data.quantity); }
  if (data.min_quantity !== undefined) { fields.push(`min_quantity = $${paramIndex++}`); values.push(data.min_quantity); }
  if (data.category_id !== undefined) { fields.push(`category_id = $${paramIndex++}`); values.push(data.category_id); }

  if (fields.length === 0) return getProductById(id);

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await getDb().execute(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return getProductById(id);
}

export async function deleteProduct(id: number): Promise<boolean> {
  // Soft delete: set deleted_at and modify SKU to allow reuse
  // We append a timestamp to the SKU to avoid unique constraint violations if the user creates a new product with the same SKU
  const result = await getDb().execute(
    `UPDATE products 
     SET deleted_at = CURRENT_TIMESTAMP, 
         sku = CASE WHEN sku IS NOT NULL THEN sku || '_del_' || CAST(strftime('%s', 'now') AS TEXT) ELSE NULL END 
     WHERE id = $1`, 
    [id]
  );
  return result.rowsAffected > 0;
}

export async function updateProductQuantity(id: number, quantityChange: number): Promise<Product | null> {
  await getDb().execute(
    'UPDATE products SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [quantityChange, id]
  );
  return getProductById(id);
}

// ============ SALES ============

export async function getAllSales(): Promise<Sale[]> {
  return getDb().select<Sale[]>('SELECT * FROM sales ORDER BY created_at DESC');
}

export async function getSaleById(id: number): Promise<SaleWithItems | null> {
  const sales = await getDb().select<Sale[]>('SELECT * FROM sales WHERE id = $1', [id]);
  if (sales.length === 0) return null;

  const items = await getDb().select<(SaleItem & { product_name: string })[]>(
    `SELECT si.*, p.name as product_name
     FROM sale_items si
     JOIN products p ON si.product_id = p.id
     WHERE si.sale_id = $1`,
    [id]
  );

  return { ...sales[0], items };
}

export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  return getDb().select<Sale[]>(
    'SELECT * FROM sales WHERE created_at >= $1 AND created_at <= $2 ORDER BY created_at DESC',
    [startDate, endDate]
  );
}

export async function createSale(data: CreateSale): Promise<SaleWithItems> {
  const database = getDb();

  let totalAmount = 0;
  const itemsWithPrices: { product_id: number; quantity: number; unit_price: number; subtotal: number; product_name: string }[] = [];

  for (const item of data.items) {
    const product = await getProductById(item.product_id);
    if (!product) throw new Error(`Product ${item.product_id} not found`);
    // Allow negative stock: if (product.quantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

    const subtotal = product.price * item.quantity;
    totalAmount += subtotal;
    itemsWithPrices.push({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: product.price,
      subtotal,
      product_name: product.name,
    });
  }

  const saleResult = await database.execute(
    'INSERT INTO sales (total_amount, payment_method, notes) VALUES ($1, $2, $3)',
    [totalAmount, data.payment_method || null, data.notes || null]
  );
  
  if (!saleResult.lastInsertId) throw new Error('Failed to retrieve sale ID');
  const saleId = saleResult.lastInsertId;

  const saleItems: (SaleItem & { product_name: string })[] = [];

  for (const item of itemsWithPrices) {
    const itemResult = await database.execute(
      'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)',
      [saleId, item.product_id, item.quantity, item.unit_price, item.subtotal]
    );

    await database.execute(
      'UPDATE products SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [item.quantity, item.product_id]
    );

    if (itemResult.lastInsertId) {
      saleItems.push({
        id: itemResult.lastInsertId,
        sale_id: saleId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        product_name: item.product_name,
      });
    }
  }

  const sales = await database.select<Sale[]>('SELECT * FROM sales WHERE id = $1', [saleId]);

  return { ...sales[0], items: saleItems };
}

export async function deleteSale(id: number): Promise<boolean> {
  const result = await getDb().execute('DELETE FROM sales WHERE id = $1', [id]);
  return result.rowsAffected > 0;
}

// ============ REPORTS ============

export async function getSalesReport(startDate: string, endDate: string): Promise<SalesReport> {
  const database = getDb();

  const summary = await database.select<{ total_sales: number; total_revenue: number }[]>(
    `SELECT COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_revenue
     FROM sales WHERE created_at >= $1 AND created_at <= $2`,
    [startDate, endDate]
  );

  const itemsSum = await database.select<{ items_sold: number }[]>(
    `SELECT COALESCE(SUM(si.quantity), 0) as items_sold
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     WHERE s.created_at >= $1 AND s.created_at <= $2`,
    [startDate, endDate]
  );

  const salesByDay = await database.select<{ date: string; total: number; count: number }[]>(
    `SELECT DATE(created_at) as date, SUM(total_amount) as total, COUNT(*) as count
     FROM sales
     WHERE created_at >= $1 AND created_at <= $2
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [startDate, endDate]
  );

  return {
    total_sales: summary[0]?.total_sales || 0,
    total_revenue: summary[0]?.total_revenue || 0,
    items_sold: itemsSum[0]?.items_sold || 0,
    sales_by_day: salesByDay,
  };
}

export async function getTodaysSales(): Promise<{ count: number; total: number }> {
  const result = await getDb().select<{ count: number; total: number }[]>(
    `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
     FROM sales WHERE DATE(created_at) = DATE('now')`
  );
  return result[0] || { count: 0, total: 0 };
}

export async function getInventoryValue(): Promise<{ totalCost: number; totalRetail: number }> {
  const result = await getDb().select<{ totalCost: number; totalRetail: number }[]>(
    `SELECT
       COALESCE(SUM(cost * quantity), 0) as totalCost,
       COALESCE(SUM(price * quantity), 0) as totalRetail
     FROM products`
  );
  return result[0] || { totalCost: 0, totalRetail: 0 };
}

// ============ SALES ANALYTICS ============

export async function getTopSellingProducts(
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<TopSellingProduct[]> {
  let query = `
    SELECT
      p.id as product_id,
      p.name as product_name,
      COALESCE(SUM(si.quantity), 0) as total_quantity,
      COALESCE(SUM(si.subtotal), 0) as total_revenue
    FROM products p
    LEFT JOIN sale_items si ON p.id = si.product_id
    LEFT JOIN sales s ON si.sale_id = s.id
  `;
  const params: any[] = [];

  if (startDate && endDate) {
    query += ` WHERE (s.created_at >= $1 AND s.created_at <= $2) OR s.id IS NULL`;
    params.push(startDate, endDate);
  }

  query += `
    GROUP BY p.id, p.name
    HAVING COALESCE(SUM(si.quantity), 0) > 0
    ORDER BY total_quantity DESC
    LIMIT $${params.length + 1}
  `;
  params.push(limit);

  return getDb().select<TopSellingProduct[]>(query, params);
}

export async function getSalesByPaymentMethod(
  startDate?: string,
  endDate?: string
): Promise<PaymentMethodBreakdown[]> {
  let query = `
    SELECT
      COALESCE(payment_method, 'Not specified') as payment_method,
      COUNT(*) as count,
      COALESCE(SUM(total_amount), 0) as total
    FROM sales
  `;
  const params: any[] = [];

  if (startDate && endDate) {
    query += ` WHERE created_at >= $1 AND created_at <= $2`;
    params.push(startDate, endDate);
  }

  query += ` GROUP BY payment_method ORDER BY total DESC`;

  return getDb().select<PaymentMethodBreakdown[]>(query, params);
}

export async function getProfitReport(
  startDate?: string,
  endDate?: string
): Promise<ProfitReport> {
  let productQuery = `
    SELECT
      p.id as product_id,
      p.name as product_name,
      COALESCE(SUM(si.quantity), 0) as quantity_sold,
      COALESCE(SUM(si.subtotal), 0) as revenue,
      COALESCE(SUM(si.quantity * p.cost), 0) as cost,
      COALESCE(SUM(si.subtotal - (si.quantity * p.cost)), 0) as profit
    FROM products p
    LEFT JOIN sale_items si ON p.id = si.product_id
    LEFT JOIN sales s ON si.sale_id = s.id
  `;
  const params: any[] = [];

  if (startDate && endDate) {
    productQuery += ` WHERE (s.created_at >= $1 AND s.created_at <= $2) OR s.id IS NULL`;
    params.push(startDate, endDate);
  }

  productQuery += `
    GROUP BY p.id, p.name
    HAVING COALESCE(SUM(si.quantity), 0) > 0
    ORDER BY profit DESC
  `;

  const byProduct = await getDb().select<ProfitReport['by_product']>(productQuery, params);

  const totalRevenue = byProduct.reduce((sum, p) => sum + p.revenue, 0);
  const totalCost = byProduct.reduce((sum, p) => sum + p.cost, 0);
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    total_revenue: totalRevenue,
    total_cost: totalCost,
    gross_profit: grossProfit,
    profit_margin: profitMargin,
    by_product: byProduct,
  };
}

export async function getAverageSaleValue(
  startDate?: string,
  endDate?: string
): Promise<{ average: number; count: number; total: number }> {
  let query = `
    SELECT
      COALESCE(AVG(total_amount), 0) as average,
      COUNT(*) as count,
      COALESCE(SUM(total_amount), 0) as total
    FROM sales
  `;
  const params: any[] = [];

  if (startDate && endDate) {
    query += ` WHERE created_at >= $1 AND created_at <= $2`;
    params.push(startDate, endDate);
  }

  const result = await getDb().select<{ average: number; count: number; total: number }[]>(query, params);
  return result[0] || { average: 0, count: 0, total: 0 };
}

// ============ INVENTORY MANAGEMENT ============

export async function restockProduct(
  id: number,
  quantity: number,
  newCost?: number
): Promise<Product | null> {
  const product = await getProductById(id);
  if (!product) return null;

  if (newCost !== undefined) {
    await getDb().execute(
      'UPDATE products SET quantity = quantity + $1, cost = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [quantity, newCost, id]
    );
  } else {
    await getDb().execute(
      'UPDATE products SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantity, id]
    );
  }

  return getProductById(id);
}

export async function getProductSalesHistory(productId: number): Promise<ProductSalesHistory | null> {
  const product = await getProductById(productId);
  if (!product) return null;

  const sales = await getDb().select<{
    sale_id: number;
    date: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[]>(
    `SELECT
      si.sale_id,
      s.created_at as date,
      si.quantity,
      si.unit_price,
      si.subtotal
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE si.product_id = $1
    ORDER BY s.created_at DESC`,
    [productId]
  );

  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
  const totalRevenue = sales.reduce((sum, s) => sum + s.subtotal, 0);

  return {
    product_id: product.id,
    product_name: product.name,
    sales,
    total_quantity: totalQuantity,
    total_revenue: totalRevenue,
  };
}