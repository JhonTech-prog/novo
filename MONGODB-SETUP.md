# 🚀 Guia Completo - MongoDB + Backend + Admin

## 📋 O que foi configurado

✅ **Backend Node.js** com Express em `/server`
✅ **Integração MongoDB** para estoque em tempo real
✅ **Detecção de subdomínio** admin.pratofit.com.br
✅ **API REST** para sincronizar dados entre admin e loja
✅ **Fallback localStorage** caso backend esteja offline

---

## 🗄️ 1. Configurar MongoDB

### Opção A: MongoDB Atlas (Recomendado - Grátis)
1. Acesse [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um cluster (Free Tier M0)
4. Clique em **Connect** → **Connect your application**
5. Copie a connection string, ex:
   ```
   mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/pratofit?retryWrites=true&w=majority
   ```

### Opção B: MongoDB Local
```bash
# Instale o MongoDB Community Edition
# Windows: https://www.mongodb.com/try/download/community

# Connection string local:
mongodb://localhost:27017/pratofit
```

---

## ⚙️ 2. Configurar Backend

### 1. Entre na pasta do servidor:
```bash
cd server
```

### 2. Instale as dependências:
```bash
npm install
```

### 3. Configure a connection string do MongoDB:

Edite o arquivo `server/.env` e adicione sua string de conexão:
```env
MONGODB_URI=mongodb+srv://SEU_USUARIO:SUA_SENHA@cluster0.xxxxx.mongodb.net/pratofit?retryWrites=true&w=majority
PORT=3001
```

### 4. Inicie o servidor:
```bash
npm run dev
```

Você deve ver:
```
✅ Conectado ao MongoDB
🚀 Servidor rodando na porta 3001
```

---

## 🌐 3. Testar o Sistema

### Testar Localmente (Desenvolvimento)

#### Terminal 1 - Backend:
```bash
cd server
npm run dev
```

#### Terminal 2 - Frontend:
```bash
npm run dev
```

#### Acessar:
- **Loja:** http://localhost:5173
- **Admin:** http://localhost:5173/?admin=true
- **Admin (rota):** http://localhost:5173/admin

---

## 🔧 4. Configurar Produção (Vercel)

### Backend (Deploy separado):

**Opções:**
- **Heroku** (gratuito com GitHub Student Pack)
- **Railway.app** (gratuito)
- **Render.com** (gratuito)

### Frontend:

1. Commit das alterações:
```bash
git add .
git commit -m "Adiciona backend MongoDB e painel admin"
git push
```

2. Na Vercel, adicione as variáveis de ambiente:
   - `VITE_API_URL` = URL do seu backend (ex: `https://seu-backend.railway.app`)

3. Configure o subdomínio `admin.pratofit.com.br` (veja [SETUP-ADMIN.md](SETUP-ADMIN.md))

---

## 🧪 5. Testar Integração Admin ↔ Loja

1. **Abra 2 abas:**
   - Aba 1: http://localhost:5173 (loja)
   - Aba 2: http://localhost:5173/?admin=true (admin)

2. **No admin:**
   - Senha: `admin123`
   - Altere o estoque de uma marmita para 5 unidades
   - Clique em "Salvar Estoque"

3. **Na loja:**
   - Recarregue a página (F5)
   - O estoque deve estar atualizado!

---

## 📊 6. Verificar MongoDB

Para ver os dados salvos:

### MongoDB Atlas:
1. Acesse o painel do Atlas
2. Clique em **Browse Collections**
3. Selecione database `pratofit` → collection `products`

### MongoDB Compass (Interface gráfica):
1. Baixe: [mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)
2. Conecte usando sua connection string
3. Navegue: `pratofit` → `products`

---

## 🔐 7. Segurança

### Antes de colocar em produção:

1. **Altere a senha do admin** em [App.tsx](App.tsx):
```typescript
if (adminPass === 'SENHA_FORTE_AQUI_123!@#') {
```

2. **Proteja sua connection string:**
   - Nunca commite `.env` no Git
   - Use variáveis de ambiente no servidor

3. **Configure CORS** no backend (já está configurado)

---

## 🐛 Solução de Problemas

### ❌ Erro: "Cannot find module 'express'"
```bash
cd server
npm install
```

### ❌ Backend não conecta ao MongoDB
- Verifique se a connection string está correta em `server/.env`
- Certifique-se de que seu IP está na whitelist do MongoDB Atlas
- Teste a conexão em: https://www.mongodb.com/cloud/atlas

### ❌ Admin não abre
- Teste com: `http://localhost:5173/?admin=true`
- Verifique o console do navegador (F12)
- Confirme que o código foi salvo e o servidor reiniciado

### ❌ Estoque não sincroniza
- Verifique se o backend está rodando
- Abra o console do navegador e veja se há erros
- Teste a API diretamente: `http://localhost:3001/health`

---

## 📞 Próximos Passos

1. ✅ Deploy do backend (Railway/Render)
2. ✅ Configure variável `VITE_API_URL` na Vercel
3. ✅ Adicione subdomínio admin.pratofit.com.br
4. ✅ Teste em produção
5. ✅ Altere senha do admin
