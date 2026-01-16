
import React, { useState } from 'react';
import { MenuItem } from '../types';
import { Save, ArrowLeft, Package, RefreshCcw, LogOut, CheckCircle2 } from 'lucide-react';

interface AdminPanelProps {
  items: MenuItem[];
  onSave: (updatedItems: MenuItem[]) => void;
  onExit: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ items, onSave, onExit }) => {
  const [editedItems, setEditedItems] = useState<MenuItem[]>([...items]);
  const [isSaved, setIsSaved] = useState(false);

  const handleStockChange = (id: string, newStock: string) => {
    const val = parseInt(newStock) || 0;
    setEditedItems(prev => prev.map(item => item.id === id ? { ...item, stock: val } : item));
    setIsSaved(false);
  };

  const handleSave = () => {
    onSave(editedItems);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm("Deseja reverter as alterações não salvas?")) {
      setEditedItems([...items]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 animate-fade-in-up">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <button 
              onClick={onExit}
              className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold text-sm mb-2 transition-colors"
            >
              <ArrowLeft size={16} /> Voltar ao Cardápio
            </button>
            <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                <Package className="text-emerald-600" /> 
                Painel Administrativo
            </h1>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleReset}
              className="bg-white text-gray-600 px-4 py-2 rounded-xl font-bold border border-gray-200 shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-all"
            >
              <RefreshCcw size={18} /> Reverter
            </button>
            <button 
              onClick={handleSave}
              className={`px-6 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 ${isSaved ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
            >
              {isSaved ? <><CheckCircle2 size={18} /> Salvo!</> : <><Save size={18} /> Salvar Estoque</>}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Produto</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Categoria</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center w-32">Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {editedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                        <div>
                          <p className="font-bold text-gray-800">{item.title}</p>
                          <p className="text-xs text-gray-400">{item.serving}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full uppercase">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <input 
                          type="number" 
                          min="0"
                          value={item.stock}
                          onChange={(e) => handleStockChange(item.id, e.target.value)}
                          className={`w-20 text-center py-2 border-2 rounded-xl font-bold focus:ring-4 transition-all outline-none ${item.stock <= 5 ? 'border-orange-200 bg-orange-50 text-orange-600 focus:ring-orange-100' : 'border-gray-100 focus:ring-emerald-50 focus:border-emerald-200'}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
            <button 
                onClick={onExit}
                className="text-red-400 hover:text-red-600 flex items-center gap-2 font-bold text-sm transition-colors"
            >
                <LogOut size={16} /> Sair do modo administrador
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
