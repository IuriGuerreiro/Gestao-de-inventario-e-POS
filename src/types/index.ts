export interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  cost: number;
  quantity: number;
  min_quantity: number;
  category_id: number | null;
  category_name?: string; // Joined field
  created_at: string;
  updated_at: string;
  // Legacy support during migration (optional)
  category?: string; 
}

export interface Sale {
  id: number;
  total_amount: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SaleWithItems extends Sale {
  items: (SaleItem & { product_name: string })[];
}

export interface SalesReport {
  total_sales: number;
  total_revenue: number;
  items_sold: number;
  sales_by_day: { date: string; total: number; count: number }[];
}

export type CreateCategory = Omit<Category, 'id' | 'created_at'>;
export type UpdateCategory = Partial<CreateCategory>;

export type CreateProduct = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category_name'>;
export type UpdateProduct = Partial<CreateProduct>;

export interface CreateSale {
  items: { product_id: number; quantity: number }[];
  payment_method?: string;
  notes?: string;
}

// Analytics types
export interface TopSellingProduct {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface PaymentMethodBreakdown {
  payment_method: string;
  count: number;
  total: number;
}

export interface ProfitReport {
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  profit_margin: number;
  by_product: {
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: number;
    cost: number;
    profit: number;
  }[];
}

export interface ProductSalesHistory {
  product_id: number;
  product_name: string;
  sales: {
    sale_id: number;
    date: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
  total_quantity: number;
  total_revenue: number;
}