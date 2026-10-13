/**
 * Módulo de geração de Payload BR Code (Pix Estático)
 * Em conformidade com o padrão EMVCo e as especificações do Banco Central do Brasil.
 */

// Normaliza texto removendo acentos e caracteres especiais não permitidos
export function sanitizePixText(text: string, maxLength: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .replace(/[^A-Za-z0-9 ]/g, '') // permite apenas letras, números e espaços
    .trim()
    .toUpperCase()
    .substring(0, maxLength);
}

// Formata cada campo no padrão Tag-Length-Value (TLV)
export function formatTLV(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

/**
 * Cálculo oficial do CRC16-CCITT (Polinômio 0x1021, valor inicial 0xFFFF)
 */
export function calculateCRC16(payload: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadParams {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount?: number | null; // Opcional no Pix estático (se null ou <= 0, valor livre)
  txid?: string; // Opcional, padrão '***'
  description?: string; // Informação adicional opcional (máx 40 caracteres)
}

/**
 * Gera o código Pix Copia e Cola (BR Code)
 */
export function generatePixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txid = '***',
  description = ''
}: PixPayloadParams): string {
  // Limpeza e saneamento
  const cleanKey = pixKey.trim();
  const cleanName = sanitizePixText(merchantName || 'ESTABELECIMENTO', 25) || 'ESTABELECIMENTO';
  const cleanCity = sanitizePixText(merchantCity || 'BRASIL', 15) || 'BRASIL';
  const cleanTxid = (txid ? txid.replace(/[^A-Za-z0-9]/g, '').substring(0, 25) : '') || '***';
  const cleanDesc = description ? sanitizePixText(description, 40) : '';

  // 00 - Payload Format Indicator (01)
  const formatIndicator = formatTLV('00', '01');

  // 01 - Point of Initiation Method: 11 para estático reutilizável, 12 para único
  // Padrão do BCB para Pix estático com valor: 12 ou 11
  const pointOfInitiation = formatTLV('01', amount && amount > 0 ? '12' : '11');

  // 26 - Merchant Account Information - Pix
  // Subcampos:
  // 00: GUI (br.gov.bcb.pix)
  // 01: Chave Pix
  // 02: Descrição (opcional)
  let merchantAccountInfo = formatTLV('00', 'br.gov.bcb.pix') + formatTLV('01', cleanKey);
  if (cleanDesc) {
    merchantAccountInfo += formatTLV('02', cleanDesc);
  }
  const merchantAccountTLV = formatTLV('26', merchantAccountInfo);

  // 52 - Merchant Category Code (0000 para geral)
  const merchantCategoryCode = formatTLV('52', '0000');

  // 53 - Transaction Currency (986 = Real Brasileiro ISO 4217)
  const transactionCurrency = formatTLV('53', '986');

  // 54 - Transaction Amount (opcional, só inclui se for > 0)
  let transactionAmount = '';
  if (amount && Number(amount) > 0) {
    const formattedAmount = Number(amount).toFixed(2);
    transactionAmount = formatTLV('54', formattedAmount);
  }

  // 58 - Country Code (BR)
  const countryCode = formatTLV('58', 'BR');

  // 59 - Merchant Name (máx 25)
  const merchantNameTLV = formatTLV('59', cleanName);

  // 60 - Merchant City (máx 15)
  const merchantCityTLV = formatTLV('60', cleanCity);

  // 62 - Additional Data Field Template
  // Subcampo 05: Reference Label / txid (máx 25 caracteres, default '***')
  const additionalDataField = formatTLV('05', cleanTxid);
  const additionalDataTLV = formatTLV('62', additionalDataField);

  // 63 - CRC16 (Tag + tamanho fixo 04)
  const partialPayload = `${formatIndicator}${pointOfInitiation}${merchantAccountTLV}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantNameTLV}${merchantCityTLV}${additionalDataTLV}6304`;

  // Calcula o checksum CRC16
  const crc = calculateCRC16(partialPayload);

  return `${partialPayload}${crc}`;
}

/**
 * Validação rigorosa dos tipos de chave Pix
 */
