# 📱 Configuração do Subdomínio Mobile - estoque.pratofit.com.br

## ✅ Arquivos Criados

### 1. **MobileStockEntry.tsx**
Interface mobile otimizada para entrada de estoque com:
- Botões grandes e touch-friendly
- Scanner de QR Code (NFC-e)
- Upload de foto do cupom fiscal
- OCR com Gemini AI
- Histórico de entradas recentes
- Confirmação antes de salvar

### 2. **Endpoint /api/stock-entries/bulk** (server/index.js)
API para registrar múltiplos itens de uma nota fiscal:
- Cria ingredientes automaticamente se não existirem
- Atualiza estoque com custo médio ponderado
- Registra movimentação no histórico
- Suporta fonte (cupom_fiscal, nota_fiscal, etc)

---

## 🚀 Como Testar Localmente

### **Opção 1: Parâmetro URL**
```
http://localhost:3000/?estoque=true
```

### **Opção 2: Adicionar entrada no hosts**
1. Abrir como Administrador: `C:\Windows\System32\drivers\etc\hosts`
2. Adicionar linha:
   ```
   127.0.0.1 estoque.localhost
   ```
3. Acessar: `http://estoque.localhost:3000`

---

## 📲 Workflow Mobile

### **Fluxo de Entrada via QR Code** (Recomendado)
1. Abrir estoque.pratofit.com.br no celular
2. Clicar em "Escanear QR Code"
3. Tirar foto do QR Code da NFC-e
4. Sistema busca dados na SEFAZ
5. Exibe produtos com valores
6. Confirmar ou cancelar
7. Dados salvos no MongoDB

### **Fluxo de Entrada via Foto**
1. Clicar em "Foto da Lista"
2. Tirar foto mostrando **lista de produtos**
3. Gemini AI extrai produtos e valores
4. Exibe resumo com total
5. Confirmar ou cancelar

---

## ⚙️ Configuração no Vercel

### **1. Adicionar Subdomínio**
No painel da Vercel:
1. Ir em **Settings > Domains**
2. Adicionar: `estoque.pratofit.com.br`
3. Apontar DNS CNAME:
   ```
   estoque.pratofit.com.br → cname.vercel-dns.com
   ```

### **2. Variáveis de Ambiente**
Garantir que estão definidas:
```
VITE_GEMINI_API_KEY=AIzaSyAtdBlGO14fLgVGV_qfiRgi5cXPzRsc7DM
VITE_API_URL=https://seu-backend.railway.app
```

---

## 🔧 Estrutura do Código

### **App.tsx**
```tsx
// Detecta subdomínio estoque
const isMobileStockDomain = useMemo(() => {
  const host = window.location.hostname.toLowerCase();
  return host.startsWith('estoque.') || 
         host.includes('estoque-') || 
         new URLSearchParams(window.location.search).get('estoque') === 'true';
}, []);

// Renderiza interface mobile
if (isMobileStockDomain) {
  return <MobileStockEntry />;
}
```

### **Backend - Endpoint Bulk**
```javascript
POST /api/stock-entries/bulk
Body: {
  supplier: "MERCADO ABC",
  invoiceNumber: "123456",
  date: "2024-01-15",
  source: "cupom_fiscal",
  items: [
    {
      name: "TOMATE",
      quantity: 5,
      unit: "kg",
      unitCost: 6.50,
      totalCost: 32.50
    }
  ]
}
```

---

## 📱 Recursos Mobile

### **Otimizações para Celular**
✅ Botões grandes (min 48x48px touch target)
✅ Fontes legíveis (min 16px)
✅ Espaçamento adequado (gap-4)
✅ Feedback visual (active:scale-95)
✅ Modal de loading animado
✅ Histórico de últimas 5 entradas
✅ Capture="environment" para câmera traseira
✅ PWA-ready (pode adicionar à tela inicial)

### **UX Simplificada**
- Apenas 2 botões principais (QR Code e Foto)
- Sem tabs, sem menu lateral
- Foco total na entrada de estoque
- Confirmação clara antes de salvar
- Botão cancelar visível

---

## 🧪 Testes Recomendados

### **1. Teste de QR Code**
- [ ] Upload de foto com QR Code
- [ ] Decodificação com BarcodeDetector
- [ ] Fallback para API online
- [ ] Processamento NFC-e SEFAZ
- [ ] Exibição de produtos
- [ ] Salvamento no banco

### **2. Teste de OCR**
- [ ] Upload de cupom fiscal
- [ ] Extração via Gemini AI
- [ ] Validação de itens vazios
- [ ] Alerta de foto incorreta
- [ ] Botão cancelar
- [ ] Salvamento com sucesso

### **3. Teste de Responsividade**
- [ ] iPhone SE (375px)
- [ ] iPhone 12/13 (390px)
- [ ] Galaxy S21 (360px)
- [ ] iPad Mini (768px)

---

## 🐛 Troubleshooting

### **"Erro ao salvar"**
→ Verificar se backend está rodando (localhost:3001)
→ Checar CORS habilitado
→ Ver console do navegador (F12)

### **"Nenhum produto detectado"**
→ Foto deve mostrar **lista de produtos**
→ Não fotografar apenas cabeçalho/rodapé
→ Usar QR Code para 100% precisão

### **QR Code não decodifica**
→ Foto deve estar nítida
→ QR Code deve estar completo
→ Testar com API online como fallback

---

## 🎯 Próximos Passos

1. ✅ Interface mobile criada
2. ✅ Endpoint bulk criado
3. ⏳ Deploy no Vercel
4. ⏳ Configurar DNS
5. ⏳ Testar em produção
6. ⏳ PWA (manifest.json + service worker)
7. ⏳ Notificações push
8. ⏳ Modo offline

---

## 📞 Suporte

- Interface Desktop: https://pratofit.com.br
- Admin Panel: https://admin.pratofit.com.br
- **Mobile Stock: https://estoque.pratofit.com.br** ← NOVO!
- Backend API: localhost:3001 (dev) | Railway (prod)

---

Criado para **PratoFit - Campina Grande/PB** 🍽️
