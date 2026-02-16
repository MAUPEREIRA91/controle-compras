
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Order, Priority, StatusPedido, Installment } from '../types';
import { X, Calendar as CalendarIcon, Calculator, CheckCircle2, Truck, ChevronUp, ChevronDown } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
  editOrder?: Order | null;
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onSave, editOrder }) => {
  const [formData, setFormData] = useState<Partial<Order>>({
    solicitacaoNo: '',
    pedidoNo: '',
    nfNo: '',
    dataSolicitacao: new Date().toISOString().split('T')[0],
    vencimentoNF: new Date().toISOString().split('T')[0],
    previsaoEntrega: '',
    fornecedor: '',
    valor: 0,
    parcelas: 1,
    prioridade: 'NORMAL',
    status: 'SOLICITADO',
    responsavel: 'MAURICIO',
    observacoes: ''
  });

  const [localInstallments, setLocalInstallments] = useState<Installment[]>([]);

  useEffect(() => {
    if (!editOrder && isOpen) {
       const list: Installment[] = [];
       const total = formData.valor || 0;
       const count = formData.parcelas || 1;
       const baseDate = new Date(formData.vencimentoNF + 'T00:00:00');
       const valIndividual = Number((total / count).toFixed(2));
       let remaining = total;

       for (let i = 0; i < count; i++) {
         const d = new Date(baseDate);
         d.setMonth(d.getMonth() + i);
         const isLast = i === count - 1;
         const amount = isLast ? remaining : valIndividual;
         
         list.push({
           numero: i + 1,
           vencimento: d.toISOString().split('T')[0],
           valor: Number(amount.toFixed(2)),
           paga: false
         });
         remaining -= amount;
       }
       setLocalInstallments(list);
    }
  }, [formData.vencimentoNF, formData.parcelas, formData.valor, isOpen, editOrder]);

  useEffect(() => {
    if (editOrder) {
      setFormData(editOrder);
      setLocalInstallments(editOrder.listaParcelas || []);
    } else {
      setFormData({
        solicitacaoNo: '',
        pedidoNo: '',
        nfNo: '',
        dataSolicitacao: new Date().toISOString().split('T')[0],
        vencimentoNF: new Date().toISOString().split('T')[0],
        previsaoEntrega: '',
        fornecedor: '',
        valor: 0,
        parcelas: 1,
        prioridade: 'NORMAL',
        status: 'SOLICITADO',
        responsavel: 'MAURICIO',
        observacoes: ''
      });
    }
  }, [editOrder, isOpen]);

  const updateInstallment = (index: number, field: keyof Installment, value: any) => {
    const newList = [...localInstallments];
    newList[index] = { ...newList[index], [field]: value };
    setLocalInstallments(newList);
    if (field === 'valor') {
      const newTotal = newList.reduce((acc, curr) => acc + Number(curr.valor), 0);
      setFormData(prev => ({ ...prev, valor: Number(newTotal.toFixed(2)) }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border-2 border-slate-400 flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b-2 border-slate-400 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Gestão de Pedido</h3>
            <p className="text-[10px] text-slate-500 font-black mt-1 uppercase tracking-widest">July Quartzo Transportes e Serviços LTDA</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-500 border-2 border-transparent hover:border-slate-400">
            <X size={24} />
          </button>
        </div>
        
        <form className="p-8 overflow-y-auto custom-scrollbar" onSubmit={(e) => {
          e.preventDefault();
          onSave({ 
            ...formData, 
            id: editOrder?.id || Date.now().toString(),
            listaParcelas: localInstallments,
            statusAtraso: 'NO PRAZO' 
          } as Order);
        }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-6">
              <div className="p-1 bg-slate-50 rounded-2xl border-2 border-slate-400 focus-within:border-slate-900 transition-colors shadow-sm">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-4 mt-2">Fornecedor Principal</label>
                <input 
                  required
                  type="text" 
                  value={formData.fornecedor}
                  onChange={e => setFormData({...formData, fornecedor: e.target.value.toUpperCase()})}
                  className="w-full px-4 pb-3 bg-transparent outline-none text-slate-900 font-black text-2xl placeholder:text-slate-200"
                  placeholder="EX: RODOBENS"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-white border-2 border-slate-400 rounded-2xl shadow-sm focus-within:border-slate-900">
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Solicitação (SL)</label>
                  <input required type="text" value={formData.solicitacaoNo} onChange={e => setFormData({...formData, solicitacaoNo: e.target.value})} className="w-full bg-transparent outline-none text-slate-900 font-black text-sm" placeholder="000" />
                </div>
                <div className="p-3 bg-white border-2 border-slate-400 rounded-2xl shadow-sm focus-within:border-slate-900">
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Pedido (PD)</label>
                  <input type="text" value={formData.pedidoNo} onChange={e => setFormData({...formData, pedidoNo: e.target.value})} className="w-full bg-transparent outline-none text-slate-900 font-black text-sm" placeholder="000" />
                </div>
                <div className="p-3 bg-white border-2 border-slate-400 rounded-2xl shadow-sm focus-within:border-slate-900">
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Nota Fiscal (NF)</label>
                  <input type="text" value={formData.nfNo} onChange={e => setFormData({...formData, nfNo: e.target.value})} className="w-full bg-transparent outline-none text-slate-900 font-black text-sm" placeholder="000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900 rounded-2xl shadow-lg border-2 border-slate-950">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total</label>
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 text-xs font-black">R$</span>
                    <input required type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: parseFloat(e.target.value) || 0})} className="w-full bg-transparent outline-none text-white font-black text-xl" />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Previsão de Entrega</label>
                  <div className="p-4 bg-[#1e293b] border-2 border-slate-400 rounded-2xl shadow-sm hover:border-blue-400 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <input 
                        type="date"
                        value={formData.previsaoEntrega}
                        onChange={(e) => setFormData({...formData, previsaoEntrega: e.target.value})}
                        className="bg-transparent text-white font-black text-sm outline-none w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-2">Status do Processo</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['SOLICITADO', 'EM COTAÇÃO', 'PEDIDO EMITIDO', 'NF RECEBIDA'] as StatusPedido[]).map((s) => (
                    <button key={s} type="button" onClick={() => setFormData({...formData, status: s})} className={`px-3 py-3 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${formData.status === s ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-400 hover:border-slate-900'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest mb-2">Observações e Detalhes</label>
                <textarea value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-400 rounded-2xl focus:border-slate-900 outline-none text-slate-900 font-bold h-24 resize-none placeholder:text-slate-300 transition-all" placeholder="Informações adicionais..." />
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-100 rounded-[2.5rem] p-6 border-2 border-slate-400 flex flex-col h-full overflow-visible max-h-[600px] shadow-inner">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Calculator size={14} className="text-slate-500" /> Fluxo de Pagamento
                </h4>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 overflow-x-visible">
                {localInstallments.map((inst, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border-2 border-slate-400 shadow-sm flex flex-col gap-3 group hover:border-slate-900 transition-all overflow-visible">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{inst.numero}ª Parcela</span>
                      <button type="button" onClick={() => updateInstallment(idx, 'paga', !inst.paga)} className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase transition-all border-2 ${inst.paga ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-50 text-slate-500 border-slate-300 hover:border-slate-900'}`}>
                        {inst.paga ? 'LIQUIDADA' : 'EM ABERTO'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 overflow-visible">
                      <div className="relative">
                         <input 
                            type="date"
                            value={inst.vencimento} 
                            onChange={(e) => updateInstallment(idx, 'vencimento', e.target.value)}
                            className="w-full p-2 bg-[#1e293b] rounded-xl border-2 border-slate-200 text-[10px] font-bold text-white outline-none"
                         />
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border-2 border-slate-200 group-hover:border-slate-400 transition-all">
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Valor (R$)</label>
                        <input type="number" step="0.01" value={inst.valor} onChange={e => updateInstallment(idx, 'valor', parseFloat(e.target.value) || 0)} className="w-full bg-transparent border-none rounded-lg text-[10px] font-black text-slate-900 outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-8 border-t-2 border-slate-200 shrink-0">
            <button type="button" onClick={onClose} className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors">Cancelar</button>
            <button type="submit" className="px-14 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-3 border-2 border-slate-950">
              <CheckCircle2 size={18} /> Confirmar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;