export function validatePixKey(key: string, type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'): { valid: boolean; error?: string } {
  const clean = key.trim();
  if (!clean) {
    return { valid: false, error: 'Chave Pix não pode ser vazia.' };
  }

  switch (type) {
    case 'cpf': {
      const numbers = clean.replace(/\D/g, '');
      if (numbers.length !== 11) return { valid: false, error: 'CPF deve conter 11 dígitos numéricos.' };
      if (/^(\d)\1{10}$/.test(numbers)) return { valid: false, error: 'CPF inválido.' };
      
      // Validação dos dígitos verificadores
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += parseInt(numbers[i]) * (10 - i);
      let rest = (sum * 10) % 11;
      if (rest === 10 || rest === 11) rest = 0;
      if (rest !== parseInt(numbers[9])) return { valid: false, error: 'CPF inválido.' };

      sum = 0;
      for (let i = 0; i < 10; i++) sum += parseInt(numbers[i]) * (11 - i);
      rest = (sum * 10) % 11;
      if (rest === 10 || rest === 11) rest = 0;
      if (rest !== parseInt(numbers[10])) return { valid: false, error: 'CPF inválido.' };

      return { valid: true };
    }
    case 'cnpj': {
      const numbers = clean.replace(/\D/g, '');
      if (numbers.length !== 14) return { valid: false, error: 'CNPJ deve conter 14 dígitos numéricos.' };
      if (/^(\d)\1{13}$/.test(numbers)) return { valid: false, error: 'CNPJ inválido.' };

      // Validação dígitos CNPJ
      let length = numbers.length - 2;
      let digits = numbers.substring(0, length);
      const digitVerifiers = numbers.substring(length);
      let sum = 0;
      let pos = length - 7;
      for (let i = length; i >= 1; i--) {
        sum += parseInt(digits.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result !== parseInt(digitVerifiers.charAt(0))) return { valid: false, error: 'CNPJ inválido.' };

      length = length + 1;
      digits = numbers.substring(0, length);
      sum = 0;
      pos = length - 7;
      for (let i = length; i >= 1; i--) {
        sum += parseInt(digits.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result !== parseInt(digitVerifiers.charAt(1))) return { valid: false, error: 'CNPJ inválido.' };

      return { valid: true };
    }
    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clean)) return { valid: false, error: 'Formato de e-mail inválido.' };
      return { valid: true };
    }
    case 'phone': {
      // Ex: +5511999999999 ou 11999999999
      const digits = clean.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 13) {
        return { valid: false, error: 'Telefone deve ter DDD + número (ex: 11988887777 ou +5511988887777).' };
      }
      return { valid: true };
    }
    case 'random': {
      // UUID v4 format: 32 hex chars with hyphens (8-4-4-4-12)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(clean)) {
        return { valid: false, error: 'Chave aleatória EVP deve ser um UUID válido (ex: 123e4567-e89b-12d3-a456-426614174000).' };
      }
      return { valid: true };
    }
    default:
      return { valid: true };
  }
}

/**
 * Máscara amigável e segura para exibição pública de chaves Pix
 */
export function maskPixKey(key: string, type: string): string {
  if (!key) return '';
  switch (type) {
    case 'cpf': {
      const d = key.replace(/\D/g, '');
      if (d.length === 11) return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
      return key.slice(0, 3) + '***' + key.slice(-2);
    }
    case 'cnpj': {
      const d = key.replace(/\D/g, '');
      if (d.length === 14) return `${d.slice(0, 2)}.***.***/${d.slice(8, 12)}-**`;
      return key.slice(0, 4) + '***' + key.slice(-2);
    }
    case 'email': {
      const parts = key.split('@');
      if (parts.length === 2) {
        const name = parts[0];
        const visible = name.slice(0, Math.min(3, name.length));
        return `${visible}***@${parts[1]}`;
      }
      return key;
    }
    case 'phone': {
      const d = key.replace(/\D/g, '');
      if (d.length >= 10) {
        return `(${d.slice(0, 2)}) *****-${d.slice(-4)}`;
      }
      return key.slice(0, 4) + '***' + key.slice(-2);
    }
    case 'random':
    default: {
      if (key.length > 10) {
        return `${key.slice(0, 6)}...${key.slice(-4)}`;
      }
      return key;
    }
  }
}
