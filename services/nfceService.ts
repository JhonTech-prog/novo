/**
 * Serviço para processar NFC-e (Nota Fiscal do Consumidor Eletrônica)
 * a partir do QR Code do cupom fiscal
 */

interface NFCeItem {
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

interface NFCeData {
  supplier: string;
  cnpj: string;
  invoiceNumber: string;
  date: string;
  items: NFCeItem[];
  totalValue: number;
}

export const nfceService = {
  /**
   * Extrai a URL da NFC-e do QR Code
   */
  async processQRCode(qrCodeUrl: string): Promise<NFCeData> {
    try {
      console.log('🔍 Processando QR Code da NFC-e:', qrCodeUrl);

      // O QR Code da NFC-e geralmente contém uma URL para a SEFAZ
      // Formato típico: http://www.fazenda.pr.gov.br/nfce/qrcode?p=...
      
      let nfceUrl = qrCodeUrl;
      
      // Se for só o código, monta a URL (adapte conforme seu estado)
      if (!qrCodeUrl.startsWith('http')) {
        // Aqui você pode adicionar lógica para detectar o estado
        nfceUrl = `https://www.sefaz.pb.gov.br/nfce/qrcode?p=${qrCodeUrl}`;
      }

      console.log('📄 Buscando dados da NFC-e...');
      
      // Busca o HTML da nota fiscal
      const response = await fetch(nfceUrl);
      const html = await response.text();
      
      console.log('✅ HTML recebido, extraindo dados...');
      
      // Parser do HTML da NFC-e
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extrai informações básicas
      const supplier = this.extractText(doc, 'razão social', 'nome', 'emitente');
      const cnpj = this.extractText(doc, 'cnpj');
      const invoiceNumber = this.extractText(doc, 'número', 'nota');
      const date = this.extractText(doc, 'data', 'emissão');
      const totalValue = this.extractValue(doc, 'total', 'valor');
      
      // Extrai itens da nota
      const items: NFCeItem[] = [];
      const itemElements = doc.querySelectorAll('[class*="item"], tr[id*="item"], .produto');
      
      itemElements.forEach((element) => {
        const name = this.extractTextFromElement(element, 'produto', 'descrição', 'nome');
        const quantityStr = this.extractTextFromElement(element, 'quantidade', 'qtd', 'qtde');
        const quantity = parseFloat(quantityStr.replace(',', '.')) || 1;
        const unit = this.detectUnit(quantityStr, name);
        const unitCostStr = this.extractTextFromElement(element, 'unitário', 'un', 'preço');
        const unitCost = parseFloat(unitCostStr.replace(',', '.').replace('R$', '').trim()) || 0;
        const totalCostStr = this.extractTextFromElement(element, 'total', 'valor');
        const totalCost = parseFloat(totalCostStr.replace(',', '.').replace('R$', '').trim()) || (quantity * unitCost);
        
        if (name && quantity > 0) {
          items.push({
            name: this.normalizeName(name),
            quantity,
            unit,
            unitCost,
            totalCost
          });
        }
      });

      console.log('✅ Dados extraídos:', { supplier, cnpj, items: items.length });

      return {
        supplier,
        cnpj,
        invoiceNumber,
        date,
        items,
        totalValue
      };
      
    } catch (error) {
      console.error('❌ Erro ao processar NFC-e:', error);
      throw new Error('Não foi possível processar a nota fiscal. Verifique se o QR Code é válido.');
    }
  },

  /**
   * Extrai texto do documento HTML
   */
  extractText(doc: Document, ...keywords: string[]): string {
    for (const keyword of keywords) {
      const elements = doc.querySelectorAll('*');
      for (const element of Array.from(elements)) {
        const text = element.textContent?.toLowerCase() || '';
        if (text.includes(keyword.toLowerCase())) {
          // Pega o próximo elemento ou o texto seguinte
          const nextSibling = element.nextElementSibling || element;
          const value = nextSibling.textContent?.trim() || '';
          if (value && value !== text) {
            return value;
          }
        }
      }
    }
    return '';
  },

  /**
   * Extrai valor numérico
   */
  extractValue(doc: Document, ...keywords: string[]): number {
    const text = this.extractText(doc, ...keywords);
    const value = parseFloat(text.replace(',', '.').replace('R$', '').trim());
    return isNaN(value) ? 0 : value;
  },

  /**
   * Extrai texto de um elemento específico
   */
  extractTextFromElement(element: Element, ...keywords: string[]): string {
    const text = element.textContent?.toLowerCase() || '';
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return element.textContent?.trim() || '';
      }
    }
    
    // Busca em elementos filhos
    const children = element.querySelectorAll('*');
    for (const child of Array.from(children)) {
      const childText = child.textContent?.toLowerCase() || '';
      for (const keyword of keywords) {
        if (childText.includes(keyword)) {
          return child.textContent?.trim() || '';
        }
      }
    }
    
    return '';
  },

  /**
   * Detecta unidade de medida
   */
  detectUnit(quantityStr: string, name: string): string {
    const text = (quantityStr + ' ' + name).toLowerCase();
    
    if (text.includes('kg') || text.includes('quilo')) return 'kg';
    if (text.includes('g') || text.includes('grama')) return 'g';
    if (text.includes('l') || text.includes('litro')) return 'l';
    if (text.includes('ml') || text.includes('mililitro')) return 'ml';
    
    return 'unidade';
  },

  /**
   * Normaliza nome do produto
   */
  normalizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\d+$/g, '') // Remove códigos no final
      .replace(/UN$|PCT$|KG$|G$/gi, '')
      .trim();
  }
};
