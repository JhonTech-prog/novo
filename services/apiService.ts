
import { MenuItem } from '../types';
import { MENU_ITEMS } from '../constants';

/**
 * SERVIÇO DE API - PRATOFIT
 * Conecta com o backend MongoDB para sincronizar estoque em tempo real
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'pratofit_inventory';

export const apiService = {
  // Busca todos os produtos do MongoDB ou localStorage como fallback
  getProducts: async (): Promise<MenuItem[]> => {
    try {
      // Tenta buscar do backend MongoDB
      const response = await fetch(`${API_URL}/api/products`);
      
      if (response.ok) {
        const { data: stockMap } = await response.json();
        
        // Mescla dados do constants.ts com estoque do MongoDB
        return MENU_ITEMS.map(item => ({
          ...item,
          stock: stockMap[item.id] !== undefined ? stockMap[item.id] : item.stock
        }));
      }
    } catch (error) {
      console.warn('Backend indisponível, usando localStorage:', error);
    }
    
    // Fallback: usa localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return MENU_ITEMS;
    
    try {
      const stockMap = JSON.parse(saved);
      return MENU_ITEMS.map(item => ({
        ...item,
        stock: stockMap[item.id] !== undefined ? stockMap[item.id] : item.stock
      }));
    } catch (e) {
      return MENU_ITEMS;
    }
  },

  // Atualiza o estoque no MongoDB
  updateStock: async (updatedItems: MenuItem[]): Promise<boolean> => {
    try {
      // Salva no MongoDB
      const response = await fetch(`${API_URL}/api/products/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems })
      });
      
      if (response.ok) {
        // Também salva no localStorage como backup
        const stockMap = updatedItems.reduce((acc: any, item) => {
          acc[item.id] = item.stock;
          return acc;
        }, {});
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stockMap));
        
        return true;
      }
    } catch (error) {
      console.error("Erro ao salvar no MongoDB, salvando apenas no localStorage:", error);
      
      // Fallback: salva apenas no localStorage
      const stockMap = updatedItems.reduce((acc: any, item) => {
        acc[item.id] = item.stock;
        return acc;
      }, {});
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stockMap));
      
      return true;
    }
    
    return false;
  },

  // Decrementa estoque quando cliente faz pedido
  decrementStock: async (items: { id: string; quantity: number }[]): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/products/decrement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      
      return response.ok;
    } catch (error) {
      console.error("Erro ao decrementar estoque:", error);
      return false;
    }
  }
};
