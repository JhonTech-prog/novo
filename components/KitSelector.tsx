
import React from 'react';
import { KITS } from '../constants';
import { KitDefinition } from '../types';
import { Check, Package } from 'lucide-react';

interface KitSelectorProps {
  onSelect: (kit: KitDefinition) => void;
}

const KitSelector: React.FC<KitSelectorProps> = ({ onSelect }) => {
  return (
    <div className="w-full bg-white font-sans selection:bg-emerald-100 overflow-x-hidden">
      {/* Banner Superior - DESIGN DISTRIBUÍDO E HARMONIOSO */}
      <div className="relative w-full h-[140px] sm:h-[180px] bg-white overflow-visible border-b border-gray-50 z-10">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-start justify-between relative">
          
          {/* Logo PratoFit (Esquerda) */}
          <div className="z-30 pt-6 sm:pt-8">
            <img 
              src="https://i.postimg.cc/C1mfH4ML/LOGO-2.png" 
              alt="PratoFit Logo" 
              className="h-12 sm:h-24 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* O CONTAINER "U" (Centro) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 z-20">
            <div className="bg-[#059669] w-[180px] h-[80px] sm:w-[480px] sm:h-[150px] rounded-b-[30px] sm:rounded-b-[80px] shadow-2xl flex items-start justify-center p-[4px] sm:p-[6px] overflow-hidden">
               <div className="w-full h-full rounded-b-[26px] sm:rounded-b-[74px] overflow-hidden relative bg-[#1a1a1a]">
                  <img 
                    src="https://static.ifood-static.com.br/image/upload/t_medium/pratos/dabc25a4-58f9-43a9-a660-9c8f5125abfd/202402151100_03UX_i.jpg" 
                    alt="Bobó de Frango"
                    className="w-full h-full object-cover object-center transform scale-110"
                  />
                  <div className="absolute inset-0 rounded-b-[26px] sm:rounded-b-[74px] shadow-[inset_0_-10px_20px_rgba(0,0,0,0.2)] pointer-events-none"></div>
               </div>
            </div>
          </div>

          {/* Faixas Coloridas (Direita) */}
          <div className="hidden lg:flex gap-4 pt-8 z-10 pr-4 items-start">
            <div className="w-10 h-28 bg-[#047857] shadow-md transform -skew-x-[35deg] rounded-sm opacity-90"></div>
            <div className="w-10 h-28 bg-[#f97316] shadow-md transform -skew-x-[35deg] rounded-sm opacity-90"></div>
            <div className="w-10 h-28 bg-[#34d399] shadow-md transform -skew-x-[35deg] rounded-sm opacity-90"></div>
          </div>
        </div>
      </div>

      {/* Conteúdo Abaixo do Banner */}
      <div className="max-w-7xl mx-auto px-4 pt-16 sm:pt-24 pb-20 text-center relative z-0">
        <div className="space-y-3 mb-12">
            <h2 className="text-3xl sm:text-5xl font-black text-[#1e293b] tracking-tighter">
                Como deseja <span className="text-[#059669]">pedir</span>?
            </h2>
            <p className="text-slate-400 text-[10px] sm:text-base font-medium max-w-lg mx-auto uppercase tracking-[0.2em]">
                Escolha seu plano e monte seu kit
            </p>
        </div>

        {/* Cards de Kits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-4">
          {KITS.map((kit) => (
            <div 
              key={kit.id}
              className={`relative bg-white rounded-[2rem] border transition-all duration-500 cursor-pointer flex flex-col group
                ${kit.highlight 
                  ? 'border-[#059669] ring-4 ring-[#059669]/5 shadow-xl z-10 scale-[1.02]' 
                  : 'border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-md'
                }
              `}
              onClick={() => onSelect(kit)}
            >
              {kit.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#059669] text-white text-[10px] font-black px-6 py-2 rounded-full shadow-lg uppercase z-20 tracking-widest">
                  O PREFERIDO
                </div>
              )}
              
              <div className="p-8 pt-10 flex-1 flex flex-col items-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 
                  ${kit.highlight ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500'}`}>
                  <Package size={24} />
                </div>
                
                <h3 className="font-black text-2xl text-[#1e293b] mb-1">{kit.name}</h3>
                <p className="text-[10px] text-slate-400 mb-8 font-black uppercase tracking-[0.2em]">
                  {kit.description}
                </p>
                
                <div className="mb-6">
                  <span className="text-4xl font-black text-[#1e293b] tracking-tighter">
                      {kit.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                
                <div className="bg-[#ecfdf5] text-[#059669] text-[10px] font-black py-2 px-6 rounded-full border border-emerald-100">
                  {kit.pricePerMeal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / marmita
                </div>
              </div>

              <div className={`py-5 border-t border-slate-50 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all rounded-b-[2rem]
                ${kit.highlight 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-50/80 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white'
                }
              `}>
                Selecionar Kit <Check size={16} strokeWidth={4} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KitSelector;
