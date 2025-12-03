
/*
  Função utilitária para gerar o Payload do PIX (EMV QRCPS MPM)
  Baseado no padrão do Banco Central do Brasil.
  Isso permite gerar QR Codes estáticos com valor definido sem precisar de backend.
*/

function generateCrc16(payload: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }

  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePixPayload(key: string, name: string, city: string, amount: number, txId: string = '***'): string {
  // Limpar entradas (Remove tudo que não for letra ou número da chave, ideal para CNPJ/CPF)
  const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '');
  const cleanName = name.substring(0, 25).normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Max 25 chars, sem acentos
  const cleanCity = city.substring(0, 15).normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Max 15 chars, sem acentos
  const amountStr = amount.toFixed(2);

  let payload = '';

  // 00 - Payload Format Indicator
  payload += formatField('00', '01');
  
  // 26 - Merchant Account Information
  let merchantAccount = '';
  merchantAccount += formatField('00', 'BR.GOV.BCB.PIX'); // GUI
  merchantAccount += formatField('01', cleanKey); // Chave Pix
  payload += formatField('26', merchantAccount);

  // 52 - Merchant Category Code
  payload += formatField('52', '0000');

  // 53 - Transaction Currency
  payload += formatField('53', '986'); // BRL

  // 54 - Transaction Amount
  payload += formatField('54', amountStr);

  // 58 - Country Code
  payload += formatField('58', 'BR');

  // 59 - Merchant Name
  payload += formatField('59', cleanName);

  // 60 - Merchant City
  payload += formatField('60', cleanCity);

  // 62 - Additional Data Field Template
  let additionalData = '';
  additionalData += formatField('05', txId); // Reference Label (TxID)
  payload += formatField('62', additionalData);

  // 63 - CRC16
  payload += '6304'; // ID + Length do CRC, esperando o calculo
  
  const crc = generateCrc16(payload);
  
  return payload + crc;
}
