import { useState } from "react";
import { Search, Filter, Plus, Package, Edit2, History, FolderPlus, Trash2 } from "lucide-react";
import { useInventory } from "../../hooks/useInventory";
import * as db from "../../services/database";
import EditProductModal from "./EditProductModal";
import CreateProductModal from "./CreateProductModal";
import CreateCategoryModal from "./CreateCategoryModal";
import ProductHistoryModal from "./ProductHistoryModal";
import { Product } from "../../types";

const Inventory = () => {
  const { products, categories, loading, search, filterByCategory, refreshData } = useInventory();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(searchTerm);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    const id = val === "" ? null : parseInt(val);
    filterByCategory(id);
  };

  const handleDelete = async (product: Product) => {
    if (confirm(`Tem a certeza que deseja eliminar o produto "${product.name}"? Esta ação é irreversível.`)) {
      try {
        await db.deleteProduct(product.id);
        refreshData();
      } catch (error) {
        console.error("Erro ao eliminar produto:", error);
        alert("Não foi possível eliminar o produto. Verifique se existem vendas associadas.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventário</h2>
          <p className="text-gray-500">Gerir produtos e níveis de stock</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsCreateCategoryOpen(true)}
            className="bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition-colors font-medium"
          >
            <FolderPlus size={20} />
            <span>Nova Categoria</span>
          </button>
          <button 
            onClick={() => setIsCreateProductOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200"
          >
            <Plus size={20} />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por nome, SKU ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">Produto</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Categoria</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Preço</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Stock</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Estado</th>
              <th className="px-6 py-4 font-semibold text-gray-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  A carregar produtos...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-gray-400">{product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {product.category_name || product.category || "-"}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {new Intl.NumberFormat("pt-PT", {
                      style: "currency",
                      currency: "EUR",
                    }).format(product.price)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={product.quantity <= product.min_quantity ? "text-red-600 font-bold" : ""}>
                      {product.quantity} unidades
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.quantity <= product.min_quantity ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                        Stock Baixo
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                        Regular
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1">
                      <button
                        onClick={() => setHistoryProduct(product)}
                        className="text-gray-400 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                        title="Ver Histórico"
                      >
                        <History size={18} />
                      </button>
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateProductModal 
        isOpen={isCreateProductOpen}
        onClose={() => setIsCreateProductOpen(false)}
        onSave={refreshData}
      />

      <CreateCategoryModal 
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        onSave={refreshData}
      />

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={() => {
            refreshData();
            setEditingProduct(null);
          }}
        />
      )}

      {historyProduct && (
        <ProductHistoryModal
          productId={historyProduct.id}
          isOpen={!!historyProduct}
          onClose={() => setHistoryProduct(null)}
        />
      )}
    </div>
  );
};

export default Inventory;