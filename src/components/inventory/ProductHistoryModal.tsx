import { useState, useEffect } from "react";
import { X, History } from "lucide-react";
import * as db from "../../services/database";
import { ProductSalesHistory } from "../../types";

interface ProductHistoryModalProps {
  productId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ProductHistoryModal = ({ productId, isOpen, onClose }: ProductHistoryModalProps) => {
  const [history, setHistory] = useState<ProductSalesHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && productId) {
      loadHistory();
    }
  }, [isOpen, productId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await db.getProductSalesHistory(productId);
      setHistory(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Histórico de Vendas</h3>
              <p className="text-sm text-gray-500">{history?.product_name || "Carregando..."}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !history || history.sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p>Nenhuma venda registada para este produto.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-600 text-sm">Data</th>
                  <th className="px-6 py-3 font-semibold text-gray-600 text-sm">Qtd</th>
                  <th className="px-6 py-3 font-semibold text-gray-600 text-sm">Preço Unit.</th>
                  <th className="px-6 py-3 font-semibold text-gray-600 text-sm text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.sales.map((sale, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(sale.date).toLocaleDateString('pt-PT')} {new Date(sale.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium">
                      {sale.quantity}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(sale.unit_price)}
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">
                      {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(sale.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {history && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-sm">
            <span className="text-gray-500">Total Vendido: <span className="font-bold text-gray-900">{history.total_quantity} un</span></span>
            <span className="text-gray-500">Receita Total: <span className="font-bold text-blue-600 text-lg ml-1">{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(history.total_revenue)}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductHistoryModal;
