
import React, { useState, useEffect } from 'react';
import { X, MessageCircle, MapPin, Search, Loader2, Store, Bike, Clock, CreditCard, Copy, Check, QrCode } from 'lucide-react';
import { CartItem, KitDefinition } from '../types';
import { DELIVERY_ZONES, PICKUP_INFO, PIX_CONFIG } from '../constants';
import { generatePixPayload } from '../utils/pixGenerator';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  selectedKit: KitDefinition | null;
}

type FulfillmentType = 'delivery' | 'pickup';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, items, selectedKit }) => {
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('delivery');
  const [name, setName] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'link' | 'pix'>('pix');
  const [observation, setObservation] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  // Pix Payment State
  const [showPixScreen, setShowPixScreen] = useState(false);
  const [pixPayload, setPixPayload] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [pixConfirmed, setPixConfirmed] = useState(false); // New state for checkbox
  
  // Validation state
  const [errors, setErrors] = useState({ 
      name: false, 
      address: false, 
      neighborhood: false, 
      cep: false, 
      number: false,
      pickupTime: false
  });

  // Reset states when opening/closing
  useEffect(() => {
    if (isOpen) {
        setShowPixScreen(false);
        setPixConfirmed(false);
    }
  }, [isOpen]);

  // Update delivery fee when switching types
  useEffect(() => {
      if (fulfillmentType === 'pickup') {
          setDeliveryFee(0);
      } else if (selectedNeighborhood) {
          // Restore fee if neighborhood is selected
           // Find the price for this neighborhood
            let price = 0;
            for (const zone of DELIVERY_ZONES) {
            if (zone.neighborhoods.includes(selectedNeighborhood)) {
                price = zone.price;
                break;
            }
            }
            setDeliveryFee(price);
      }
  }, [fulfillmentType, selectedNeighborhood]);

  // Função para normalizar texto (remover acentos e minúsculas) para comparação
  const normalizeText = (text: string) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
        return;
    }

    setIsLoadingCep(true);
    setErrors(prev => ({ ...prev, cep: false }));

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (data.erro) {
            setErrors(prev => ({ ...prev, cep: true }));
            alert("CEP não encontrado.");
            return;
        }

        // 1. Preencher Endereço
        setAddress(data.logradouro);
        
        // 2. Tentar encontrar e selecionar o bairro na lista de Zonas
        const apiNeighborhood = normalizeText(data.bairro);
        let neighborhoodFound = false;

        // Procura nas zonas se existe o bairro retornado pelo CEP
        for (const zone of DELIVERY_ZONES) {
            const match = zone.neighborhoods.find(nb => normalizeText(nb) === apiNeighborhood);
            
            if (match) {
                // Se achou o bairro exato na lista
                setSelectedNeighborhood(match);
                setDeliveryFee(zone.price);
                neighborhoodFound = true;
                break;
            }
        }

        // Se não achou exato (ex: API retornou "Bairro Centro" e na lista tem "Centro")
        if (!neighborhoodFound) {
             for (const zone of DELIVERY_ZONES) {
                // Tenta ver se o nome da API contém o nome da lista ou vice-versa
                const match = zone.neighborhoods.find(nb => 
                    apiNeighborhood.includes(normalizeText(nb)) || normalizeText(nb).includes(apiNeighborhood)
                );
                
                if (match) {
                    setSelectedNeighborhood(match);
                    setDeliveryFee(zone.price);
                    neighborhoodFound = true;
                    break;
                }
            }
        }

        if (!neighborhoodFound) {
            alert(`O bairro "${data.bairro}" retornado pelo CEP não foi encontrado exatamente na nossa lista de taxas. Por favor, selecione o bairro mais próximo manualmente.`);
            setSelectedNeighborhood('');
            setDeliveryFee(0);
        }

    } catch (error) {
        console.error("Erro ao buscar CEP", error);
        setErrors(prev => ({ ...prev, cep: true }));
    } finally {
        setIsLoadingCep(false);
    }
  };

  // Update delivery fee when neighborhood changes manually
  const handleNeighborhoodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const neighborhoodName = e.target.value;
    setSelectedNeighborhood(neighborhoodName);
    
    if (!neighborhoodName) {
      setDeliveryFee(0);
      return;
    }

    if (errors.neighborhood) setErrors(prev => ({ ...prev, neighborhood: false }));

    // Find the price for this neighborhood
    let price = 0;
    for (const zone of DELIVERY_ZONES) {
      if (zone.neighborhoods.includes(neighborhoodName)) {
        price = zone.price;
        break;
      }
    }
    setDeliveryFee(price);
  };

  if (!isOpen || !selectedKit) return null;

  const totalPrice = selectedKit.price + deliveryFee;

  // Prepare order but don't close yet if PIX is selected
  const handlePrepareOrder = () => {
    // Validate fields
    const newErrors = {
      name: !name.trim() || name.trim().split(' ').length < 2, // Require at least 2 names
      address: fulfillmentType === 'delivery' ? !address.trim() : false,
      number: fulfillmentType === 'delivery' ? !number.trim() : false,
      neighborhood: fulfillmentType === 'delivery' ? !selectedNeighborhood : false,
      cep: fulfillmentType === 'delivery' ? cep.replace(/\D/g, '').length !== 8 : false,
      pickupTime: fulfillmentType === 'pickup' ? !pickupTime : false
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      if (newErrors.name && name.trim() && name.trim().split(' ').length < 2) {
          alert("Por favor, digite seu Nome e Sobrenome.");
      }
      return;
    }

    // Logic Branch: If PIX, show payment screen. If Link, go to WhatsApp.
    if (paymentMethod === 'pix') {
        // Generate Payload
        const payload = generatePixPayload(PIX_CONFIG.key, PIX_CONFIG.name, PIX_CONFIG.city, totalPrice, 'PEDIDO');
        setPixPayload(payload);
        setShowPixScreen(true);
    } else {
        sendToWhatsApp();
    }
  };

  const sendToWhatsApp = () => {
    // Construct the WhatsApp Message
    let message = `*NOVO PEDIDO - PRATOFIT* 🥗\n\n`;
    message += `*Cliente:* ${name}\n`;
    
    if (fulfillmentType === 'delivery') {
        message += `*MODO:* ENTREGA 🛵\n`;
        message += `*Endereço:* ${address}, Nº ${number}\n`;
        message += `*CEP:* ${cep}\n`;
        message += `*Bairro:* ${selectedNeighborhood} (+R$ ${deliveryFee.toFixed(2)})\n`;
    } else {
        message += `*MODO:* RETIRADA NA LOJA 🛍️\n`;
        message += `(Cliente irá retirar em: ${PICKUP_INFO.address})\n`;
        message += `*Horário de Retirada:* ${pickupTime}\n`;
    }

    if (observation) message += `*Obs:* ${observation}\n`;
    message += `--------------------------------\n`;
    message += `*Plano Escolhido:* ${selectedKit.name}\n`;
    message += `*Valor do Kit:* ${selectedKit.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    
    if (fulfillmentType === 'delivery') {
        message += `*Taxa de Entrega:* ${deliveryFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    }
    
    message += `*VALOR TOTAL:* ${totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    message += `--------------------------------\n`;
    message += `*ITENS DO KIT:*\n`;

    items.forEach(item => {
      message += `• ${item.quantity}x ${item.title}\n`;
    });

    message += `--------------------------------\n`;
    message += `*FORMA DE PAGAMENTO:*\n`;
    if (paymentMethod === 'pix') {
        message += `💠 PAGAMENTO VIA *PIX* INFORMADO\n`;
        message += `📄 *Segue comprovante em anexo*\n`;
    } else {
        message += `🔗 Quero *LINK DE PAGAMENTO*`;
    }

    const whatsappUrl = `https://wa.me/5583988109997?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleClose = () => {
    // Reset state on close
    setErrors({ name: false, address: false, neighborhood: false, cep: false, number: false, pickupTime: false });
    setShowPixScreen(false);
    setPixConfirmed(false);
    onClose();
  }

  // Mascara de CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    if (val.length > 5) {
        val = val.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    setCep(val);
    if (errors.cep) setErrors(prev => ({...prev, cep: false}));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white flex-shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2">
            {showPixScreen ? <QrCode size={24} /> : <MessageCircle size={24} />}
            {showPixScreen ? 'Pagamento PIX' : 'Finalizar Pedido'}
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* --- PIX SCREEN MODE --- */}
        {showPixScreen ? (
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center text-center">
                <p className="text-gray-600 mb-4 text-sm px-4">
                    Abra o app do seu banco <b>(Nubank, Itaú, Bradesco, etc)</b> e utilize a opção <b>Pix Copia e Cola</b> ou escaneie o QR Code.
                </p>
                
                {/* QR Code Display */}
                <div className="bg-white p-2 border-2 border-emerald-500 rounded-xl mb-4 shadow-sm">
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload)}`} 
                        alt="QR Code Pix" 
                        className="w-48 h-48"
                    />
                </div>

                <div className="text-2xl font-bold text-emerald-700 mb-6">
                    {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>

                {/* Copy Paste Area */}
                <div className="w-full bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6 relative">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 text-left">Pix Copia e Cola (Recomendado)</p>
                    <div className="text-xs text-gray-600 break-all font-mono text-left line-clamp-2">
                        {pixPayload}
                    </div>
                    <button 
                        onClick={handleCopyPix}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${copiedPix ? 'bg-emerald-500 text-white' : 'bg-white border shadow-sm text-gray-700 hover:bg-gray-50'}`}
                    >
                        {copiedPix ? <Check size={14} /> : <Copy size={14} />}
                        {copiedPix ? 'Copiado!' : 'Copiar'}
                    </button>
                </div>

                {/* Confirmation Checkbox */}
                <div className="w-full mb-4">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={pixConfirmed}
                            onChange={(e) => setPixConfirmed(e.target.checked)}
                            className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700 text-left">
                            Confirmo que <b>realizei o pagamento</b> e tenho o comprovante salvo.
                        </span>
                    </label>
                </div>

                <button 
                    onClick={sendToWhatsApp}
                    disabled={!pixConfirmed}
                    className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                        pixConfirmed 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    <MessageCircle size={20} />
                    Abrir WhatsApp e Enviar Comprovante
                </button>
                
                <button 
                    onClick={() => setShowPixScreen(false)}
                    className="mt-3 text-sm text-gray-400 hover:text-gray-600 underline"
                >
                    Voltar e editar dados
                </button>
            </div>
        ) : (
            /* --- FORM SCREEN MODE --- */
            <>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Fulfillment Type Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                    <button
                        onClick={() => setFulfillmentType('delivery')}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                            fulfillmentType === 'delivery' 
                            ? 'bg-white text-emerald-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Bike size={18} />
                        Entrega
                    </button>
                    <button
                        onClick={() => setFulfillmentType('pickup')}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                            fulfillmentType === 'pickup' 
                            ? 'bg-white text-emerald-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Store size={18} />
                        Retirada
                    </button>
                </div>

                {/* Order Summary */}
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-4 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium mb-2 uppercase tracking-wide">Resumo Financeiro</p>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-gray-600 text-sm">
                            <span>Valor do Kit ({selectedKit.name}):</span>
                            <span>{selectedKit.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        {fulfillmentType === 'delivery' && (
                            <div className="flex justify-between items-center text-gray-600 text-sm">
                                <span>Taxa de Entrega:</span>
                                <span className={deliveryFee > 0 ? 'text-gray-800' : 'text-gray-400 italic'}>
                                    {deliveryFee > 0 
                                        ? deliveryFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                                        : 'Aguardando CEP/Bairro'
                                    }
                                </span>
                            </div>
                        )}
                        {fulfillmentType === 'pickup' && (
                            <div className="flex justify-between items-center text-emerald-600 text-sm italic">
                                <span>Retirada na Loja:</span>
                                <span>Grátis</span>
                            </div>
                        )}
                        <div className="h-px bg-orange-200 my-2"></div>
                        <div className="flex justify-between items-end">
                            <span className="font-bold text-gray-800 text-lg">Total a Pagar:</span>
                            <span className="font-extrabold text-emerald-600 text-2xl">
                                {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-3">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome e Sobrenome <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors(prev => ({ ...prev, name: false }));
                        }}
                        className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${
                        errors.name 
                            ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' 
                            : 'border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                        }`}
                        placeholder="Ex: Maria Silva"
                    />
                    </div>
                    
                    {fulfillmentType === 'delivery' ? (
                        // DELIVERY FORM
                        <>
                            {/* CEP Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CEP <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            type="text" 
                                            value={cep}
                                            onChange={handleCepChange}
                                            onBlur={handleCepBlur}
                                            maxLength={9}
                                            className={`w-full px-3 py-2 pl-3 border rounded-lg outline-none transition-all ${
                                            errors.cep
                                                ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' 
                                                : 'border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                                            }`}
                                            placeholder="00000-000"
                                        />
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={handleCepBlur}
                                        disabled={isLoadingCep || cep.length < 9}
                                        className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-200 disabled:opacity-50 transition-colors"
                                    >
                                        {isLoadingCep ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                                    </button>
                                </div>
                                {errors.cep && <span className="text-xs text-red-500 mt-1">CEP inválido ou não encontrado.</span>}
                                <p className="text-[10px] text-gray-400 mt-1">Digite o CEP para buscar o endereço e calcular a taxa.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro (Identificado) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select 
                                            value={selectedNeighborhood}
                                            onChange={handleNeighborhoodChange}
                                            className={`w-full pl-10 pr-3 py-2 border rounded-lg outline-none transition-all appearance-none bg-white ${
                                            errors.neighborhood
                                                ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' 
                                                : 'border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                                            }`}
                                        >
                                            <option value="">Aguardando seleção automática...</option>
                                            {DELIVERY_ZONES.map((zone) => (
                                                <optgroup key={zone.label} label={zone.label}>
                                                    {zone.neighborhoods.sort().map(nb => (
                                                        <option key={nb} value={nb}>{nb} (+ R$ {zone.price.toFixed(2)})</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="sm:col-span-2 flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rua <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg outline-none transition-all bg-gray-50 ${
                                            errors.address
                                                ? 'border-red-500' 
                                                : 'border-gray-300 focus:ring-2 focus:ring-emerald-500'
                                            }`}
                                            placeholder="Nome da Rua"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Número <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            value={number}
                                            onChange={(e) => {
                                                setNumber(e.target.value);
                                                if(errors.number) setErrors(prev => ({...prev, number: false}));
                                            }}
                                            className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${
                                                errors.number ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-emerald-500'
                                            }`}
                                            placeholder="Nº"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        // PICKUP INFO
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 space-y-3 animate-fade-in">
                            <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                                <Store size={18} />
                                Local de Retirada
                            </h3>
                            <p className="text-sm text-emerald-900">
                                <b>PratoFit</b><br/>
                                {PICKUP_INFO.address}<br/>
                                {PICKUP_INFO.city}
                            </p>
                            <p className="text-xs text-emerald-700 border-t border-emerald-200 pt-2">
                                {PICKUP_INFO.hours}
                            </p>
                            <a 
                                href={PICKUP_INFO.mapsLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-emerald-600 underline hover:text-emerald-800 flex items-center gap-1"
                            >
                                <MapPin size={12} /> Ver no Google Maps
                            </a>

                            {/* Pickup Time Input */}
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-emerald-900 mb-1">Horário Previsto para Retirada <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="time"
                                        value={pickupTime}
                                        onChange={(e) => {
                                            setPickupTime(e.target.value);
                                            if(errors.pickupTime) setErrors(prev => ({...prev, pickupTime: false}));
                                        }}
                                        className={`w-full pl-10 pr-3 py-2 border rounded-lg outline-none transition-all bg-white ${
                                            errors.pickupTime
                                                ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' 
                                                : 'border-emerald-200 focus:ring-2 focus:ring-emerald-500'
                                            }`}
                                    />
                                </div>
                                {errors.pickupTime && <span className="text-xs text-red-500">Informe o horário da retirada.</span>}
                            </div>
                        </div>
                    )}
                    
                    {/* Payment Method */}
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMethod('pix')}
                                className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                    paymentMethod === 'pix'
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-emerald-300'
                                }`}
                            >
                                <div className="text-2xl">💠</div>
                                <span className="text-sm font-medium">PIX (Gerar Código)</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('link')}
                                className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                    paymentMethod === 'link'
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-emerald-300'
                                }`}
                            >
                                <CreditCard size={24} />
                                <span className="text-sm font-medium">Link de Pagamento</span>
                            </button>
                        </div>
                    </div>

                    {/* Obs */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações (Opcional)</label>
                        <textarea 
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                            placeholder="Ex: Tocar a campainha, retirar cebola, etc."
                            rows={2}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex-shrink-0">
                    <button 
                        onClick={handlePrepareOrder}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                        {paymentMethod === 'pix' ? (
                             <>
                                <QrCode size={20} />
                                Gerar PIX e Finalizar
                             </>
                        ) : (
                            <>
                                <MessageCircle size={20} />
                                Enviar Pedido no WhatsApp
                            </>
                        )}
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};
