import { useState, useEffect } from "react";
import { TrendingUp, ShoppingBag, DollarSign, AlertCircle, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as db from "../../services/database";
import { SalesReport } from "../../types";

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    inventoryValue: 0,
    lowStockCount: 0,
  });
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [dateRange, setDateRange] = useState("7"); // 7, 30, 90

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    try {
      // 1. Load instant stats
      const [today, inventory, lowStock] = await Promise.all([
        db.getTodaysSales(),
        db.getInventoryValue(),
        db.getLowStockProducts(),
      ]);

      setStats({
        todaySales: today.count,
        todayRevenue: today.total,
        inventoryValue: inventory.totalRetail,
        lowStockCount: lowStock.length,
      });

      // 2. Load chart data based on range
      const endDate = new Date().toISOString();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      const startStr = startDate.toISOString();

      const report = await db.getSalesReport(startStr, endDate);
      setSalesReport(report);

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    }
  };

  const cards = [
    {
      label: "Vendas Hoje",
      value: stats.todaySales,
      icon: ShoppingBag,
      color: "bg-blue-500",
    },
    {
      label: "Receita Hoje",
      value: new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(stats.todayRevenue),
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      label: "Valor do Stock",
      value: new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(stats.inventoryValue),
      icon: DollarSign,
      color: "bg-purple-500",
    },
    {
      label: "Stock Baixo",
      value: `${stats.lowStockCount} itens`,
      icon: AlertCircle,
      color: "bg-orange-500",
    },
  ];

  // Format chart data
  const chartData = salesReport?.sales_by_day.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
    total: item.total
  })) || [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Painel de Controle</h2>
        <p className="text-gray-500">Visão geral do seu negócio hoje</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className={`${card.color} p-3 rounded-xl text-white shadow-lg shadow-opacity-20`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Evolução de Vendas</h3>
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
              <Calendar size={16} className="text-gray-400 ml-2" />
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-sm font-medium focus:outline-none text-gray-600 p-1"
              >
                <option value="7">7 dias</option>
                <option value="30">30 dias</option>
                <option value="90">3 meses</option>
              </select>
            </div>
          </div>
          
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number | undefined) => [new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0), "Vendas"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 flex-col">
                <AlertCircle size={32} className="mb-2 opacity-50" />
                <p>Sem dados de vendas para este período</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Mini Stats */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
           <div>
             <h3 className="text-lg font-bold text-gray-800 mb-4">Resumo do Período</h3>
             <div className="space-y-4">
               <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                 <span className="text-gray-500 text-sm">Total Faturado</span>
                 <span className="font-bold text-gray-900">
                   {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(salesReport?.total_revenue || 0)}
                 </span>
               </div>
               <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                 <span className="text-gray-500 text-sm">Itens Vendidos</span>
                 <span className="font-bold text-gray-900">{salesReport?.items_sold || 0}</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                 <span className="text-gray-500 text-sm">Nº Transações</span>
                 <span className="font-bold text-gray-900">{salesReport?.total_sales || 0}</span>
               </div>
             </div>
           </div>
           
           <div className="mt-6 pt-6 border-t border-gray-100">
             <p className="text-xs text-gray-400 text-center">Dados atualizados em tempo real.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;