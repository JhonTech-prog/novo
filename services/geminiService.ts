
import { GoogleGenAI } from "@google/genai";
import { MENU_ITEMS } from '../constants';

/**
 * Serviço de integração com a Nutri IA (Google Gemini)
 */
export const sendMessageToGemini = async (history: {role: 'user' | 'model', text: string}[], newMessage: string) => {
  // A API_KEY deve estar presente no ambiente (process.env.API_KEY)
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined") {
    console.error("ERRO: API_KEY não encontrada no ambiente.");
    return "Desculpe, minha conexão com o cérebro da IA está desligada. Verifique se a API_KEY foi configurada corretamente nas variáveis de ambiente do projeto. 🛠️";
  }

  try {
    // Correctly initialize GoogleGenAI with a named parameter as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Instrução de sistema para dar personalidade e contexto à IA
    const systemInstruction = `Você é a "Nutri IA", assistente virtual especialista do PratoFit em Campina Grande/PB. 
Sua missão é ajudar os clientes a escolherem marmitas saudáveis congeladas.

CARDÁPIO ATUAL:
${MENU_ITEMS.map(i => `- ${i.title}: ${i.description}`).join('\n')}

REGRAS DE OURO:
1. Comece sempre de forma amigável, acolhedora e use muitos emojis (🥗, 💪, ✨).
2. Seja concisa e direta, não mande textos longos demais.
3. Foque em objetivos de saúde: Low Carb, Proteico, Pratos Regionais Saudáveis.
4. Explique a vantagem dos KITS (5, 10, 20 unidades) para economizar.
5. Você ajuda na ESCOLHA, mas o fechamento do pedido acontece via WhatsApp no final da seleção do cardápio.
`;

    /**
     * REGRA CRÍTICA DO GEMINI:
     * O histórico ('contents') DEVE obrigatoriamente começar com uma mensagem de papel 'user'.
     */
    const filteredHistory = [...history];
    while (filteredHistory.length > 0 && filteredHistory[0].role !== 'user') {
      filteredHistory.shift();
    }

    // Formata o histórico e a nova mensagem no padrão esperado pelo SDK
    const contents = [
      ...filteredHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      {
        role: 'user',
        parts: [{ text: newMessage }]
      }
    ];

    // Chamada principal para o modelo gemini-3-flash-preview following guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        topP: 0.95,
        // Disable thinking for faster text-only chat responses
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    // Access the .text property directly (do not call it as a function)
    const responseText = response.text;

    if (!responseText) {
      throw new Error("A IA retornou uma resposta sem conteúdo.");
    }

    return responseText;

  } catch (error: any) {
    console.error("Falha na Nutri IA:", error);
    
    // Tratamento amigável para o usuário em caso de erro técnico
    if (error?.message?.includes("429")) {
      return "Estou recebendo muitas mensagens agora! Pode aguardar um minutinho e tentar de novo? 🥗";
    }
    
    if (error?.message?.includes("Role") || error?.message?.includes("400")) {
      return "Houve um erro na sincronização da nossa conversa. Vamos recomeçar? Clique no ícone de reiniciar! 💪";
    }

    return "Tive um probleminha técnico aqui, mas estou pronta para falar sobre nossas marmitas saudáveis! O que você busca hoje? 🥗";
  }
};
