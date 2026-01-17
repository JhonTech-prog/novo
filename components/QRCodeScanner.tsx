import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [useManualInput, setUseManualInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Usa câmera traseira no mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setError('Não foi possível acessar a câmera. Use a opção "Colar Link" abaixo.');
      setUseManualInput(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const loadingMsg = '🔍 Processando foto do QR Code...';
    alert(loadingMsg);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        
        // Decodifica QR Code da imagem usando canvas
        const qrCodeData = await decodeQRCodeFromImage(base64Image);
        
        if (qrCodeData) {
          console.log('✅ QR Code detectado:', qrCodeData);
          onScan(qrCodeData);
        } else {
          setError('❌ Não foi possível detectar o QR Code na imagem. Tente tirar uma foto mais nítida ou use a opção "Colar Link".');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      setError('Erro ao processar a imagem. Tente novamente ou use a opção "Colar Link".');
    }
  };

  // Função para decodificar QR Code de uma imagem
  const decodeQRCodeFromImage = (base64Image: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          resolve(null);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Tenta usar API Web (se disponível)
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          barcodeDetector.detect(img)
            .then((barcodes: any[]) => {
              if (barcodes.length > 0) {
                resolve(barcodes[0].rawValue);
              } else {
                // Fallback: tenta API online
                tryOnlineDecoder(base64Image).then(resolve);
              }
            })
            .catch(() => {
              tryOnlineDecoder(base64Image).then(resolve);
            });
        } else {
          // Usa API online como fallback
          tryOnlineDecoder(base64Image).then(resolve);
        }
      };
      img.onerror = () => resolve(null);
      img.src = base64Image;
    });
  };

  // Fallback: API online gratuita para decodificar QR Code
  const tryOnlineDecoder = async (base64Image: string): Promise<string | null> => {
    try {
      // Remove o prefixo data:image/...;base64,
      const base64Data = base64Image.split(',')[1] || base64Image;
      
      // Usa API pública do goqr.me
      const response = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `fileToUpload=data:image/png;base64,${base64Data}`
      });

      const data = await response.json();
      
      if (data && data[0]?.symbol?.[0]?.data) {
        return data[0].symbol[0].data;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao usar API online:', error);
      return null;
    }
  };

  const handleManualSubmit = () => {
    if (manualUrl.trim()) {
      onScan(manualUrl.trim());
    } else {
      alert('Cole o link da nota fiscal');
    }
  };

  const handleCapturePhoto = () => {
    // Implementação futura: capturar frame e processar QR Code
    alert('💡 Dica: Use um app de QR Code no seu celular para ler o código, depois cole o link aqui!');
    setUseManualInput(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden">
        <div className="bg-emerald-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Camera size={24} />
            <h2 className="text-xl font-bold">QR Code do Cupom Fiscal</h2>
          </div>
          <button onClick={onClose} className="hover:bg-emerald-700 p-2 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Upload de Foto do QR Code */}
          <div className="mb-6">
            <label className="block">
              <div className="border-2 border-dashed border-emerald-500 rounded-lg p-8 hover:bg-emerald-50 transition-all cursor-pointer text-center bg-gradient-to-br from-emerald-50 to-white">
                <Upload size={48} className="mx-auto mb-3 text-emerald-600" />
                <h3 className="font-bold text-lg mb-2 text-gray-800">
                  📸 Fazer Upload da Foto do QR Code
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Tire uma foto do QR Code do cupom fiscal e faça upload aqui
                </p>
                <div className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold inline-block hover:bg-emerald-700">
                  Escolher Foto
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Aceita: JPG, PNG, HEIC
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {!useManualInput && !error && stream && (
            <>
              <div className="text-center text-sm text-gray-400 my-6">
                ──── ou use a câmera ao vivo ────
              </div>

              <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ minHeight: '300px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                />
                
                {/* Overlay de mira */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-emerald-500 rounded-lg w-64 h-64 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-gray-600 mb-4">
                📱 Posicione o QR Code do cupom dentro da área marcada
              </p>

              <button
                onClick={handleCapturePhoto}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 mb-2"
              >
                📸 Capturar QR Code
              </button>
            </>
          )}

          {/* Input Manual */}
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-500 my-4">
              ──── ou ────
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-2">
                📋 Cole o link da nota fiscal (NFC-e):
              </label>
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://www.sefaz...?p=..."
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Dica: Use um app de QR Code no celular para ler o código, depois copie e cole o link aqui
              </p>
            </div>

            <button
              onClick={handleManualSubmit}
              disabled={!manualUrl.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              ✅ Processar Nota Fiscal
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mt-4">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
