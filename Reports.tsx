
import React from 'react';
import { Order } from '../types';
import { FileText, Printer, BarChart3, Package, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReportsProps {
  orders: Order[];
  onNavigate?: (filter: string) => void;
}

const Reports: React.FC<ReportsProps> = ({ orders, onNavigate }) => {
  const activeOrders = orders.filter(o => !o.isArchived);
  
  const scCount = activeOrders.filter(o => o.solicitacaoNo && o.solicitacaoNo !== '---' && o.solicitacaoNo !== '000').length;
  const pdCount = activeOrders.filter(o => o.pedidoNo && o.pedidoNo !== '---' && o.pedidoNo !== '000').length;
  const nfCount = activeOrders.filter(o => o.status === 'NF RECEBIDA').length;
  const pendingNf = activeOrders.filter(o => o.status !== 'NF RECEBIDA').length;

  const totalAmount = activeOrders.reduce((acc, curr) => acc + curr.valor, 0);

  const statusData = [
    { name: 'NF Recebida', value: nfCount, color: '#10b981' },
    { name: 'Pendente', value: pendingNf, color: '#f59e0b' },
    { name: 'Cancelado', value: activeOrders.filter(o => o.status === 'CANCELADO').length, color: '#ef4444' }
  ];

  const handlePrint = () => {
    window.print();
  };

  const safeNavigate = (filter: string) => {
    if (onNavigate) onNavigate(filter);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Relatórios Executivos</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">Análise de Fluxo Documental e Financeiro</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95"
        >
          <Printer size={16} />
          Imprimir / Gerar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportMetricCard 
          icon={<FileText className="text-slate-400" />} 
          label="Volume de Solicitações (SC)" 
          value={scCount.toString()} 
          sub="Total de SCs ativas"
          onClick={() => safeNavigate('FILTRO_SC')}
        />
        <ReportMetricCard 
          icon={<Package className="text-blue-500" />} 
          label="Pedidos Emitidos (PD)" 
          value={pdCount.toString()} 
          sub="Processos formalizados"
          onClick={() => safeNavigate('FILTRO_PD')}
        />
        <ReportMetricCard 
          icon={<CheckCircle2 className="text-emerald-500" />} 
          label="Notas Liquidadas (NF)" 
          value={nfCount.toString()} 
          sub="Recebimento concluído"
          onClick={() => safeNavigate('NF RECEBIDA')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:hidden">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-10 flex items-center gap-2">
            <BarChart3 size={14} /> Distribuição por Status
          </h3>
          <div className="w-full h-[300px] min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mt-6">
            {statusData.map(d => (
              <button 
                key={d.name} 
                onClick={() => safeNavigate(d.name.toUpperCase())}
                className="flex items-center gap-2 hover:bg-slate-50 p-2 rounded-lg transition-colors"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{d.name} ({d.value})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <DollarSign size={48} className="mx-auto text-slate-900 mb-6 opacity-20 relative z-10" />
            <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 relative z-10">Provisão em Fluxo Ativo</h3>
            <p className="text-5xl font-black text-slate-900 tracking-tighter relative z-10">
                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-10 grid grid-cols-2 gap-4 relative z-10">
                <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Média por Pedido</p>
                    <p className="font-black text-slate-900">R$ {(totalAmount / (activeOrders.length || 1)).toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Pedidos</p>
                    <p className="font-black text-slate-900">{activeOrders.length}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const ReportMetricCard: React.FC<{ icon: React.ReactNode, label: string, value: string, sub: string, onClick?: () => void }> = ({ icon, label, value, sub, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-slate-900 hover:shadow-2xl transition-all relative overflow-hidden active:scale-95"
  >
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-900" />
    </div>
    <div className="p-4 bg-slate-50 rounded-2xl mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-500">
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24 }) : icon}
    </div>
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-900 transition-colors">{label}</h4>
    <p className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{value}</p>
    <p className="text-[10px] text-slate-400 font-bold italic group-hover:text-slate-500">{sub}</p>
  </button>
);

export default Reports;
