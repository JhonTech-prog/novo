# 📦 Sistema de Gestão de Insumos - PratoFit

## 🎯 O que foi implementado

✅ **Cadastro de Ingredientes** - Gerenciar matéria-prima (arroz, frango, etc.)  
✅ **Receitas** - Definir quais ingredientes compõem cada marmita  
✅ **Decremento Automático** - Insumos baixam quando vende marmita  
✅ **Alertas de Estoque Baixo** - Aviso quando ingrediente está acabando  
✅ **Histórico de Movimentações** - Rastreabilidade completa  
✅ **Cálculo de Custo** - Custo de produção de cada marmita  

---

## 🚀 Como Funciona

### Fluxo Completo:

```
1. Cadastra Ingredientes (arroz, frango, brócolis, etc.)
   ↓
2. Define Receitas (Ex: Fit Tradicional = 200g arroz + 150g frango + 100g brócolis)
   ↓
3. Cliente compra 1 Fit Tradicional
   ↓
4. Sistema decrementa:
   - 1x Fit Tradicional do estoque de produtos
   - 200g de arroz
   - 150g de frango  
   - 100g de brócolis
   ↓
5. Se algum ingrediente ficar abaixo do mínimo → ALERTA!
```

---

## 📋 1. Cadastrar Ingredientes

### Via API:

```javascript
POST http://localhost:3001/api/ingredients
Content-Type: application/json

{
  "name": "Arroz Integral",
  "description": "Arroz integral para marmitas",
  "unit": "g",
  "currentStock": 50000,  // 50kg = 50000g
  "minStock": 10000,      // Alerta quando tiver menos de 10kg
  "cost": 15.00,          // R$ 15,00 por kg
  "supplier": "Fornecedor XYZ",
  "category": "carboidrato"
}
```

### Unidades disponíveis:
- `g` - gramas
- `kg` - quilogramas
- `ml` - mililitros
- `l` - litros
- `unidade` - unidades (ex: ovos)

### Categorias:
- `proteina` - Frango, carne, peixe, etc.
- `carboidrato` - Arroz, macarrão, batata, etc.
- `vegetal` - Brócolis, cenoura, etc.
- `tempero` - Sal, pimenta, alho, etc.
- `acompanhamento` - Molhos, farofa, etc.
- `outro` - Outros ingredientes

---

## 🍽️ 2. Criar Receitas

### Exemplo: Fit Tradicional

```javascript
POST http://localhost:3001/api/recipes
Content-Type: application/json

{
  "productId": "fit-tradicional",
  "productName": "Fit Tradicional",
  "portionSize": 450,
  "ingredients": [
    {
      "ingredientId": "6789...", // ID do arroz no MongoDB
      "ingredientName": "Arroz Integral",
      "quantity": 200,
      "unit": "g"
    },
    {
      "ingredientId": "1234...", // ID do frango
      "ingredientName": "Peito de Frango",
      "quantity": 150,
      "unit": "g"
    },
    {
      "ingredientId": "5678...", // ID do brócolis
      "ingredientName": "Brócolis",
      "quantity": 100,
      "unit": "g"
    }
  ]
}
```

---

## 📊 3. Gerenciar Estoque

### Listar todos os ingredientes:
```
GET http://localhost:3001/api/ingredients
```

### Adicionar estoque (entrada/compra):
```javascript
POST http://localhost:3001/api/ingredients/[ID]/add-stock
Content-Type: application/json

{
  "quantity": 25000,  // Comprou 25kg de arroz
  "reason": "Compra - Fornecedor XYZ - NF 12345"
}
```

### Ver alertas de estoque baixo:
```
GET http://localhost:3001/api/ingredients/alerts
```

Retorna:
```json
{
  "success": true,
  "data": [
    {
      "name": "Arroz Integral",
      "currentStock": 8000,
      "minStock": 10000,
      "unit": "g"
    }
  ]
}
```

---

## 💰 4. Calcular Custo de Produção

```
GET http://localhost:3001/api/recipes/fit-tradicional/cost
```

Retorna:
```json
{
  "success": true,
  "productName": "Fit Tradicional",
  "totalCost": "4.75",
  "breakdown": [
    {
      "ingredient": "Arroz Integral",
      "quantity": 200,
      "unit": "g",
      "unitCost": 15.00,
      "totalCost": "3.00"
    },
    {
      "ingredient": "Peito de Frango",
      "quantity": 150,
      "unit": "g",
      "unitCost": 8.00,
      "totalCost": "1.20"
    },
    {
      "ingredient": "Brócolis",
      "quantity": 100,
      "unit": "g",
      "unitCost": 5.50,
      "totalCost": "0.55"
    }
  ]
}
```

---

## ✅ 5. Verificar Disponibilidade

Antes de produzir, verifique se tem insumos:

