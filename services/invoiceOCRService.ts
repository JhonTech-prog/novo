import { GoogleGenerativeAI } from '@google/generative-ai';

// @ts-ignore
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAtdBlGO14fLgVGV_qfiRgi5cXPzRsc7DM';

/**
 * Extrai informações de cupom fiscal usando Gemini Vision AI
 */
export const invoiceOCRService = {
  async extractInvoiceData(imageBase64: string) {
    try {
      console.log('🔍 Iniciando extração de cupom fiscal...');
      
      const genAI = new GoogleGenerativeAI(API_KEY);
      
      // Busca modelos disponíveis
      console.log('Buscando modelos disponíveis...');
      const modelsResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
      );
      const modelsData = await modelsResponse.json();
      console.log('Modelos disponíveis:', modelsData);
      
      // Filtra modelos que suportam vision
      const visionModels = modelsData.models?.filter((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent') &&
        (m.name.includes('vision') || m.name.includes('gemini'))
      ) || [];
      
      if (visionModels.length === 0) {
        throw new Error('Nenhum modelo de visão disponível');
      }
      
      // Remove o prefixo 'models/' do nome do modelo
      const modelName = visionModels[0].name.replace('models/', '');
      console.log(`Usando modelo: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `
Você é um assistente especializado em ler cupons e notas fiscais brasileiras.

Analise esta imagem de CUPOM FISCAL ou NOTA FISCAL e extraia as seguintes informações:

1. Nome do estabelecimento (supermercado, feira, etc)
2. CNPJ do estabelecimento
3. Data da compra
4. Lista de produtos com:
   - Nome do produto (normalizado, sem códigos)
   - Quantidade comprada
   - Unidade de medida (kg, g, l, ml, unidade)
   - Valor unitário (preço por unidade)
   - Valor total do item

IMPORTANTE:
- Normalize os nomes dos produtos (ex: "ARROZ INTEGRAL 1KG" → "Arroz integral")
- Converta unidades para o padrão: kg, g, l, ml, unidade
- Extraia APENAS produtos alimentícios/ingredientes (ignore produtos de limpeza, higiene)
- Para produtos vendidos por peso, calcule o valor unitário correto (valor total / quantidade)

Retorne um JSON válido no formato:
{
  "supplier": "Nome do estabelecimento",
  "cnpj": "00.000.000/0000-00",
  "invoiceNumber": "número do cupom/nota",
  "date": "DD/MM/YYYY",
  "items": [
    {
      "name": "Nome do ingrediente",
      "quantity": 1.5,
      "unit": "kg",
      "unitCost": 12.50,
      "totalCost": 18.75
    }
  ],
  "totalValue": 100.00
}
`;

      const imagePart = {
        inlineData: {
          data: imageBase64.split(',')[1] || imageBase64,
          mimeType: 'image/jpeg'
        }
      };
      
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Resposta do Gemini:', text);
      
      // Extrai JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Não foi possível extrair dados estruturados do cupom fiscal');
      }
      
      const invoiceData = JSON.parse(jsonMatch[0]);
      console.log('✅ Dados extraídos:', invoiceData);
      
      return invoiceData;
      
    } catch (error) {
      console.error('❌ Erro ao processar cupom fiscal:', error);
      throw error;
    }
  }
};
