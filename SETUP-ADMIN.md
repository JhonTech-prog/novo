# 🔧 Configuração do Painel Administrativo

## 🌐 Configurar Subdomínio admin.pratofit.com.br na Vercel

### Passo 1: Criar o Subdomínio no DNS
1. Acesse seu provedor de DNS (Registro.br, Cloudflare, etc.)
2. Adicione um registro CNAME:
   - **Nome/Host:** `admin`
   - **Tipo:** `CNAME`
   - **Valor:** `cname.vercel-dns.com`
   - **TTL:** Automático ou 3600

### Passo 2: Adicionar Domínio na Vercel
1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com)
2. Vá em **Settings** → **Domains**
3. Clique em **Add Domain**
4. Digite: `admin.pratofit.com.br`
5. Clique em **Add**
6. Aguarde a verificação (pode levar até 48h)

### Passo 3: Verificar o Funcionamento
- Acesse: `https://admin.pratofit.com.br`
- Deve aparecer a tela de login administrativo
- Senha padrão: `admin123` (altere isso em produção!)

---

## 🧪 Testar Localmente

### Opção 1: Com parâmetro URL
```
http://localhost:5173/?admin=true
```

### Opção 2: Com rota /admin
```
http://localhost:5173/admin
```

### Opção 3: Simular subdomínio (Windows)
1. Abra o arquivo `C:\Windows\System32\drivers\etc\hosts` como Administrador
2. Adicione a linha:
   ```
   127.0.0.1  admin.localhost
   ```
3. Acesse: `http://admin.localhost:5173`

---

## 🔐 Segurança

**⚠️ IMPORTANTE:** A senha atual (`admin123`) é apenas para desenvolvimento!

Para produção, altere em [App.tsx](App.tsx) linha ~110:
```typescript
if (adminPass === 'SUA_SENHA_FORTE_AQUI') {
```

**Recomendações:**
- Use uma senha forte (mínimo 12 caracteres)
- Considere implementar autenticação JWT
- Adicione rate limiting para evitar ataques de força bruta

---

## 📱 Fluxo de Acesso

1. Cliente acessa: `pratofit.com.br` → Ver cardápio e fazer pedidos
2. Admin acessa: `admin.pratofit.com.br` → Gerenciar estoque
3. Ambos compartilham o mesmo banco de dados MongoDB
4. Estoque atualizado em tempo real entre as duas interfaces
