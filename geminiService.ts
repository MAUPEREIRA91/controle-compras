
import { GoogleGenAI, Type } from "@google/genai";
import { Order, QuotationMap } from "../types";

// Fix: Initializing GoogleGenAI inside functions to ensure fresh instance and follow modern SDK usage guidelines
export async function analyzeQuotation(map: QuotationMap) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Fix: Using gemini-3-pro-preview as the task involves advanced reasoning and strategic analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analise este Mapa de Cotação de Suprimentos e forneça uma recomendação estratégica baseada em economia e confiabilidade: ${JSON.stringify(map)}`,
      config: {
        systemInstruction: "Você é um consultor sênior de compras e suprimentos. Analise os preços, sugira o melhor fornecedor custo-benefício e aponte riscos potenciais.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Erro na análise da IA:", error);
    return "Não foi possível realizar a análise no momento.";
  }
}

// Fix: Initializing GoogleGenAI inside functions to ensure fresh instance and follow modern SDK usage guidelines
export async function generateSummary(orders: Order[]) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Fix: gemini-3-flash-preview is suitable for basic summarization and status reporting
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Resuma o status atual desta carteira de pedidos: ${JSON.stringify(orders)}`,
      config: {
        systemInstruction: "Você é um gestor de suprimentos. Dê um resumo executivo focando em valores totais, pedidos urgentes e possíveis gargalos nas NFs.",
      }
    });
    return response.text;
  } catch (error) {
    return "Resumo indisponível.";
  }
}
