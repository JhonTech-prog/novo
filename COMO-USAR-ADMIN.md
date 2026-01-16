# 🌐 Como Configurar admin.pratofit.com.br

## ⚠️ IMPORTANTE
O subdomínio **admin.pratofit.com.br** só funciona em **PRODUÇÃO**, não localmente!

---

## 🧪 Para Testar Localmente

Use uma destas opções:

### Opção 1: Parâmetro URL (Mais Fácil)
```
http://localhost:3000/?admin=true
```

### Opção 2: Rota /admin
```
http://localhost:3000/admin
```

---

## 🚀 Configurar em Produção (Vercel)

### Passo 1: Deploy na Vercel
1. Faça commit do código:
```bash
git add .
git commit -m "Adiciona painel admin com MongoDB"
git push
```

2. Conecte seu repositório na [Vercel](https://vercel.com)
3. Faça o deploy

### Passo 2: Configurar Subdomínio no DNS

No seu provedor de DNS (Registro.br, Cloudflare, etc):

**Adicione um registro CNAME:**
- **Nome:** `admin`
- **Tipo:** `CNAME`
- **Valor:** `cname.vercel-dns.com`
- **TTL:** Automático ou 3600

### Passo 3: Adicionar Domínio na Vercel

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Domains**
3. Clique em **Add**
4. Digite: `admin.pratofit.com.br`
5. Clique em **Add**
6. Aguarde verificação (até 48h)

### Passo 4: Configurar Variáveis de Ambiente na Vercel

Em **Settings** → **Environment Variables**, adicione:

```
VITE_API_URL=https://seu-backend-url.com
```

*(A URL do seu backend MongoDB que você fará deploy no Railway/Render)*

---

## 🔐 Alterar Senha do Admin

**⚠️ ANTES DE FAZER DEPLOY, altere a senha!**

Edite [App.tsx](App.tsx) e procure por:

```typescript
if (adminPass === 'admin123') {
```

Troque para:
```typescript
if (adminPass === 'SUA_SENHA_FORTE_AQUI_!@#123') {
```

---

## ✅ Após Configuração

- **Loja pública:** `https://pratofit.com.br`
- **Painel admin:** `https://admin.pratofit.com.br`
- **Senha:** (a que você definiu)

---

## 🐛 Problemas Comuns

### DNS não propaga
- Aguarde até 48h
- Teste com: `nslookup admin.pratofit.com.br`

### Subdomínio não funciona localmente
- É normal! Use `?admin=true` para testar local

### Erro de conexão MongoDB
- Configure a variável `VITE_API_URL` na Vercel
- Faça deploy do backend primeiro
