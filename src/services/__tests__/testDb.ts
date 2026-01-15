// @ts-ignore
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    price REAL NOT NULL DEFAULT 0,
    cost REAL NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    category_id INTEGER REFERENCES categories(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_amount REAL NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
  CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
  CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
`;

export interface TestDatabase {
  select<T>(query: string, params?: any[]): T;
  execute(query: string, params?: any[]): { lastInsertId: number; rowsAffected: number };
  close(): void;
}

function convertParams(query: string, params: any[]): { sql: string; values: any[] } {
  const expandedParams: any[] = [];
  const convertedQuery = query.replace(/\$(\d+)/g, (_, num) => {
    const index = parseInt(num, 10) - 1;
    expandedParams.push(params[index]);
    return '?';
  });
  return { sql: convertedQuery, values: expandedParams };
}

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

export async function createTestDatabase(): Promise<TestDatabase> {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  const db: SqlJsDatabase = new SQL.Database();
  db.run(SCHEMA);

  let lastInsertId = 0;

  return {
    select<T>(query: string, params: any[] = []): T {
      const { sql, values } = convertParams(query, params);
      const stmt = db.prepare(sql);
      stmt.bind(values);

      const results: any[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push(row);
      }
      stmt.free();
      return results as T;
    },

    execute(query: string, params: any[] = []): { lastInsertId: number; rowsAffected: number } {
      const { sql, values } = convertParams(query, params);
      db.run(sql, values);

      // Get last insert id if it was an INSERT
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const result = db.exec('SELECT last_insert_rowid() as id');
        if (result.length > 0 && result[0].values.length > 0) {
          lastInsertId = result[0].values[0][0] as number;
        }
      }

      const changes = db.getRowsModified();
      return {
        lastInsertId,
        rowsAffected: changes,
      };
    },

    close() {
      db.close();
    },
  };
}

export async function seedTestData(db: TestDatabase) {
  // Create categories first
  const categories = [
    { name: 'Electronics', description: 'Electronic devices and gadgets', color: '#3B82F6' },
    { name: 'Accessories', description: 'Computer accessories', color: '#10B981' },
  ];

  for (const c of categories) {
    db.execute(
      `INSERT INTO categories (name, description, color) VALUES ($1, $2, $3)`,
      [c.name, c.description, c.color]
    );
  }

  // Electronics = 1, Accessories = 2
  const products = [
    { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', sku: 'WM-001', price: 29.99, cost: 15.0, quantity: 45, min_quantity: 10, category_id: 1 },
    { name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard', sku: 'KB-002', price: 89.99, cost: 45.0, quantity: 23, min_quantity: 5, category_id: 1 },
    { name: 'USB-C Hub', description: '7-in-1 USB-C hub', sku: 'HUB-003', price: 49.99, cost: 22.0, quantity: 67, min_quantity: 15, category_id: 1 },
    { name: 'Monitor Stand', description: 'Adjustable aluminum stand', sku: 'MS-004', price: 39.99, cost: 18.0, quantity: 34, min_quantity: 8, category_id: 2 },
    { name: 'Webcam HD', description: '1080p HD webcam', sku: 'WC-005', price: 59.99, cost: 28.0, quantity: 8, min_quantity: 10, category_id: 1 },
  ];

  for (const p of products) {
    db.execute(
      `INSERT INTO products (name, description, sku, price, cost, quantity, min_quantity, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [p.name, p.description, p.sku, p.price, p.cost, p.quantity, p.min_quantity, p.category_id]
    );
  }
}
