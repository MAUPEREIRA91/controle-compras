import React, { useState, useMemo } from 'react';
import { QuotationMap as QuotationMapType, QuotationItem, StatusCotacao } from '../types';
import { Download, PlusCircle, Trash2, ChevronLeft, Calendar, UserPlus, X, BrainCircuit, ChevronRight, CheckCircle2, Layout } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { analyzeQuotation } from '../services/geminiService';

interface Props {
  quotations: QuotationMapType[];
  setQuotations: React.Dispatch<React.SetStateAction<QuotationMapType[]>>;
}

const QuotationMap: React.FC<Props> = ({ quotations, setQuotations }) => {
  const [activeQuotationId, setActiveQuotationId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeQuotation = useMemo(() => 
    quotations.find(q => q.id === activeQuotationId), 
  [quotations, activeQuotationId]);

  const supplierPalette = [
    { bg: 'bg-[#ECF5E8]', text: 'text-slate-900', border: 'border-slate-300', topBar: 'bg-emerald-400', pdf: [236, 245, 232] as [number, number, number] }, 
    { bg: 'bg-[#E3F2FD]', text: 'text-slate-900', border: 'border-slate-300', topBar: 'bg-blue-400', pdf: [227, 242, 253] as [number, number, number] }, 
    { bg: 'bg-[#FFF3E0]', text: 'text-slate-900', border: 'border-slate-300', topBar: 'bg-orange-400', pdf: [255, 243, 224] as [number, number, number] }, 
    { bg: 'bg-[#F3E5F5]', text: 'text-slate-900', border: 'border-slate-300', topBar: 'bg-purple-400', pdf: [243, 229, 245] as [number, number, number] }, 
  ];

  const formatDateSafe = (dateStr: string | undefined) => {
    if (!dateStr || dateStr === 'A COMBINAR' || dateStr === 'A DEFINIR' || dateStr === '') return 'A COMBINAR';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const recalculateItem = (item: QuotationItem): QuotationItem => {
    const updatedFornecedores = item.fornecedores.map(f => {
      const unitVal = Number(f.valorUnit) || 0;
      const difalVal = Number(f.difal) || 0;
      if (unitVal <= 0) return { ...f, valorUnit: unitVal, difal: difalVal, total: 0 };
      const subtotal = item.quantidade * unitVal;
      const totalComDifal = subtotal + (subtotal * (difalVal / 100));
      return { 
        ...f, 
        valorUnit: unitVal,
        difal: difalVal,
        total: Math.round((totalComDifal + Number.EPSILON) * 100) / 100 
      };
    });
    const validTotals = updatedFornecedores.filter(f => f.total > 0).map(f => f.total);
    const minVal = validTotals.length > 0 ? Math.min(...validTotals) : 0;
    const winners = updatedFornecedores
      .filter(f => f.total > 0 && f.total === minVal)
      .map(f => f.nome);
    return {
      ...item,
      fornecedores: updatedFornecedores,
      menorValor: minVal,
      vencedor: winners.join(' / ')
    };
  };

  const createNewQuotation = () => {
    const newId = `MAP-${Math.floor(100000 + Math.random() * 900000)}`;
    const newMap: QuotationMapType = {
      id: newId,
      titulo: 'NOVA COTAÇÃO DE MATERIAIS',
      data: new Date().toISOString().split('T')[0],
      solicitante: 'MAURICIO',
      departamento: 'SUPRIMENTOS',
      status: 'PENDENTE',
      tagEquipamento: '',
      prazoEntrega: '',
      itens: [
        recalculateItem({
          id: Math.random().toString(36).substr(2, 9),
          codigo: '001',
          partNumber: '',
          descricao: '',
          unidade: 'UN',
          quantidade: 1,
          fornecedores: [
            { id: Math.random().toString(36).substr(2, 9), nome: 'FORNECEDOR 1', marca: '', valorUnit: 0, total: 0, difal: 0 },
            { id: Math.random().toString(36).substr(2, 9), nome: 'FORNECEDOR 2', marca: '', valorUnit: 0, total: 0, difal: 0 },
            { id: Math.random().toString(36).substr(2, 9), nome: 'FORNECEDOR 3', marca: '', valorUnit: 0, total: 0, difal: 0 }
          ],
          menorValor: 0,
          vencedor: ''
        })
      ]
    };
    setQuotations(prev => [newMap, ...prev]);
    setActiveQuotationId(newId);
  };

  const updateActiveMap = (updated: QuotationMapType) => {
    setQuotations(prev => prev.map(q => q.id === updated.id ? updated : q));
  };

  const handleAIAnalysis = async () => {
    if (!activeQuotation) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeQuotation(activeQuotation);
      alert(`Análise Estratégica da IA:\n\n${result}`);
    } catch (error) {
      alert("Não foi possível processar a análise no momento.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadPDF = async () => {
    if (!activeQuotation) return;
    const doc = new jsPDF('landscape');
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 297, 45, 'F');
    doc.setTextColor(250, 204, 21);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('JULY QUARTZO TRANSPORTES E SERVIÇOS LTDA', 14, 18);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`REFERÊNCIA: ${activeQuotation.id} | STATUS: ${activeQuotation.status}`, 14, 26);
    doc.text(activeQuotation.titulo, 14, 34);
    doc.setFontSize(8);
    doc.text(`TAG: ${activeQuotation.tagEquipamento || '---'} | DATA EMISSÃO: ${formatDateSafe(activeQuotation.data)} | PRAZO ENTREGA: ${formatDateSafe(activeQuotation.prazoEntrega)}`, 14, 40);
    const headerRow = ['#', 'Descrição / PN', 'Qtd', ...activeQuotation.itens[0].fornecedores.flatMap(f => [f.nome, 'Total']), 'Vencedor'];
    const body = activeQuotation.itens.map((it, idx) => {
      const rowData = [idx + 1, `${it.descricao}\nPN: ${it.partNumber || '---'}`, it.quantidade];
      it.fornecedores.forEach(f => {
        rowData.push(`Marca: ${f.marca || '---'}\nUnit: R$ ${f.valorUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nDIFAL: ${f.difal || 0}%`, f.valorUnit > 0 ? `R$ ${f.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-');
      });
      rowData.push(it.vencedor ? `${it.vencedor}` : '---');
      return rowData;
    });
    const grandTotal = activeQuotation.itens.reduce((acc, it) => acc + (it.menorValor || 0), 0);
    autoTable(doc, {
      startY: 50, head: [headerRow], body: body, theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2, font: 'helvetica', lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      foot: [[{ content: `VALOR TOTAL (MELHORES PREÇOS): R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, colSpan: headerRow.length, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } }]],
      margin: { top: 45 }
    });
    doc.save(`JULY_QUARTZO_MAPA_${activeQuotation.id}.pdf`);
  };

  const getStatusStyle = (status: StatusCotacao) => {
    switch (status) {
      case 'APROVADO': return 'bg-emerald-600 text-white border-emerald-700 shadow-md';
      case 'REPROVADO': return 'bg-red-600 text-white border-red-700 shadow-md';
      case 'AGUARDANDO AP.': return 'bg-amber-400 text-slate-900 border-amber-500 shadow-md';
      case 'PENDENTE': return 'bg-slate-100 text-slate-400 border-slate-300';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const grandTotal = activeQuotation?.itens.reduce((acc, it) => acc + (it.menorValor || 0), 0) || 0;

  if (activeQuotationId && activeQuotation) {
    return (
      <div className="space-y-3 pb-16 animate-in fade-in duration-500 px-1">
        <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md py-2 z-50 border-b border-slate-200 px-5 rounded-xl shadow-sm">
          <button onClick={() => setActiveQuotationId(null)} className="flex items-center gap-1.5 text-slate-500 font-bold text-[8px] uppercase tracking-widest hover:text-slate-900 transition-all">
            <ChevronLeft size={10} /> PAINEL
          </button>
          <div className="flex gap-2">
             <button onClick={downloadPDF} className="bg-white border border-slate-900 text-slate-900 px-3 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1.5 hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Download size={12} /> PDF</button>
             <button onClick={handleAIAnalysis} disabled={isAnalyzing} className="bg-[#0f172a] text-[#facc15] px-3 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1.5 hover:scale-105 transition-all shadow-lg active:scale-95">
               <BrainCircuit size={12} /> {isAnalyzing ? '...' : 'IA SUPRIMENTOS'}
             </button>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-[1.5rem] border border-slate-700 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-4">
           <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center gap-2">
                <Layout size={10} className="text-amber-400" />
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">MAPA DE COTAÇÃO</span>
              </div>
              <input 
                type="text" 
                value={activeQuotation.titulo} 
                onChange={(e) => updateActiveMap({...activeQuotation, titulo: e.target.value.toUpperCase()})}
                className="text-lg font-black text-white w-full outline-none border-b border-slate-700 focus:border-amber-400 bg-transparent p-1 transition-all"
                placeholder="NOME"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">ID</span>
                    <span className="bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-lg text-[10px] font-black text-amber-400">{activeQuotation.id}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Emissão</span>
                    <div className="text-[10px] font-bold text-white bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-700">{formatDateSafe(activeQuotation.data)}</div>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Tag</span>
                    <input type="text" value={activeQuotation.tagEquipamento || ''} onChange={e => updateActiveMap({...activeQuotation, tagEquipamento: e.target.value.toUpperCase()})} className="bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-lg outline-none text-[10px] font-black text-white focus:border-amber-400" />
                 </div>
                 <div className="flex flex-col relative">
                    <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-1">Entrega</span>
                    <input type="date" required value={activeQuotation.prazoEntrega || ''} onChange={e => updateActiveMap({...activeQuotation, prazoEntrega: e.target.value})} className="bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-lg outline-none text-[9px] font-black text-white" />
                 </div>
              </div>
           </div>
           <div className="lg:col-span-4 flex flex-col justify-center items-end border-l border-slate-700 pl-4">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-2">STATUS</span>
              <div className="grid grid-cols-2 gap-1.5 w-full max-w-[180px]">
                 {(['PENDENTE', 'AGUARDANDO AP.', 'APROVADO', 'REPROVADO'] as StatusCotacao[]).map(st => (
                   <button key={st} onClick={() => updateActiveMap({...activeQuotation, status: st})} className={`px-1 py-1.5 rounded-lg text-[6px] font-black uppercase border border-slate-700 transition-all flex items-center justify-center ${activeQuotation.status === st ? getStatusStyle(st) : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                     {st}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden">
          <div className="map-table-container custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0 min-w-[1900px]">
              <thead>
                <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider">
                  <th className="p-3 w-[44px] min-w-[44px] text-center sticky left-0 bg-slate-900 z-30 border-r border-slate-950">#</th>
                  <th className="p-3 w-[360px] min-w-[360px] sticky left-[44px] bg-slate-900 z-30 border-r border-slate-950">DESCRIÇÃO E PN</th>
                  <th className="p-3 w-[72px] min-w-[72px] text-center sticky left-[404px] bg-slate-900 z-30 border-r border-slate-950">UND</th>
                  <th className="p-3 w-[82px] min-w-[82px] text-center sticky left-[476px] bg-slate-900 z-30 border-r border-slate-950">QTD</th>
                  {activeQuotation.itens[0].fornecedores.map((f, i) => (
                    <th key={f.id} className="p-0 text-center border-r border-slate-900 bg-white" colSpan={2}>
                      <div className="flex flex-col h-full min-w-[370px]">
                         <div className={`h-1 ${supplierPalette[i % supplierPalette.length].topBar}`}></div>
                         <div className={`p-2 flex flex-col gap-1.5 ${supplierPalette[i % supplierPalette.length].bg} border-b border-slate-300`}>
                            <div className="flex justify-between items-center text-slate-400">
                                <span className="text-[7.5px] font-black uppercase tracking-widest">{f.nome}</span>
                                <button onClick={() => {
                                   if(activeQuotation.itens[0].fornecedores.length > 1) {
                                     const updated = activeQuotation.itens.map(it => recalculateItem({...it, fornecedores: it.fornecedores.filter(sf => sf.id !== f.id)}));
                                     updateActiveMap({...activeQuotation, itens: updated});
                                   }
                                }} className="hover:text-red-500 p-0.5 rounded"><X size={10} /></button>
                            </div>
                            <input type="text" value={f.nome} onChange={e => {
                                    const updated = activeQuotation.itens.map(it => {
                                        const fs = it.fornecedores.map(sf => sf.id === f.id ? {...sf, nome: e.target.value.toUpperCase()} : sf);
                                        return {...it, fornecedores: fs};
                                    });
                                    updateActiveMap({...activeQuotation, itens: updated});
                                }} className="bg-white border border-slate-300 text-[9px] font-black text-slate-900 text-center outline-none p-1 rounded-lg" placeholder="FORNECEDOR" />
                         </div>
                      </div>
                    </th>
                  ))}
                  <th className="p-3 w-40 text-center bg-slate-900 text-white font-black uppercase">VENCEDOR</th>
                  <th className="p-3 w-14 text-center bg-slate-900 text-white font-black uppercase">AÇÃO</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {activeQuotation.itens.map((item, idx) => (
                  <tr key={item.id} className="group hover:bg-slate-50 border-b-[15px] border-slate-100 shadow-sm transition-colors">
                    <td className="p-3 text-center text-[13px] font-black text-white sticky left-0 bg-slate-900 group-hover:bg-slate-800 z-20 border-r border-slate-950">{idx+1}</td>
                    <td className="p-3 sticky left-[44px] bg-slate-900 group-hover:bg-slate-800 z-20 border-r border-slate-950">
                        <div className="flex flex-col gap-2">
                            <input type="text" value={item.descricao} onChange={e => {
                                const its = [...activeQuotation.itens];
                                its[idx] = recalculateItem({...its[idx], descricao: e.target.value.toUpperCase()});
                                updateActiveMap({...activeQuotation, itens: its});
                              }} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-[13px] font-black text-white outline-none focus:border-amber-400" placeholder="MATERIAL" />
                            <div className="flex items-center gap-2 bg-slate-950/40 p-1.5 rounded-lg border border-slate-700">
                                <span className="text-[8px] font-black text-amber-400">PN:</span>
                                <input type="text" value={item.partNumber || ''} onChange={e => {
                                    const its = [...activeQuotation.itens];
                                    its[idx].partNumber = e.target.value.toUpperCase();
                                    updateActiveMap({...activeQuotation, itens: its});
                                  }} className="w-full bg-transparent text-[11px] font-black text-white outline-none" placeholder="COD" />
                            </div>
                        </div>
                    </td>
                    <td className="p-3 text-center sticky left-[404px] bg-slate-900 group-hover:bg-slate-800 z-20 border-r border-slate-950 text-white">
                       <input type="text" value={item.unidade} onChange={e => {
                           const its = [...activeQuotation.itens];
                           its[idx].unidade = e.target.value.toUpperCase();
                           updateActiveMap({...activeQuotation, itens: its});
                       }} className="w-12 mx-auto bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-center text-[11px] font-black text-white outline-none" />
                    </td>
                    <td className="p-3 bg-slate-900 group-hover:bg-slate-800 border-r border-slate-950 sticky left-[476px] z-20 text-white">
                        <input type="number" value={item.quantidade} onChange={e => {
                            const q = parseInt(e.target.value) || 0;
                            const its = [...activeQuotation.itens];
                            its[idx] = recalculateItem({...its[idx], quantidade: q});
                            updateActiveMap({...activeQuotation, itens: its});
                          }} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 font-black text-[14px] text-center outline-none text-white" />
                    </td>
                    {item.fornecedores.map((f, si) => {
                      const isWinner = f.total > 0 && f.total === item.menorValor;
                      const palette = supplierPalette[si % supplierPalette.length];
                      return (
                        <React.Fragment key={f.id}>
                          {/* COLUNA DE INPUTS - MIN-W 280PX PARA MAIOR ESPAÇO COM P-1 */}
                          <td className={`p-1 border-r border-slate-900 transition-all ${isWinner ? 'bg-emerald-500' : palette.bg}`}>
                             <div className="flex flex-col gap-1.5 min-w-[280px]">
                                <label className={`text-[8px] font-black uppercase ${isWinner ? 'text-emerald-100' : 'text-slate-500'}`}>MARCA</label>
                                <input 
                                  type="text" 
                                  placeholder="Marca" 
                                  value={f.marca || ''} 
                                  onChange={e => {
                                    const its = [...activeQuotation.itens];
                                    its[idx].fornecedores[si].marca = e.target.value.toUpperCase();
                                    updateActiveMap({...activeQuotation, itens: its});
                                  }} 
                                  className={`w-full border rounded-lg p-1 text-[10px] font-black outline-none ${isWinner ? 'bg-emerald-400/30 text-white border-emerald-300' : 'bg-white text-slate-900 border-slate-200'}`} 
                                />
                                <div className="grid grid-cols-[1.6fr_0.4fr] gap-2">
                                  {/* CAMPO UNITÁRIO - PRIORIDADE 1.6FR E FONTE 16PX */}
                                  <div className="flex flex-col">
                                    <label className={`text-[8px] font-black uppercase mb-1 ${isWinner ? 'text-emerald-100' : 'text-slate-600'}`}>UNITÁRIO</label>
                                    <div className={`flex items-center border rounded-xl px-1 py-1 ${isWinner ? 'bg-emerald-400/40 border-emerald-300' : 'bg-white border-slate-200 shadow-sm'}`}>
                                      <span className={`text-[9px] font-black mr-0.5 ${isWinner ? 'text-white' : 'text-slate-400'}`}>R$</span>
                                      <input 
                                        type="number" 
                                        step="0.01" 
                                        value={f.valorUnit} 
                                        onChange={e => {
                                            const vu = parseFloat(e.target.value) || 0;
                                            const its = [...activeQuotation.itens];
                                            its[idx].fornecedores[si].valorUnit = vu;
                                            its[idx] = recalculateItem(its[idx]);
                                            updateActiveMap({...activeQuotation, itens: its});
                                        }} 
                                        className={`w-full bg-transparent border-none p-0 text-center font-black text-[16px] outline-none ${isWinner ? 'text-white' : 'text-slate-900'}`} 
                                      />
                                    </div>
                                  </div>
                                  {/* CAMPO DIFAL % - 0.4FR PARA ECONOMIZAR ESPAÇO */}
                                  <div className="flex flex-col">
                                    <label className={`text-[8px] font-black uppercase mb-1 ${isWinner ? 'text-emerald-100' : 'text-slate-600'}`}>DIFAL %</label>
                                    <div className={`border rounded-xl px-1 py-1 ${isWinner ? 'bg-emerald-400/40 border-emerald-300' : 'bg-white border-slate-200 shadow-sm'}`}>
                                      <input 
                                        type="number" 
                                        step="0.1"
                                        value={f.difal || 0} 
                                        onChange={e => {
                                            const df = parseFloat(e.target.value) || 0;
                                            const its = [...activeQuotation.itens];
                                            its[idx].fornecedores[si].difal = df;
                                            its[idx] = recalculateItem(its[idx]);
                                            updateActiveMap({...activeQuotation, itens: its});
                                        }} 
                                        className={`w-full bg-transparent border-none p-0 text-center font-black text-[15px] outline-none ${isWinner ? 'text-white' : 'text-slate-900'}`} 
                                      />
                                    </div>
                                  </div>
                                </div>
                             </div>
                          </td>
                          {/* COLUNA DE TOTAL - REDUZIDA PARA MIN-W 90PX (PUXA DIVISÓRIA PARA DIREITA) */}
                          <td className={`p-1 font-black text-center border-r border-slate-900 transition-all flex items-center justify-center min-w-[90px] ${isWinner ? 'bg-emerald-500 text-white' : palette.bg + ' text-slate-900'}`}>
                             {f.valorUnit > 0 ? (
                                <span className="text-[17px] font-black tracking-tighter leading-none">R$ {f.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             ) : <span className="text-slate-200">---</span>}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="p-3 bg-emerald-600 text-white font-black text-center border-l border-emerald-700 min-w-[160px]">
                        {item.vencedor ? (
                          <div className="flex flex-col items-center gap-1">
                             <CheckCircle2 size={18} />
                             <span className="uppercase line-clamp-2 leading-tight font-black text-[10px]">{item.vencedor}</span>
                          </div>
                        ) : '---'}
                    </td>
                    <td className="p-3 bg-slate-50 text-center border-l border-slate-200 min-w-[70px]">
                        <button onClick={() => {
                            if (activeQuotation.itens.length > 1) {
                                const its = activeQuotation.itens.filter(it => it.id !== item.id);
                                updateActiveMap({...activeQuotation, itens: its});
                            }
                        }} className="p-2 text-red-500 hover:bg-red-100 rounded-lg shadow-sm border border-transparent"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-[#f8fafc] p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-300">
             <div className="flex gap-3">
                <button onClick={() => {
                    const its = [...activeQuotation.itens];
                    const newItem = recalculateItem({
                      id: Math.random().toString(36).substr(2, 9),
                      codigo: String(its.length + 1).padStart(3, '0'), 
                      partNumber: '', descricao: '', unidade: 'UN', quantidade: 1,
                      fornecedores: its[0].fornecedores.map(f => ({id: f.id, nome: f.nome, marca: '', valorUnit: 0, total: 0, difal: 0})),
                      menorValor: 0, vencedor: ''
                    });
                    its.push(newItem);
                    updateActiveMap({...activeQuotation, itens: its});
                }} className="px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-[1.5rem] text-[11px] font-black uppercase flex items-center gap-2 hover:bg-slate-900 hover:text-white transition-all shadow-xl active:scale-95"><PlusCircle size={18} /> MATERIAL</button>
                <button onClick={() => {
                    const newSupId = Math.random().toString(36).substr(2, 9);
                    const supCount = activeQuotation.itens[0].fornecedores.length + 1;
                    const updated = activeQuotation.itens.map(it => recalculateItem({...it, fornecedores: [...it.fornecedores, {id: newSupId, nome: `FORNECEDOR ${supCount}`, marca: '', valorUnit: 0, total: 0, difal: 0}]}));
                    updateActiveMap({...activeQuotation, itens: updated});
                }} className="px-6 py-3 bg-slate-100 border-2 border-slate-300 text-slate-600 rounded-[1.5rem] text-[11px] font-black uppercase flex items-center gap-2 hover:bg-slate-900 hover:text-white transition-all"><UserPlus size={18} /> FORNECEDOR</button>
             </div>
             <div className="flex items-center gap-6">
                <div className="text-center bg-white p-4 rounded-[2rem] border-2 border-slate-900 shadow-2xl min-w-[240px]">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">ECONOMIA ESTIMADA</span>
                    <span className="text-2xl font-black text-slate-900">R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <button onClick={() => { setActiveQuotationId(null); }} className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3 border-2 border-slate-950"><CheckCircle2 size={18} className="text-emerald-400" /> FINALIZAR</button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24 px-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Mapas de Cotação</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase mt-3 tracking-widest">Inteligência Estratégica</p>
        </div>
        <button onClick={createNewQuotation} className="px-8 py-5 bg-slate-900 text-white rounded-[2rem] text-[12px] font-black uppercase flex items-center gap-4 shadow-xl hover:scale-105 active:scale-95 transition-all"><PlusCircle size={24} className="text-amber-400" /> NOVO MAPA</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {quotations.map(q => {
          const mTotal = q.itens.reduce((acc, it) => acc + (it.menorValor || 0), 0);
          return (
            <button key={q.id} onClick={() => setActiveQuotationId(q.id)} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:border-slate-900 hover:shadow-xl transition-all text-left flex flex-col justify-between h-[320px] active:scale-95 group relative">
              <div className="absolute top-8 right-8">
                 <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border ${getStatusStyle(q.status)}`}>{q.status}</div>
              </div>
              <div className="pt-4">
                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block mb-3">{q.id}</span>
                <h3 className="text-xl font-black text-slate-900 uppercase leading-tight line-clamp-2">{q.titulo}</h3>
                <div className="flex items-center gap-3 mt-6 text-[10px] font-black text-slate-500 uppercase bg-slate-50 px-4 py-2 rounded-xl w-fit border border-slate-100 shadow-inner">
                   <Calendar size={14} className="text-slate-400" /> {formatDateSafe(q.data)}
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                 <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Custo Projetado</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">R$ {mTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-lg"><ChevronRight size={24} /></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuotationMap;