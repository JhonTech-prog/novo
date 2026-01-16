import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pratofit';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// Schema do Produto
const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  title: String,
  stock: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// ================== ROTAS ==================

// GET - Buscar todos os produtos (retorna apenas estoque)
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    const stockMap = {};
    products.forEach(p => {
      stockMap[p.productId] = p.stock;
    });
    res.json({ success: true, data: stockMap });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Atualizar estoque (batch)
app.post('/api/products/stock', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Items inválidos' });
    }

    const bulkOps = items.map(item => ({
      updateOne: {
        filter: { productId: item.id },
        update: { 
          $set: { 
            productId: item.id,
            title: item.title,
            stock: item.stock,
            lastUpdated: new Date()
          }
        },
        upsert: true
      }
    }));

    await Product.bulkWrite(bulkOps);

    res.json({ success: true, message: 'Estoque atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Atualizar estoque de um produto específico
app.put('/api/products/:productId/stock', async (req, res) => {
  try {
    const { productId } = req.params;
    const { stock } = req.body;

    const product = await Product.findOneAndUpdate(
      { productId },
      { stock, lastUpdated: new Date() },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Decrementar estoque (quando cliente faz pedido)
app.post('/api/products/decrement', async (req, res) => {
  try {
    const { items } = req.body; // [{ id, quantity }]

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const item of items) {
        const product = await Product.findOne({ productId: item.id }).session(session);
        
        if (!product || product.stock < item.quantity) {
          throw new Error(`Estoque insuficiente para ${item.id}`);
        }

        await Product.updateOne(
          { productId: item.id },
          { 
            $inc: { stock: -item.quantity },
            $set: { lastUpdated: new Date() }
          }
        ).session(session);
      }

      await session.commitTransaction();
      res.json({ success: true, message: 'Estoque atualizado!' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Erro ao decrementar estoque:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
