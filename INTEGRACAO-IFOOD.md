# 🍔 Integração com iFood - Guia Completo

## 📋 O que foi configurado

✅ Serviço de integração com API do iFood  
✅ Sincronização automática de estoque (sua loja → iFood)  
✅ Webhook para receber pedidos do iFood  
✅ Decrementar estoque local quando há venda no iFood  
✅ Mapeamento de produtos entre sua loja e iFood  

---

## 🔑 1. Obter Credenciais do iFood

### Passo 1: Cadastro no Portal do Desenvolvedor

1. Acesse: [developer.ifood.com.br](https://developer.ifood.com.br/)
2. Faça login com sua conta de restaurante iFood
3. Vá em **"Minhas Aplicações"**
4. Clique em **"Criar Nova Aplicação"**
5. Preencha os campos:
   - **Nome do aplicativo:** `PratoFit Sync`
   - **Slug:** `pratofit-sync` (gerado automaticamente)
   - **Descrição:** `Sincronização de estoque entre PratoFit e iFood`
   - **Categoria:** `CATALOG`
   - **Linguagem:** Selecione qualquer uma (ex: JavaScript)
   - **Logo:** Opcional (pode adicionar depois)
   - **Escolha os módulos:**
     - ☑️ **Catalog** - Configure o catálogo de produto das suas lojas
     - ☑️ **Merchant** - Detalhes e configurações da loja
6. Clique em **"Continuar"**

### Passo 2: Copiar Credenciais

Após criar a aplicação, copie:
- **Client ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Client Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Merchant ID**: Seu ID de restaurante no iFood

---

## ⚙️ 2. Configurar Variáveis de Ambiente

Edite o arquivo `server/.env` e adicione:

```env
# Configurações existentes
MONGODB_URI=mongodb+srv://jhon:002513@cluster0.eibqck8.mongodb.net/pratofit?retryWrites=true&w=majority&appName=Cluster0
PORT=3001

# ========== INTEGRAÇÃO IFOOD ==========
IFOOD_ENABLED=true
IFOOD_CLIENT_ID=seu-client-id-aqui
IFOOD_CLIENT_SECRET=seu-client-secret-aqui
IFOOD_MERCHANT_ID=seu-merchant-id-aqui
```

---

## 📦 3. Instalar Dependência

No Git Bash, execute:

```bash
cd /c/Users/pc/Downloads/pratofit---cardápio-digital-premium/server

npm install axios

# Reinicie o servidor
npm start
```

---

## 🔗 4. Mapear Produtos (sua loja ↔ iFood)

### Método 1: Via API (Recomendado)

Faça uma chamada POST para mapear cada produto:

```javascript
// Exemplo: Mapear "fit-tradicional" com o item do iFood
POST http://localhost:3001/api/ifood/mapping
Content-Type: application/json

{
  "localId": "fit-tradicional",
  "ifoodId": "id-do-item-no-ifood-123"
}
```

### Método 2: Editar Código Diretamente

Edite `server/ifoodService.js` e localize:

```javascript
const PRODUCT_MAPPING = {
  'fit-tradicional': 'ifood-item-id-123',
  'fit-executivo': 'ifood-item-id-456',
  'low-carb': 'ifood-item-id-789',
  // ... adicione todos os seus produtos
};
```

**Como descobrir os IDs do iFood?**

```bash
# Buscar catálogo do iFood
GET http://localhost:3001/api/ifood/catalog
```

---

## 🔄 5. Testar Sincronização

### Teste Manual

```bash
# Sincronizar estoque manualmente
POST http://localhost:3001/api/ifood/sync
```

### Teste Automático

1. **Abra o painel admin:** `http://localhost:3000/?admin=true`
2. Altere o estoque de alguma marmita
3. Clique em **"Salvar Estoque"**
4. ✅ O estoque será atualizado no iFood automaticamente!

---

## 📲 6. Configurar Webhook do iFood

### No Portal do Desenvolvedor iFood:

1. Acesse sua aplicação
2. Vá em **"Webhooks"**
3. Adicione a URL: `https://seu-backend-url.com/api/ifood/webhook`
4. Eventos a ouvir:
   - `ORDER_PLACED`
   - `ORDER_CONFIRMED`

### O que acontece:

1. Cliente faz pedido no iFood
2. iFood envia webhook para seu backend
3. Backend decrementa o estoque local automaticamente
4. Estoque sincronizado em ambas as plataformas!

---

## 🧪 7. Testar Integração Completa

### Cenário 1: Atualizar estoque no Admin

1. Admin: Atualiza estoque de "Fit Tradicional" para 10
2. ✅ iFood: Estoque atualizado para 10
3. ✅ Loja: Mostra 10 unidades disponíveis

### Cenário 2: Venda no iFood

1. Cliente: Compra 2 "Fit Tradicional" no iFood
2. iFood: Envia webhook
3. ✅ Backend: Decrementa estoque local (10 → 8)
4. ✅ Loja: Mostra 8 unidades disponíveis

### Cenário 3: Venda na Loja

1. Cliente: Compra 1 "Fit Tradicional" na sua loja
2. ✅ Backend: Decrementa estoque local (8 → 7)
3. ✅ iFood: Estoque atualizado para 7 na próxima sincronização

---

## 🔧 8. Deploy em Produção

### Backend (Railway/Render)

1. Faça deploy do backend em um serviço como:
   - [Railway.app](https://railway.app) (gratuito)
   - [Render.com](https://render.com) (gratuito)
   - Heroku, etc.

2. Configure as variáveis de ambiente lá

3. Copie a URL do backend (ex: `https://pratofit-api.railway.app`)

### Frontend (Vercel)

Já está configurado! Só precisa adicionar a variável:

```
VITE_API_URL=https://pratofit-api.railway.app
```

### Webhook iFood

Atualize a URL do webhook para apontar para seu backend em produção:
```
https://pratofit-api.railway.app/api/ifood/webhook
```

---

## 📊 9. Monitoramento

### Logs do Servidor

Quando tudo estiver funcionando, você verá no terminal:

```
✅ Conectado ao MongoDB
✅ Autenticado no iFood
🚀 Servidor rodando na porta 3001

📦 Webhook iFood recebido: ORDER_CONFIRMED - Pedido: #12345
📉 Estoque decrementado: fit-tradicional -2
🔄 Sincronizando estoque com iFood...
✅ Estoque atualizado no iFood: fit-tradicional -> 8
```

---

## 🐛 10. Solução de Problemas

### ❌ Erro: "Não autenticado no iFood"
- Verifique `IFOOD_CLIENT_ID` e `IFOOD_CLIENT_SECRET`
- Confirme que a aplicação está ativa no Portal do Desenvolvedor

### ❌ Estoque não sincroniza
- Verifique `IFOOD_ENABLED=true` no `.env`
- Confirme que os produtos estão mapeados corretamente
- Teste manualmente: `POST /api/ifood/sync`

### ❌ Webhook não funciona
- Verifique se a URL está correta e acessível
- Use uma ferramenta como [webhook.site](https://webhook.site) para testar
- Confirme que os eventos estão configurados no Portal iFood

---

## 🎯 Próximos Passos

1. ✅ Obter credenciais do iFood
2. ✅ Configurar variáveis de ambiente
3. ✅ Instalar `axios`: `npm install axios`
4. ✅ Mapear todos os produtos
5. ✅ Testar sincronização
6. ✅ Configurar webhook
7. ✅ Deploy em produção

---

## 📞 Suporte

- Documentação iFood: [developer.ifood.com.br/docs](https://developer.ifood.com.br/docs)
- Suporte técnico iFood: Abrir ticket no Portal do Desenvolvedor
