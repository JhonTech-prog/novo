
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, MessageCircle, RotateCcw } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

const AIChef: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const INITIAL_MESSAGE: ChatMessage = { 
    role: 'model', 
    text: 'Olá! Sou a Nutri IA do PratoFit. Posso te ajudar a escolher os pratos ideais para o seu objetivo hoje? Me conte o que você busca (Low Carb, Hipertrofia, Regional...)! 🥗' 
  };
  
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    const userMessage: ChatMessage = { role: 'user', text: userText };
    
    // Captura o histórico ATUAL para passar ao serviço (preserva contexto)
    const currentHistory = [...messages];
    
    // Atualiza a tela com a mensagem do usuário imediatamente
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Chama o serviço com o histórico limpo e a nova mensagem
      const reply = await sendMessageToGemini(currentHistory, userText);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Tive uma falha na conexão. Pode tentar novamente?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    if (window.confirm("Deseja reiniciar nossa conversa?")) {
      setMessages([INITIAL_MESSAGE]);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-700 hover:scale-110 transition-all duration-300 flex items-center gap-2 group ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Falar com Nutri IA"
      >
        <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
        <span className="font-bold hidden sm:block pr-2">Nutri IA</span>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-ping"></div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white"></div>
      </button>

      {/* Janela de Chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-[400px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 flex flex-col overflow-hidden h-[600px] max-h-[80vh] animate-fade-in-up">
          {/* Header */}
          <div className="bg-emerald-600 p-5 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-2xl">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Nutri IA</h3>
                <p className="text-xs opacity-80 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span>
                  Especialista em Nutrição
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={resetChat} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Reiniciar chat">
                    <RotateCcw size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} className="bg-black/10 hover:bg-black/20 text-white rounded-xl p-2 transition-colors">
                    <X size={20} />
                </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte sobre as marmitas..."
                className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm placeholder:text-gray-400"
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:scale-100 transition-all active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
                <Sparkles size={10} /> Nutri IA pode cometer erros. Consulte um nutricionista.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChef;
