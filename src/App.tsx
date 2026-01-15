import { useEffect, useState } from "react";
import { initDatabase } from "./services/database";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./components/dashboard/Dashboard";
import Inventory from "./components/inventory/Inventory";
import POS from "./components/pos/POS";
import Analytics from "./components/analytics/Analytics";
import "./App.css";

function App() {
  const [initialized, setInitialized] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "inventory" | "pos" | "analytics">("dashboard");

  useEffect(() => {
    initDatabase()
      .then(() => setInitialized(true))
      .catch((err) => console.error("Erro ao inicializar banco de dados:", err));
  }, []);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl font-semibold animate-pulse">A carregar sistema...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 overflow-auto p-8 min-w-0">
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "analytics" && <Analytics />}
        {currentView === "inventory" && <Inventory />}
        {currentView === "pos" && <POS />}
      </main>
    </div>
  );
}

export default App;
