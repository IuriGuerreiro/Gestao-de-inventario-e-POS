import { useState, useEffect } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle, Package } from "lucide-react";
import * as db from "../../services/database";
import { Product, Category } from "../../types";
import PaymentModal from "./PaymentModal";

interface CartItem extends Product {
  cartQuantity: number;
}

const POS = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Load categories on mount
  useEffect(() => {
    db.getAllCategories().then(setCategories).catch(console.error);
  }, []);

  // Handle Search and Category Filtering
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        if (searchTerm) {
          // Search overrides category
          const results = await db.searchProducts(searchTerm);
          setProducts(results);
          setSelectedCategory(null); // Deselect category when searching
        } else if (selectedCategory) {
          // Fetch by category
          const results = await db.getProductsByCategory(selectedCategory);
          setProducts(results);
        } else {
          // Default: show all products for "Tudo"
          const results = await db.getAllProducts();
          setProducts(results);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setSearchTerm(""); // Clear search when selecting category
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            return { ...item, cartQuantity: item.cartQuantity + delta };
          }
          return item;
        })
        .filter((item) => item.cartQuantity > 0);
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);

  const handleCheckoutClick = () => {
    if (cart.length > 0) {
      setIsPaymentModalOpen(true);
    }
  };

  const handleFinalizeSale = async (paymentMethod: string) => {
    setIsPaymentModalOpen(false);
    try {
      await db.createSale({
        items: cart.map((item) => ({ product_id: item.id, quantity: item.cartQuantity })),
        payment_method: paymentMethod,
      });
      setCart([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert("Erro ao finalizar venda: " + (error as Error).message);
    }
  };

  return (
    <div className="flex gap-6 h-full overflow-hidden">
      {/* Left Side: Catalog */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Ponto de Venda</h2>
          <p className="text-gray-500">Selecione categoria ou pesquise</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide shrink-0">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              !selectedCategory && !searchTerm
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Tudo
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid / Results */}
        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.quantity <= 0}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left flex flex-col justify-between h-32 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div>
                    <div className="font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{product.sku}</div>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div className="font-bold text-lg text-blue-600">
                      {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(product.price)}
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded ${product.quantity > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {product.quantity} un
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-300 border-2 border-dashed border-gray-200 rounded-xl">
              <Package size={48} strokeWidth={1} />
              <p className="mt-4 text-lg">
                {searchTerm || selectedCategory ? "Nenhum produto encontrado" : "Selecione uma categoria"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Cart Summary */}
      <div className="w-96 bg-white border border-gray-200 rounded-2xl flex flex-col shadow-sm shrink-0 h-full">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold">Resumo da Venda</h3>
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">
            {cart.reduce((s, i) => s + i.cartQuantity, 0)} itens
          </span>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center text-green-500 animate-in fade-in zoom-in duration-300">
            <CheckCircle size={80} strokeWidth={1} className="mb-4" />
            <p className="text-xl font-bold">Venda Finalizada!</p>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <ShoppingCart size={64} strokeWidth={1} />
            <p className="mt-4">O carrinho está vazio</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex flex-col space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between font-medium">
                  <span className="truncate pr-4 text-sm">{item.name}</span>
                  <span className="text-sm">{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(item.price * item.cartQuantity)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.cartQuantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => updateQuantity(item.id, -item.cartQuantity)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-6 border-t border-gray-100 space-y-4 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(total)}</span>
          </div>
          <div className="flex justify-between text-2xl font-black text-gray-900">
            <span>TOTAL</span>
            <span>{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(total)}</span>
          </div>
          <button
            onClick={handleCheckoutClick}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            FINALIZAR VENDA
          </button>
        </div>
      </div>

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        total={total}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handleFinalizeSale}
      />
    </div>
  );
};

export default POS;
