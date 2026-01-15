import { LayoutDashboard, Package, ShoppingCart, LogOut, BarChart3 } from "lucide-react";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: "dashboard" | "inventory" | "pos" | "analytics") => void;
}

const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Painel", icon: LayoutDashboard },
    { id: "analytics", label: "Análises", icon: BarChart3 },
    { id: "inventory", label: "Inventário", icon: Package },
    { id: "pos", label: "Caixa (POS)", icon: ShoppingCart },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-blue-600">GestãoPro</h1>
        <p className="text-xs text-gray-400 mt-1">Gestão de Vendas e Stocks</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as any)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === item.id
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
