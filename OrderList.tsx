
import React, { useState, useEffect, useMemo } from 'react';
import { Order, Priority, StatusPedido } from '../types';
import { Edit2, Plus, Search, Trash2, Download, Truck, Calendar, FileText, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderListProps {
  orders: Order[];
  onAddOrder: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onArchiveOrder: (id: string) => void;
  isViewingArchived?: boolean;
  initialSearch?: string;
}

const OrderList: React.FC<OrderListProps> = ({ 
    orders, 
    onAddOrder, 
    onEditOrder, 
    onDeleteOrder, 
    onArchiveOrder, 
    isViewingArchived,
    initialSearch = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      if (!searchTerm) return true;
      return (
        order.fornecedor.toLowerCase().includes(searchLower) ||
        order.solicitacaoNo.toLowerCase().includes(searchLower) ||
        order.pedidoNo?.toLowerCase().includes(searchLower) ||
        order.nfNo?.toLowerCase().includes(searchLower)
      );
    });
  }, [orders, searchTerm]);

  const generateGeneralPDF = async () => {
    const doc = new jsPDF('landscape');
    const tableData = filteredOrders.map(o => [
      o.solicitacaoNo,
      o.pedidoNo || '---',
      o.nfNo || 'PENDENTE',
      o.fornecedor,
      o.previsaoEntrega ? new Date(o.previsaoEntrega + 'T00:00:00').toLocaleDateString('pt-BR') : '---',
      `R$ ${o.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      o.status
    ]);

    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('JULY QUARTZO TRANSPORTES E SERVIÇOS LTDA', 14, 20);
    doc.text(`Relatório de Fluxo - Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['SC', 'PD', 'NF', 'Fornecedor', 'Prev. Entrega', 'Valor', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] as [number, number, number] }
    });

    doc.save(`JULY_QUARTZO_FLUXO_${new Date().getTime()}.pdf`);
  };

  const downloadIndividualPDF = async (order: Order) => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(250, 204, 21);
    doc.setFontSize(24);
    doc.text('PEDIDO DE COMPRA', 14, 25);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('JULY QUARTZO TRANSPORTES E SERVIÇOS LTDA', 14, 33);
    doc.text(`SC: ${order.solicitacaoNo} | PD: ${order.pedidoNo || '---'}`, 14, 38);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAÇÕES DO FORNECEDOR', 14, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fornecedor: ${order.fornecedor}`, 14, 70);
    doc.text(`Previsão de Entrega: ${order.previsaoEntrega ? new Date(order.previsaoEntrega + 'T00:00:00').toLocaleDateString('pt-BR') : 'NÃO INFORMADA'}`, 14, 77);
    doc.text(`Valor Total: R$ ${order.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, 84);
    doc.text(`Status Atual: ${order.status}`, 14, 91);
    doc.text(`Observações: ${order.observacoes || 'Nenhuma'}`, 14, 98);

    if (order.listaParcelas && order.listaParcelas.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('CRONOGRAMA DE PAGAMENTO', 14, 115);
      const installmentsTable = order.listaParcelas.map(p => [
        `${p.numero}a Parcela`,
        new Date(p.vencimento + 'T00:00:00').toLocaleDateString('pt-BR'),
        `R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        p.paga ? 'LIQUIDADA' : 'EM ABERTO'
      ]);
      autoTable(doc, {
        startY: 120,
        head: [['Parcela', 'Vencimento', 'Valor', 'Situação']],
        body: installmentsTable,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85] as [number, number, number] }
      });
    }
    doc.save(`JULY_QUARTZO_PEDIDO_${order.solicitacaoNo}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Title Header */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
            {isViewingArchived ? 'Histórico' : 'Fluxo de Pedidos'}
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase mt-1 tracking-widest">Controle de Carteira em Tempo Real</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 md:min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Buscar por Fornecedor ou Doc..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-100 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-2xl text-sm font-bold transition-all outline-none" 
            />
          </div>
          <button onClick={onAddOrder} className="hidden md:flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest shadow-lg">
            <Plus className="w-4 h-4" /> Lançar Pedido
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-900 text-white text-[9px] uppercase tracking-widest font-black">
              <th className="px-6 py-5">Documentos</th>
              <th className="px-6 py-5">Fornecedor</th>
              <th className="px-6 py-5">Entrega</th>
              <th className="px-6 py-5 text-right">Valor</th>
              <th className="px-6 py-5 text-center">Status</th>
              <th className="px-6 py-5 text-center print:hidden">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-0.5 text-[11px] font-black">
                    <span className="text-slate-400">SC: {order.solicitacaoNo}</span>
                    <span className="text-amber-600">PD: {order.pedidoNo || '---'}</span>
                    <span className={order.nfNo ? 'text-emerald-600' : 'text-slate-300 italic'}>
                      NF: {order.nfNo || 'Pendente'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 uppercase font-black text-slate-900 text-xs">
                  {order.fornecedor}
                </td>
                <td className="px-6 py-5">
                  {order.previsaoEntrega ? (
                    <span className="text-slate-600 font-bold text-xs">{new Date(order.previsaoEntrega + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  ) : '---'}
                </td>
                <td className="px-6 py-5 text-right font-black text-slate-900 text-xs">
                  R$ {order.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-5 text-center">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-6 py-5 text-center print:hidden">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => downloadIndividualPDF(order)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Download size={16} /></button>
                    <button onClick={() => onEditOrder(order)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteOrder(order.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-4">
        {filteredOrders.map(order => (
          <div key={order.id} onClick={() => onEditOrder(order)} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-2 h-full ${order.status === 'NF RECEBIDA' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doc. Ref</p>
                <div className="flex gap-2 mt-1">
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">SC {order.solicitacaoNo}</span>
                    {order.pedidoNo && <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">PD {order.pedidoNo}</span>}
                </div>
              </div>
              <StatusBadge status={order.status} />
            </div>
            
            <h3 className="text-base font-black text-slate-900 uppercase truncate">{order.fornecedor}</h3>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Total Provisionado</span>
                    <span className="text-lg font-black text-slate-900">R$ {order.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Previsão</span>
                    <div className="flex items-center gap-1 text-slate-600 font-bold text-xs mt-1">
                        <Calendar size={12} />
                        {order.previsaoEntrega ? new Date(order.previsaoEntrega + 'T00:00:00').toLocaleDateString('pt-BR') : '---'}
                    </div>
                </div>
            </div>
            
            <div className="mt-4 flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); downloadIndividualPDF(order); }}
                  className="flex-1 py-3 bg-slate-100 rounded-xl text-slate-600 font-black text-[10px] uppercase flex items-center justify-center gap-2"
                >
                    <Download size={14} /> PDF
                </button>
                <button 
                   onClick={(e) => { e.stopPropagation(); onDeleteOrder(order.id); }}
                   className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-xl"
                >
                    <Trash2 size={16} />
                </button>
            </div>
          </div>
        ))}
      </div>
      
      {filteredOrders.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-slate-300" />
          </div>
          <p className="text-slate-400 font-bold text-sm">Nenhum pedido localizado.</p>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: StatusPedido }> = ({ status }) => {
  const styles: Record<StatusPedido, string> = {
    'SOLICITADO': 'bg-slate-100 text-slate-500 border-slate-200',
    'EM COTAÇÃO': 'bg-amber-50 text-amber-600 border-amber-200',
    'PEDIDO EMITIDO': 'bg-blue-50 text-blue-600 border-blue-200',
    'NF RECEBIDA': 'bg-emerald-500 text-white border-emerald-600',
    'CANCELADO': 'bg-red-50 text-red-600 border-red-200',
  };
  return <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${styles[status]}`}>{status}</span>;
};

export default OrderList;
