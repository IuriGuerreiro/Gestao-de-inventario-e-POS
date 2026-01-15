import { useState, useEffect, useCallback } from 'react';
import { Product, Category } from '../types';
import * as db from '../services/database';

export const useInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [allProducts, allCategories] = await Promise.all([
        db.getAllProducts(),
        db.getAllCategories()
      ]);
      setProducts(allProducts);
      setCategories(allCategories);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados do inventário');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const search = async (query: string) => {
    setLoading(true);
    try {
      const results = query ? await db.searchProducts(query) : await db.getAllProducts();
      setProducts(results);
    } catch (err) {
      setError('Erro na busca');
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = async (categoryId: number | null) => {
    setLoading(true);
    try {
      // Pass string "null" if categoryId is null, otherwise the ID
      // But getProductsByCategory expects ID. 
      // If null is passed (meaning "All Categories"), we fetch all products.
      const results = categoryId 
        ? await db.getProductsByCategory(categoryId) 
        : await db.getAllProducts();
      setProducts(results);
    } catch (err) {
      setError('Erro ao filtrar categorias');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { 
    products, 
    categories, 
    loading, 
    error, 
    refreshData, 
    search, 
    filterByCategory 
  };
};