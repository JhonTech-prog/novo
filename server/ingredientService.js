import { Ingredient, Recipe, StockMovement } from './ingredientModels.js';

/**
 * SERVIÇO DE GESTÃO DE INSUMOS
 * Gerencia ingredientes, receitas e controle de estoque de matéria-prima
 */

/**
 * Decrementa insumos quando um produto é vendido
 */
export async function decrementIngredientsForProduct(productId, quantity = 1) {
  try {
    // Busca a receita do produto
    const recipe = await Recipe.findOne({ productId }).populate('ingredients.ingredientId');
    
    if (!recipe) {
      console.warn(`Receita não encontrada para produto: ${productId}`);
      return { success: false, message: 'Receita não cadastrada' };
    }

    const session = await Ingredient.startSession();
    session.startTransaction();

    try {
      const movements = [];

      // Decrementa cada ingrediente da receita
      for (const item of recipe.ingredients) {
        const ingredient = item.ingredientId;
        const totalNeeded = item.quantity * quantity;

        // Verifica se há estoque suficiente
        if (ingredient.currentStock < totalNeeded) {
          throw new Error(`Estoque insuficiente de ${ingredient.name}. Disponível: ${ingredient.currentStock}${ingredient.unit}, Necessário: ${totalNeeded}${ingredient.unit}`);
        }

        // Decrementa o estoque
        await Ingredient.updateOne(
          { _id: ingredient._id },
          { 
            $inc: { currentStock: -totalNeeded },
            $set: { lastUpdated: new Date() }
          }
        ).session(session);

        // Registra a movimentação
        movements.push({
          ingredientId: ingredient._id,
          ingredientName: ingredient.name,
          type: 'producao',
          quantity: totalNeeded,
          reason: `Produção de ${quantity}x ${recipe.productName}`,
          relatedProductId: productId,
          relatedProductName: recipe.productName
        });

        console.log(`📉 Insumo decrementado: ${ingredient.name} -${totalNeeded}${ingredient.unit}`);
      }

      // Salva o histórico de movimentações
      await StockMovement.insertMany(movements, { session });

      await session.commitTransaction();
      
      // Verifica alertas de estoque baixo
      await checkLowStockAlerts(recipe.ingredients.map(i => i.ingredientId._id));

      return { 
        success: true, 
        message: 'Insumos decrementados com sucesso',
        movements 
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Erro ao decrementar insumos:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Verifica ingredientes com estoque baixo
 */
export async function checkLowStockAlerts(ingredientIds = null) {
  try {
    const query = ingredientIds 
      ? { _id: { $in: ingredientIds } }
      : {};

    const lowStockItems = await Ingredient.find({
      ...query,
      $expr: { $lte: ['$currentStock', '$minStock'] }
    });

    if (lowStockItems.length > 0) {
      console.log('⚠️ ALERTA: Ingredientes com estoque baixo:');
      lowStockItems.forEach(item => {
        console.log(`   - ${item.name}: ${item.currentStock}${item.unit} (mínimo: ${item.minStock}${item.unit})`);
      });
    }

    return lowStockItems;
  } catch (error) {
    console.error('Erro ao verificar alertas:', error);
    return [];
  }
}

/**
 * Adiciona estoque de um ingrediente (compra/entrada)
 */
export async function addIngredientStock(ingredientId, quantity, reason = 'Compra') {
  try {
    const ingredient = await Ingredient.findById(ingredientId);
    
    if (!ingredient) {
      return { success: false, message: 'Ingrediente não encontrado' };
    }

    ingredient.currentStock += quantity;
    ingredient.lastUpdated = new Date();
    await ingredient.save();

    // Registra a movimentação
    await StockMovement.create({
      ingredientId: ingredient._id,
      ingredientName: ingredient.name,
      type: 'entrada',
      quantity,
      reason
    });

    console.log(`📈 Insumo adicionado: ${ingredient.name} +${quantity}${ingredient.unit}`);

    return { 
      success: true, 
      message: 'Estoque atualizado',
      newStock: ingredient.currentStock 
    };
  } catch (error) {
    console.error('Erro ao adicionar estoque:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Calcula o custo de produção de um produto
 */
export async function calculateProductionCost(productId) {
  try {
    const recipe = await Recipe.findOne({ productId }).populate('ingredients.ingredientId');
    
    if (!recipe) {
      return { success: false, message: 'Receita não encontrada' };
    }

    let totalCost = 0;
    const breakdown = [];

    for (const item of recipe.ingredients) {
      const ingredient = item.ingredientId;
      const cost = (ingredient.cost / 1000) * item.quantity; // Custo por grama
      totalCost += cost;
      
      breakdown.push({
        ingredient: ingredient.name,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: ingredient.cost,
        totalCost: cost.toFixed(2)
      });
    }

    return {
      success: true,
      productName: recipe.productName,
      totalCost: totalCost.toFixed(2),
      breakdown
    };
  } catch (error) {
    console.error('Erro ao calcular custo:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Verifica se há insumos suficientes para produzir uma quantidade de produtos
 */
export async function checkIngredientsAvailability(productId, quantity = 1) {
  try {
    const recipe = await Recipe.findOne({ productId }).populate('ingredients.ingredientId');
    
    if (!recipe) {
      return { available: false, message: 'Receita não cadastrada' };
    }

    const missing = [];

    for (const item of recipe.ingredients) {
      const ingredient = item.ingredientId;
      const needed = item.quantity * quantity;
      
      if (ingredient.currentStock < needed) {
        missing.push({
          ingredient: ingredient.name,
          available: ingredient.currentStock,
          needed,
          unit: ingredient.unit
        });
      }
    }

    if (missing.length > 0) {
      return {
        available: false,
        message: 'Insumos insuficientes',
        missing
      };
    }

    return { available: true, message: 'Insumos disponíveis' };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return { available: false, message: error.message };
  }
}

export const ingredientService = {
  decrementIngredientsForProduct,
  checkLowStockAlerts,
  addIngredientStock,
  calculateProductionCost,
  checkIngredientsAvailability
};
