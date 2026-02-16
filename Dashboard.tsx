
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Order } from '../types';
import { TrendingUp, AlertCircle, Clock, Package, DollarSign, ArrowRight } from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  onNavigate: (filter: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, onNavigate }) => {
  const totalValue = orders.reduce((acc, curr) => acc + curr.valor, 0);
  const urgentCount = orders.filter(o => o.prioridade === 'URGENTE').length;
  const pendingNF = orders.filter(o => o.status !== 'NF RECEBIDA').length;
  
  const chartData = [
    { name: 'Jan', valor: 0 },
    { name: 'Fev', valor: totalValue },
    { name: 'Mar', valor: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          icon={<DollarSign className="text-slate-900" />} 
          label="Provisionado" 
          value={`R$ ${totalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} 
          onClick={() => onNavigate('')}
        />
        <StatCard 
          icon={<AlertCircle className="text-red-600" />} 
          label="Críticos" 
          value={urgentCount.toString()} 
          onClick={() => onNavigate('URGENTE')}
        />
        <StatCard 
          icon={<Clock className="text-amber-600" />} 
          label="Pendentes" 
          value={pendingNF.toString()} 
          onClick={() => onNavigate('AGUARDANDO')}
        />
        <StatCard 
          icon={<Package className="text-slate-900" />} 
          label="Total Fluxo" 
          value={orders.length.toString()} 
          onClick={() => onNavigate('')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Provisão Financeira</h3>
            <div className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-900">FEVEREIRO 2026</div>
          </div>
          <div className="w-full h-[250px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 800, fontSize: '12px' }}
                />
                <Bar dataKey="valor" radius={[10, 10, 10, 10]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 1 ? '#0f172a' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Suppliers List Card */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-6">Maiores Fornecedores</h3>
          <div className="space-y-3">
             {Array.from(new Set(orders.map(o => o.fornecedor))).slice(0, 5).map(f => {
               const val = orders.filter(o => o.fornecedor === f).reduce((s, c) => s + c.valor, 0);
               return (
                <button 
                    key={f} 
                    onClick={() => onNavigate(f)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-900 transition-all text-left group"
                >
                  <div>
                    <span className="block font-black text-slate-900 text-xs tracking-tight">{f}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Ver Pedidos</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-900 font-black text-xs">R$ {val.toLocaleString('pt-BR')}</span>
                    <ArrowRight size={12} className="ml-auto text-slate-300 group-hover:text-slate-900 transition-all" />
                  </div>
                </button>
               );
             })}
             {orders.length === 0 && <p className="text-slate-300 text-[10px] font-black uppercase text-center py-10">Dados indisponíveis</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, onClick?: () => void }> = ({ icon, label, value, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-3 md:gap-5 group active:scale-[0.97] transition-all text-left relative overflow-hidden"
  >
    <div className="p-3 bg-slate-50 rounded-xl w-fit group-hover:bg-slate-900 group-hover:text-white transition-colors">
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5 md:w-6 md:h-6' }) : icon}
    </div>
    <div>
      <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <p className="text-sm md:text-xl font-black text-slate-900 tracking-tighter truncate pr-2">{value}</p>
        <ArrowRight size={14} className="text-slate-200 group-hover:text-slate-900 transition-all shrink-0" />
      </div>
    </div>
  </button>
);

export default Dashboard;
