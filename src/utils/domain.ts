import { Establishment, PaymentLink } from '../types';

/**
 * Limpa e normaliza um domínio inserido pelo usuário.
 * Remove http://, https://, barras finais, espaços e caminhos adicionais.
 * Exemplo: "https://www.farmaciadocarro.com.br/algo" -> "www.farmaciadocarro.com.br"
 */
export function cleanDomain(input: string): string {
  if (!input) return '';
  let cleaned = input.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split('?')[0];
  cleaned = cleaned.split('#')[0];
  return cleaned.trim();
}

/**
 * Valida a sintaxe de um domínio ou subdomínio FQDN.
 */
export function validateDomain(domain: string): { valid: boolean; error?: string } {
  const cleaned = cleanDomain(domain);
  if (!cleaned) {
    return { valid: false, error: 'O domínio não pode estar vazio.' };
  }

  if (cleaned.length < 4 || cleaned.length > 253) {
    return { valid: false, error: 'Tamanho de domínio inválido.' };
  }

  // Não pode conter espaços ou caracteres inválidos
  if (/\s/.test(cleaned)) {
    return { valid: false, error: 'O domínio não pode conter espaços.' };
  }

  // Deve ter pelo menos um ponto
  if (!cleaned.includes('.')) {
    return { valid: false, error: 'O domínio deve conter ao menos uma extensão (ex: .com ou .com.br).' };
  }

  // Regex para FQDN válido (inclui suporte a caracteres comuns em domínios)
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
  if (!domainRegex.test(cleaned)) {
    return { valid: false, error: 'Formato de domínio inválido. Use um formato como www.dominio.com ou pix.dominio.com.br.' };
  }

  return { valid: true };
}

/**
 * Retorna a URL pública completa para pagamento do estabelecimento/link.
 * Se houver domínio personalizado cadastrado, utiliza https://{custom_domain}/{slug}.
 * Caso contrário, utiliza o domínio padrão da aplicação: {origin}/p/{slug}.
 */
export function getEstablishmentPaymentUrl(
  establishment?: Establishment | null,
  linkSlug?: string,
  origin?: string
): string {
  const currentOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const targetSlug = linkSlug || establishment?.slug || '';

  if (establishment?.custom_domain && establishment.custom_domain.trim().length > 0) {
    const domain = cleanDomain(establishment.custom_domain);
    return `https://${domain}/${targetSlug}`;
  }

  return `${currentOrigin}/p/${targetSlug}`;
}

/**
 * Retorna o formato de exibição amigável do link.
 * Ex: "www.dominio.com/farmacia-carro" ou "app.meupixnfc.com/p/farmacia-carro"
 */
export function formatDisplayDomainUrl(
  customDomain?: string,
  slug?: string,
  host?: string
): string {
  const cleanSlug = slug || '';
  if (customDomain && customDomain.trim().length > 0) {
    const domain = cleanDomain(customDomain);
    return `${domain}/${cleanSlug}`;
  }

  const currentHost = host || (typeof window !== 'undefined' ? window.location.host : 'meupixnfc.com.br');
  return `${currentHost}/p/${cleanSlug}`;
}
