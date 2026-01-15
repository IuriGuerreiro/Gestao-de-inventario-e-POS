import { useState, useEffect } from "react";
import { Calendar, TrendingUp, CreditCard, DollarSign, Award } from "lucide-react";
import * as db from "../../services/database";
import { TopSellingProduct, PaymentMethodBreakdown, ProfitReport } from "../../types";

const Analytics = () => {
  const [dateRange, setDateRange] = useState("30"); // 7, 30, 90, 365
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodBreakdown[]>([]);
  const [profitReport, setProfitReport] = useState<ProfitReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      const startStr = startDate.toISOString();

      const [top, payments, profit] = await Promise.all([
        db.getTopSellingProducts(5, startStr, endDate),
        db.getSalesByPaymentMethod(startStr, endDate),
        db.getProfitReport(startStr, endDate),
      ]);

      setTopProducts(top);
      setPaymentMethods(payments);
      setProfitReport(profit);
    } catch (error) {
      console.error("Erro ao carregar análises:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios e Análises</h2>
          <p className="text-gray-500">Performance do negócio e insights financeiros</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-1">
          <Calendar size={18} className="text-gray-400 ml-2" />
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="p-2 bg-transparent text-sm font-medium focus:outline-none"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 3 meses</option>
            <option value="365">Último ano</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <DollarSign size={24} />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Receita Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(profitReport?.total_revenue || 0)}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Lucro Bruto</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(profitReport?.gross_profit || 0)}
              </div>
              <div className="mt-2 text-sm text-green-600 font-medium">
                Margem: {profitReport?.profit_margin.toFixed(1)}%
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                  <CreditCard size={24} />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Ticket Médio</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {/* Simplified avg calculation */}
                {profitReport?.total_revenue && topProducts.length // fallback approximation or real if added
                  ? formatCurrency(profitReport.total_revenue / (paymentMethods.reduce((a,b) => a + b.count, 0) || 1)) 
                  : formatCurrency(0)}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {paymentMethods.reduce((a, b) => a + b.count, 0)} vendas totais
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Award className="text-yellow-500" size={20} />
                Produtos Mais Vendidos
              </h3>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.product_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-medium text-gray-800">{product.product_name}</div>
                        <div className="text-xs text-gray-400">{product.total_quantity} unidades vendidas</div>
                      </div>
                    </div>
                    <div className="font-bold text-gray-700">
                      {formatCurrency(product.total_revenue)}
                    </div>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <p className="text-gray-400 text-center py-4">Sem dados de vendas neste período.</p>
                )}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Métodos de Pagamento</h3>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.payment_method} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{method.payment_method || "Não especificado"}</span>
                      <span className="text-gray-500">
                        {method.count} vendas ({formatCurrency(method.total)})
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(method.total / (profitReport?.total_revenue || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                 {paymentMethods.length === 0 && (
                  <p className="text-gray-400 text-center py-4">Sem dados de pagamentos.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