```javascript
POST http://localhost:3001/api/recipes/fit-tradicional/check-availability
Content-Type: application/json

{
  "quantity": 50  // Quer produzir 50 marmitas
}
```

Resposta se OK:
```json
{
  "available": true,
  "message": "Insumos disponíveis"
}
```

Resposta se faltar:
```json
{
  "available": false,
  "message": "Insumos insuficientes",
  "missing": [
    {
      "ingredient": "Arroz Integral",
      "available": 8000,
      "needed": 10000,
      "unit": "g"
    }
  ]
}
```

---

## 📈 6. Histórico de Movimentações

```
GET http://localhost:3001/api/stock-movements?limit=50
```

Parâmetros:
- `ingredientId` - Filtrar por ingrediente específico
- `startDate` - Data inicial (YYYY-MM-DD)
- `endDate` - Data final
- `limit` - Quantidade de registros (padrão: 100)

Retorna:
```json
{
  "success": true,
  "data": [
    {
      "ingredientName": "Arroz Integral",
      "type": "producao",
      "quantity": 200,
      "reason": "Produção de 1x Fit Tradicional",
      "timestamp": "2026-01-16T12:30:00Z"
    },
    {
      "ingredientName": "Arroz Integral",
      "type": "entrada",
      "quantity": 25000,
      "reason": "Compra - Fornecedor XYZ",
      "timestamp": "2026-01-15T10:00:00Z"
    }
  ]
}
```

Tipos de movimentação:
- `entrada` - Compra/reposição
- `saida` - Saída manual
- `producao` - Usado na produção
- `ajuste` - Ajuste de inventário
- `perda` - Perda/desperdício

---

## 🔄 7. Decremento Automático

### Como funciona:

Quando uma venda é processada via:
```
POST http://localhost:3001/api/products/decrement
```

O sistema automaticamente:
1. Decrementa o estoque do produto (marmita)
2. Busca a receita do produto
3. Decrementa cada ingrediente da receita
4. Registra no histórico
5. Verifica alertas de estoque baixo

**Você não precisa fazer nada manualmente!** 🎉

---

## 🎨 8. Exemplo Prático Completo

### Passo 1: Cadastrar Ingredientes

```javascript
// Arroz
POST /api/ingredients
{ "name": "Arroz Integral", "unit": "g", "currentStock": 50000, "minStock": 10000, "cost": 15.00, "category": "carboidrato" }

// Frango
POST /api/ingredients
{ "name": "Peito de Frango", "unit": "g", "currentStock": 30000, "minStock": 5000, "cost": 28.00, "category": "proteina" }

// Brócolis
POST /api/ingredients
{ "name": "Brócolis", "unit": "g", "currentStock": 10000, "minStock": 2000, "cost": 5.50, "category": "vegetal" }
```

### Passo 2: Criar Receita

```javascript
POST /api/recipes
{
  "productId": "fit-tradicional",
  "productName": "Fit Tradicional",
  "ingredients": [
    { "ingredientId": "[ID_ARROZ]", "ingredientName": "Arroz Integral", "quantity": 200, "unit": "g" },
    { "ingredientId": "[ID_FRANGO]", "ingredientName": "Peito de Frango", "quantity": 150, "unit": "g" },
    { "ingredientId": "[ID_BROCOLIS]", "ingredientName": "Brócolis", "quantity": 100, "unit": "g" }
  ]
}
```

### Passo 3: Cliente compra

```javascript
// Cliente compra 2 Fit Tradicional
POST /api/products/decrement
{
  "items": [
    { "id": "fit-tradicional", "quantity": 2 }
  ]
}
```

**Sistema automaticamente decrementa:**
- 2x Fit Tradicional do estoque
- 400g de arroz (200g x 2)
- 300g de frango (150g x 2)
- 200g de brócolis (100g x 2)

---

## 🛠️ 9. Próximos Passos

Agora você precisa criar receitas para todos os seus produtos!

### Lista de Produtos (do seu constants.ts):
- fit-tradicional
- fit-executivo
- low-carb
- proteico
- vegetariano
- frango-show
- carne-tropical
- peixe-grelhado

Para cada um, crie a receita com os ingredientes necessários.

---

## 🐛 10. Solução de Problemas

### Erro: "Receita não cadastrada"
- Cadastre a receita do produto antes de vender

### Erro: "Estoque insuficiente de [ingrediente]"
- Adicione mais estoque do ingrediente
- Ou ajuste a receita

### Alertas não aparecem
- Verifique se `minStock` está configurado
- Execute: `GET /api/ingredients/alerts`

---

## 📱 11. Criar Interface Admin (Próximo Passo)

Vou criar componentes React para você gerenciar tudo visualmente no painel admin!

Quer que eu crie agora? 🚀
