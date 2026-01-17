import axios from 'axios';

/**
 * SERVIÇO DE INTEGRAÇÃO COM IFOOD
 * 
 * Este serviço conecta sua loja ao iFood para sincronizar estoques automaticamente.
 * Documentação oficial: https://developer.ifood.com.br/
 */

const IFOOD_API_BASE = 'https://merchant-api.ifood.com.br';

// Configurações (pegar do .env)
const MERCHANT_ID = process.env.IFOOD_MERCHANT_ID;
const CLIENT_ID = process.env.IFOOD_CLIENT_ID;
const CLIENT_SECRET = process.env.IFOOD_CLIENT_SECRET;

let accessToken = null;
let tokenExpiresAt = null;

/**
 * Autentica com a API do iFood e obtém access token
 */
async function authenticate() {
  try {
    const response = await axios.post(`${IFOOD_API_BASE}/authentication/v1.0/oauth/token`, {
      grantType: 'client_credentials',
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    });
    
    accessToken = response.data.accessToken;
    tokenExpiresAt = Date.now() + (response.data.expiresIn * 1000);
    
    console.log('✅ Autenticado no iFood');
    return accessToken;
  } catch (error) {
    console.error('❌ Erro ao autenticar no iFood:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Garante que temos um token válido
 */
async function ensureAuthenticated() {
  if (!accessToken || Date.now() >= tokenExpiresAt) {
    await authenticate();
  }
  return accessToken;
}

/**
 * Busca o catálogo de produtos do iFood
 */
export async function getIfoodCatalog() {
  try {
    const token = await ensureAuthenticated();
    
    const response = await axios.get(
      `${IFOOD_API_BASE}/catalog/v1.0/merchants/${MERCHANT_ID}/catalog`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar catálogo do iFood:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Atualiza o estoque de um produto no iFood
 */
export async function updateIfoodStock(itemId, quantity) {
  try {
    const token = await ensureAuthenticated();
    
    const response = await axios.patch(
      `${IFOOD_API_BASE}/catalog/v1.0/merchants/${MERCHANT_ID}/items/${itemId}/availability`,
      {
        available: quantity > 0,
        quantity: quantity
      },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Estoque atualizado no iFood: ${itemId} -> ${quantity}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar estoque no iFood:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Atualiza estoque de múltiplos produtos no iFood
 */
export async function syncStockToIfood(items) {
  const results = [];
  
  for (const item of items) {
    // Busca o ID do iFood usando o mapeamento (você configurará isso)
    const ifoodItemId = getIfoodItemId(item.id);
    
    if (ifoodItemId) {
      const success = await updateIfoodStock(ifoodItemId, item.stock);
      results.push({ id: item.id, ifoodId: ifoodItemId, success });
    }
  }
  
  return results;
}

/**
 * Processa um pedido recebido do iFood (via webhook)
 * Decrementa o estoque local quando há venda no iFood
 */
export async function processIfoodOrder(orderData) {
  const itemsToDecrement = [];
  
  // Extrai itens do pedido
  for (const item of orderData.items || []) {
    const localItemId = getLocalItemId(item.id); // Mapeia ID do iFood para ID local
    
    if (localItemId) {
      itemsToDecrement.push({
        id: localItemId,
        quantity: item.quantity
      });
    }
  }
  
  return itemsToDecrement;
}

/**
 * MAPEAMENTO DE PRODUTOS
 * Relaciona os IDs da sua loja com os IDs do iFood
 * 
 * TODO: Salvar isso no MongoDB para facilitar gestão
 */
const PRODUCT_MAPPING = {
  // Seu ID local -> ID no iFood
  'fit-tradicional': 'ifood-item-id-123',
  'fit-executivo': 'ifood-item-id-456',
  'low-carb': 'ifood-item-id-789',
  // ... adicione todos os produtos
};

function getIfoodItemId(localId) {
  return PRODUCT_MAPPING[localId];
}

function getLocalItemId(ifoodId) {
  return Object.keys(PRODUCT_MAPPING).find(key => PRODUCT_MAPPING[key] === ifoodId);
}

/**
 * Configura mapeamento de produtos (para adicionar via admin)
 */
export async function setProductMapping(localId, ifoodId) {
  PRODUCT_MAPPING[localId] = ifoodId;
  // TODO: Salvar no MongoDB
  console.log(`Mapeamento criado: ${localId} -> ${ifoodId}`);
  return true;
}

export const ifoodService = {
  authenticate,
  getIfoodCatalog,
  updateIfoodStock,
  syncStockToIfood,
  processIfoodOrder,
  setProductMapping
};
