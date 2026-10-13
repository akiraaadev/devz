export type UserRole = 'admin' | 'merchant';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  plan_tier: PlanTier;
  establishment_id?: string;
  created_at: string;
}

export interface Establishment {
  id: string;
  user_id: string;
  name: string;
  owner_name: string;
  document: string; // CPF ou CNPJ
  document_type: 'cpf' | 'cnpj';
  phone: string;
  whatsapp: string;
  email: string;
  logo_url: string;
  primary_pix_key_id?: string;
  city: string;
  address: string;
  slug: string; // ex: 'farmacia-do-carro'
  // Customizações de marca
  primary_color: string; // default #00B8A9
  secondary_color: string; // default #7137E8
  background_image_url?: string;
  welcome_message?: string;
  // Domínio personalizado para links Pix
  custom_domain?: string; // ex: 'www.dominio.com' ou 'pix.farmaciadocarro.com.br'
  custom_domain_status?: 'active' | 'pending' | 'unverified';
  custom_domain_ssl?: boolean;
  custom_domain_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export interface PixKey {
  id: string;
  establishment_id: string;
  key_type: PixKeyType;
  key_value: string;
  label: string; // ex: 'Banco Inter - Principal'
  is_active: boolean;
  created_at: string;
}

export interface PaymentLink {
  id: string;
  establishment_id: string;
  pix_key_id: string;
  slug: string; // link personalizado, e.g. 'farmacia-do-carro' ou 'balcao-1'
  title: string;
  description?: string;
  amount: number | null; // null = valor livre
  is_active: boolean;
  visits_count: number;
  txid?: string;
  created_at: string;
  updated_at: string;
}

export interface NFCTag {
  id: string;
  tag_code: string; // identificador único impresso na plaquinha, ex: 'NFC-CARRO-01'
  establishment_id: string;
  payment_link_id: string;
  label: string; // ex: 'Plaquinha Balcão Caixa 1'
  status: 'active' | 'inactive';
  taps_count: number;
  last_tap_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PageVisit {
  id: string;
  establishment_id: string;
  payment_link_id?: string;
  nfc_tag_id?: string;
  source: 'direct_link' | 'nfc_tap' | 'qr_scan';
  timestamp: string;
  date_str: string; // YYYY-MM-DD
}

export type PlanTier = 'gratuito' | 'essencial' | 'profissional' | 'empresarial';

export interface PlanDefinition {
  id: PlanTier;
  name: string;
  price_monthly: number;
  target_audience: string;
  max_links: number; // -1 = ilimitado
  max_establishments: number;
  custom_branding: boolean;
  nfc_management: boolean;
  advanced_analytics: boolean;
  features: string[];
}
