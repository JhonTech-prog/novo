import mongoose from 'mongoose';

/**
 * SCHEMA DE INGREDIENTES
 * Gerencia a matéria-prima usada na produção
 */
const ingredientSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  description: String,
  unit: { 
    type: String, 
    required: true,
    enum: ['kg', 'g', 'l', 'ml', 'unidade'],
    default: 'g'
  },
  currentStock: { 
    type: Number, 
    required: true,
    default: 0 
  },
  minStock: { 
    type: Number, 
    required: true,
    default: 0 
  },
  cost: { 
    type: Number, 
    default: 0 
  },
  supplier: String,
  category: {
    type: String,
    enum: ['proteina', 'carboidrato', 'vegetal', 'tempero', 'acompanhamento', 'outro'],
    default: 'outro'
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

/**
 * SCHEMA DE RECEITAS
 * Define quais ingredientes e quantidades são usados em cada produto
 */
const recipeSchema = new mongoose.Schema({
  productId: { 
    type: String, 
    required: true,
    unique: true 
  },
  productName: String,
  ingredients: [{
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true
    },
    ingredientName: String,
    quantity: { 
      type: Number, 
      required: true 
    },
    unit: String
  }],
  portionSize: Number, // Tamanho da porção em gramas
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

/**
 * SCHEMA DE HISTÓRICO DE PRODUÇÃO
 * Registra todas as movimentações de estoque
 */
const stockMovementSchema = new mongoose.Schema({
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  ingredientName: String,
  type: {
    type: String,
    enum: ['entrada', 'saida', 'producao', 'ajuste', 'perda'],
    required: true
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  unitCost: {
    type: Number,
    default: 0 // Custo unitário do item nessa movimentação
  },
  totalCost: {
    type: Number,
    default: 0 // Custo total da movimentação (quantity * unitCost)
  },
  source: {
    type: String,
    enum: ['cupom_fiscal', 'nota_fiscal', 'empasa', 'manual', 'outro'],
    default: 'manual'
  },
  supplier: String, // Fornecedor (ex: supermercado, EMPASA)
  invoiceNumber: String, // Número da nota/cupom fiscal
  reason: String,
  relatedProductId: String,
  relatedProductName: String,
  user: String,
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

export const Ingredient = mongoose.model('Ingredient', ingredientSchema);
export const Recipe = mongoose.model('Recipe', recipeSchema);
export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
