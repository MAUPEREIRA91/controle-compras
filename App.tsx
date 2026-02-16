import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, ClipboardList, PieChart, ChevronLeft, ChevronRight, Menu, X, PlusCircle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import QuotationMapComponent from './components/QuotationMap';
import Reports from './components/Reports';
import OrderModal from './components/OrderModal';
import { Order, QuotationMap as QuotationMapType } from './types';
import { INITIAL_ORDERS, INITIAL_QUOTATION } from './constants';

type Tab = 'dashboard' | 'orders' | 'quotations' | 'reports';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('supply_orders');
    try {
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [quotations, setQuotations] = useState<QuotationMapType[]>(() => {
    const saved = localStorage.getItem('supply_quotations_list');
    try {
      const parsed = saved ? JSON.parse(saved) : [INITIAL_QUOTATION];
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [INITIAL_QUOTATION];
    }
  });

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('supply_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('supply_quotations_list', JSON.stringify(quotations));
  }, [quotations]);

  const navigateToOrdersWithFilter = (filter: string) => {
    setGlobalFilter(filter);
    setActiveTab('orders');
    setShowArchived(false);
  };

  const handleSaveOrder = (order: Order) => {
    if (editingOrder) {
      setOrders(orders.map(o => o.id === order.id ? order : o));
    } else {
      setOrders([order, ...orders]);
    }
    setIsOrderModalOpen(false);
    setEditingOrder(null);
  };

  const handleDeleteOrder = (id: string) => {
    if (window.confirm('Excluir este registro permanentemente?')) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const handleArchiveOrder = (id: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, isArchived: !o.isArchived } : o));
  };

  return (
    <div className="h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
          aside, header, nav, button, .print-hidden, .bottom-nav { display: none !important; }
          #root, main, .custom-content-scroll { display: block !important; overflow: visible !important; position: static !important; }
        }
      `}</style>

      {/* Sidebar Desktop mais estreita */}
      <aside className={`hidden md:flex ${isSidebarOpen ? 'w-56' : 'w-16'} bg-slate-900 transition-all duration-300 flex-col z-50 print:hidden border-r border-slate-800`}>
        <div className="p-4 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-2">
            {isSidebarOpen && (
              <div className="text-amber-400 font-black text-base tracking-tighter leading-tight">
                JULY QUARTZO<br/>TRANSPORTES
              </div>
            )}
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-1.5 mt-4">
          <NavItem isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={18} />} label="Painel" isOpen={isSidebarOpen} />
          <NavItem isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<FileText size={18} />} label="Pedidos" isOpen={isSidebarOpen} />
          <NavItem isActive={activeTab === 'quotations'} onClick={() => setActiveTab('quotations')} icon={<ClipboardList size={18} />} label="Cotações" isOpen={isSidebarOpen} />
          <NavItem isActive={activeTab === 'reports'} onClick={() => setActiveTab('reports'} icon={<PieChart size={18} />} label="Relatórios" isOpen={isSidebarOpen} />
        </nav>

        <div className="p-3 mt-auto border-t border-slate-800">
           <div className={`flex items-center ${isSidebarOpen ? 'gap-2' : 'justify-center'}`}>
             <div className="w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center text-slate-900 font-black text-[10px]">MS</div>
             {isSidebarOpen && (
               <div className="overflow-hidden">
                 <p className="text-[9px] font-black text-white uppercase truncate">Mauricio S.</p>
                 <p className="text-[7px] text-slate-500 font-bold uppercase truncate">Suprimentos</p>
               </div>
             )}
           </div>
        </div>
      </aside>

      {/* Header Mobile mais baixo */}
      <header className="md:hidden h-14 bg-slate-900 flex items-center justify-between px-5 shrink-0 print:hidden border-b border-slate-800 z-[60]">
        <div className="text-amber-400 font-black text-xs tracking-tighter uppercase">
          July Quartzo Transportes
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Ativo</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header Desktop mais baixo */}
        <header className="hidden md:flex h-12 bg-white border-b border-slate-200 items-center justify-between px-6 shrink-0 print:hidden">
          <h1 className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">
            Sistema de Gestão de Suprimentos - Gestor
          </h1>
          <div className="flex items-center space-x-2 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg">
             <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sincronizado</span>
          </div>
        </header>

        {/* Content Area p-8 -> p-6 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-content-scroll bg-slate-50/50 safe-bottom">
          <div className="max-w-7xl mx-auto pb-16 md:pb-0">
            {activeTab === 'dashboard' && <Dashboard orders={orders.filter(o => !o.isArchived)} onNavigate={navigateToOrdersWithFilter} />}
            {activeTab === 'orders' && (
              <OrderList 
                orders={showArchived ? orders.filter(o => o.isArchived) : orders.filter(o => !o.isArchived)} 
                onAddOrder={() => {setEditingOrder(null); setIsOrderModalOpen(true);}} 
                onEditOrder={(o) => {setEditingOrder(o); setIsOrderModalOpen(true);}} 
                onDeleteOrder={handleDeleteOrder}
                onArchiveOrder={handleArchiveOrder}
                isViewingArchived={showArchived}
                initialSearch={globalFilter}
              />
            )}
            {activeTab === 'quotations' && (
              <QuotationMapComponent quotations={quotations} setQuotations={setQuotations} />
            )}
            {activeTab === 'reports' && <Reports orders={orders} onNavigate={navigateToOrdersWithFilter} />}
          </div>
        </div>

        {/* FAB Mobile mais compacto */}
        {activeTab === 'orders' && (
          <button 
            onClick={() => {setEditingOrder(null); setIsOrderModalOpen(true);}}
            className="md:hidden fixed bottom-20 right-5 w-12 h-12 bg-amber-400 text-slate-900 rounded-full shadow-2xl flex items-center justify-center z-[70] border-2 border-amber-600 active:scale-90 transition-transform"
          >
            <PlusCircle size={28} />
          </button>
        )}

        {/* Bottom Navigation Mobile mais baixo */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 flex items-center justify-around border-t border-slate-800 z-[60] px-1 pb-safe">
          <MobileNavItem isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Início" />
          <MobileNavItem isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<FileText size={20} />} label="Pedidos" />
          <MobileNavItem isActive={activeTab === 'quotations'} onClick={() => setActiveTab('quotations')} icon={<ClipboardList size={20} />} label="Cotações" />
          <MobileNavItem isActive={activeTab === 'reports'} onClick={() => setActiveTab('reports'} icon={<PieChart size={20} />} label="Relatórios" />
        </nav>
      </main>

      <OrderModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        onSave={handleSaveOrder} 
        editOrder={editingOrder}
      />
    </div>
  );
};

const NavItem: React.FC<{ isActive: boolean, onClick: () => void, icon: React.ReactNode, label: string, isOpen: boolean }> = ({ isActive, onClick, icon, label, isOpen }) => (
  <button onClick={onClick} className={`w-full flex items-center ${isOpen ? 'justify-start space-x-2.5 px-3' : 'justify-center px-0'} py-2.5 rounded-xl transition-all ${isActive ? 'bg-amber-400 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'}`}>
    <div className="shrink-0">{icon}</div>
    {isOpen && <span className="font-black text-[9px] uppercase tracking-widest truncate">{label}</span>}
  </button>
);

const MobileNavItem: React.FC<{ isActive: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ isActive, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>
    {icon}
    <span className="text-[7px] font-black uppercase mt-0.5">{label}</span>
  </button>
);

export default App;