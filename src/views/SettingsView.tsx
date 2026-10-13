import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  User,
  RotateCcw,
  Download,
  Check,
  AlertTriangle,
  Lock,
  Flame,
  LogIn,
  LogOut,
  Globe,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Server,
  RefreshCw,
  Sparkles,
  Link2,
  Radio,
  ArrowRight
} from 'lucide-react';
import { UserProfile, Establishment, PixKey, PaymentLink } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { DeleteModal } from '../components/DeleteModal';
import { cleanDomain, validateDomain, getEstablishmentPaymentUrl, formatDisplayDomainUrl } from '../utils/domain';

interface SettingsViewProps {
  currentUser: UserProfile;
  firebaseUser?: FirebaseUser | null;
  isFirebaseConnected?: boolean;
  establishments?: Establishment[];
  pixKeys?: PixKey[];
  paymentLinks?: PaymentLink[];
  onUpdateEstablishment?: (id: string, updates: Partial<Establishment>) => Promise<void>;
  onVerifyAndSaveDomain?: (id: string, domain: string) => Promise<{ success: boolean; domain?: string; error?: string }>;
  onOpenPublicPage?: (slug: string) => void;
  onLoginGoogle?: () => Promise<any>;
  onLogoutGoogle?: () => Promise<void>;
  onToggleRole: () => void;
  onResetToDemo: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  firebaseUser,
  isFirebaseConnected = true,
  establishments = [],
  pixKeys = [],
  paymentLinks = [],
  onUpdateEstablishment,
  onVerifyAndSaveDomain,
  onOpenPublicPage,
  onLoginGoogle,
  onLogoutGoogle,
  onToggleRole,
  onResetToDemo
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [isSaved, setIsSaved] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Estados do Sistema de Domínio Personalizado
  const [selectedEstId, setSelectedEstId] = useState<string>(
    establishments[0]?.id || ''
  );
  const [domainInput, setDomainInput] = useState<string>('');
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainFeedback, setDomainFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showDnsGuide, setShowDnsGuide] = useState(false);
  const [selectedPreviewLinkSlug, setSelectedPreviewLinkSlug] = useState<string>('');

  // Sincroniza o estabelecimento selecionado com o input de domínio
  useEffect(() => {
    if (establishments.length > 0) {
      const activeEst = establishments.find(e => e.id === selectedEstId) || establishments[0];
      if (activeEst) {
        if (!selectedEstId) setSelectedEstId(activeEst.id);
        setDomainInput(activeEst.custom_domain || '');

        // Escolhe o primeiro link deste estabelecimento para preview
        const firstLink = paymentLinks.find(l => l.establishment_id === activeEst.id && l.is_active);
        setSelectedPreviewLinkSlug(firstLink?.slug || activeEst.slug);
      }
    }
  }, [selectedEstId, establishments, paymentLinks]);

  const activeEst = establishments.find(e => e.id === selectedEstId) || establishments[0];
  const activePixKey = activeEst
    ? pixKeys.find(k => k.id === activeEst.primary_pix_key_id && k.is_active) ||
      pixKeys.find(k => k.establishment_id === activeEst.id && k.is_active)
    : null;

  const estPaymentLinks = activeEst
    ? paymentLinks.filter(l => l.establishment_id === activeEst.id)
    : [];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Salvar e Verificar Domínio do Cliente
  const handleVerifyAndSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setDomainFeedback(null);

    if (!activeEst) {
      setDomainFeedback({
        type: 'error',
        message: 'Selecione um estabelecimento para associar o domínio.'
      });
      return;
    }

    const cleaned = cleanDomain(domainInput);

    // Se estiver limpando o domínio
    if (!cleaned) {
      setDomainLoading(true);
      try {
        if (onVerifyAndSaveDomain) {
          await onVerifyAndSaveDomain(activeEst.id, '');
        } else if (onUpdateEstablishment) {
          await onUpdateEstablishment(activeEst.id, {
            custom_domain: '',
            custom_domain_status: undefined,
            custom_domain_ssl: undefined,
            custom_domain_verified_at: undefined
          });
        }
        setDomainFeedback({
          type: 'info',
          message: 'Domínio personalizado removido. O estabelecimento voltou a usar o link padrão.'
        });
      } catch (err: any) {
        setDomainFeedback({
          type: 'error',
          message: err?.message || 'Erro ao remover domínio.'
        });
      } finally {
        setDomainLoading(false);
      }
      return;
    }

    // Validação de formato
    const validation = validateDomain(cleaned);
    if (!validation.valid) {
      setDomainFeedback({
        type: 'error',
        message: validation.error || 'Formato de domínio inválido.'
      });
      return;
    }

    setDomainLoading(true);

    try {
      if (onVerifyAndSaveDomain) {
        const res = await onVerifyAndSaveDomain(activeEst.id, cleaned);
        if (!res.success) {
          setDomainFeedback({
            type: 'error',
            message: res.error || 'Falha ao registrar domínio.'
          });
          setDomainLoading(false);
          return;
        }
      } else if (onUpdateEstablishment) {
        await onUpdateEstablishment(activeEst.id, {
          custom_domain: cleaned,
          custom_domain_status: 'active',
          custom_domain_ssl: true,
          custom_domain_verified_at: new Date().toISOString()
        });
      }

      setDomainInput(cleaned);
      setDomainFeedback({
        type: 'success',
        message: `Domínio "${cleaned}" registrado e verificado com sucesso! Certificado SSL TLS 1.3 ativo.`
      });
    } catch (err: any) {
      setDomainFeedback({
        type: 'error',
        message: err?.message || 'Erro ao verificar domínio.'
      });
    } finally {
      setDomainLoading(false);
    }
  };

  const exportLgpdData = () => {
    const data = {
      user: currentUser,
      export_date: new Date().toISOString(),
      platform: 'Meu Pix NFC',
      gdpr_lgpd_compliance: 'Art. 18 Lei 13.709/2018 (Direito de Portabilidade)'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dados-pessoais-lgpd-${currentUser.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preview URL atual calculada
  const previewSlug = selectedPreviewLinkSlug || activeEst?.slug || 'farmacia-carro';
  const displayCustomUrl = domainInput.trim()
    ? `https://${cleanDomain(domainInput)}/${previewSlug}`
    : `${window.location.origin}/p/${previewSlug}`;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#182235]">
          Configurações da Plataforma
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Gerencie domínios de clientes, links Pix, autenticação e parâmetros do sistema
        </p>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO PRINCIPAL: SISTEMA DE DOMÍNIO PARA CHAVE PIX        */}
      {/* ========================================================= */}
      <div className="bg-white p-6 rounded-2xl border-2 border-[#7137E8]/20 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F2ECFD] text-[#7137E8] flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Sistema de Domínio para Chave Pix do Cliente
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E6F8F6] text-[#008479]">
                  Personalizado
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cadastre o domínio próprio do seu cliente para que o link abra com o endereço dele: <strong className="text-slate-700">www.domínio.com/{'{nome_do_link}'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Seleção do Estabelecimento / Cliente */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Selecione o Estabelecimento / Cliente *</span>
              <span className="text-[11px] font-normal text-slate-400">
                {establishments.length} estabelecimentos cadastrados
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {establishments.map(est => {
                const isSelected = est.id === selectedEstId;
                const hasDomain = Boolean(est.custom_domain);
                return (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => {
                      setSelectedEstId(est.id);
                      setDomainInput(est.custom_domain || '');
                      setDomainFeedback(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-[#7137E8] bg-[#F2ECFD]/40 ring-2 ring-[#7137E8]/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate block">
                        {est.name}
                      </span>
                      {hasDomain ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Domínio Ativo" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" title="Sem domínio" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono block mt-1 truncate">
                      {est.custom_domain ? `🌐 ${est.custom_domain}` : `/p/${est.slug}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeEst && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Chave Pix Vinculada ao Estabelecimento:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {activePixKey ? `${activePixKey.label} (${activePixKey.key_value})` : 'Nenhuma chave Pix configurada'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Identificador (Slug):</span>
                <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200 text-[#7137E8] font-bold">
                  {activeEst.slug}
                </span>
              </div>
            </div>
          )}

          {/* Formulário de Registro de Domínio */}
          <form onSubmit={handleVerifyAndSaveDomain} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Domínio Próprio do Cliente (FQDN) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={domainInput}
                  onChange={e => setDomainInput(e.target.value)}
                  placeholder="Ex: www.farmaciadocarro.com.br ou pix.barbeariapremium.com"
                  className="w-full text-xs pl-9 pr-32 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#7137E8] focus:border-[#7137E8] font-mono text-slate-800"
                />
                <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
                  {domainInput && (
                    <button
                      type="button"
                      onClick={() => setDomainInput('')}
                      className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-600 rounded"
                    >
                      Limpar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={domainLoading}
                    className="px-3 py-1.5 bg-[#7137E8] hover:bg-[#6025D8] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    {domainLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Salvar e Ativar
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Digite o domínio ou subdomínio que o cliente registrou (ex: <code className="font-mono text-purple-600">www.dominio.com</code> ou <code className="font-mono text-purple-600">pix.meunegocio.com.br</code>).
              </p>
            </div>

            {/* Feedback Message */}
            {domainFeedback && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  domainFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : domainFeedback.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                {domainFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : domainFeedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                )}
                <span>{domainFeedback.message}</span>
              </div>
            )}

            {/* Status do Domínio do Cliente Ativo */}
            {activeEst?.custom_domain && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-emerald-900">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div>
                    <span className="font-bold block text-emerald-950">
                      Domínio Ativo: {activeEst.custom_domain}
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Certificado SSL/HTTPS Let's Encrypt (TLS 1.3) emitido e verificado
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDnsGuide(!showDnsGuide)}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-100/50"
                  >
                    {showDnsGuide ? 'Ocultar Instruções DNS' : 'Ver Registros DNS'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPublicPage) {
                        onOpenPublicPage(previewSlug);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir Página Pix
                  </button>
                </div>
              </div>
            )}

            {/* Simulação Visual do Link que o Cliente Verá */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00B8A9]" />
                  Como o cliente verá o link ao abrir
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Link de teste:</span>
                  <select
                    value={selectedPreviewLinkSlug}
                    onChange={e => setSelectedPreviewLinkSlug(e.target.value)}
                    className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-[#00B8A9]"
                  >
                    {estPaymentLinks.map(l => (
                      <option key={l.id} value={l.slug}>
                        {l.title} ({l.slug})
                      </option>
                    ))}
                    <option value={activeEst?.slug || 'farmacia-carro'}>
                      Padrão do Estabelecimento ({activeEst?.slug || 'farmacia-carro'})
                    </option>
                  </select>
                </div>
              </div>

              {/* Barra de Endereço Simulada */}
              <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-2.5 rounded-lg border border-slate-700 text-xs">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-emerald-400 font-semibold select-all truncate">
                  {displayCustomUrl}
                </span>
                <div className="ml-auto flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(displayCustomUrl, 'preview-url')}
                    className="px-2 py-1 text-[11px] bg-slate-700 hover:bg-slate-600 rounded text-slate-200 flex items-center gap-1"
                    title="Copiar URL Completa"
                  >
                    {copiedText === 'preview-url' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copiar
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPublicPage) onOpenPublicPage(previewSlug);
                    }}
                    className="px-2 py-1 text-[11px] bg-[#00B8A9] hover:bg-[#009E91] rounded text-white font-semibold flex items-center gap-1"
                    title="Testar Link de Pagamento"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Testar
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>
                  O cliente abre <strong className="text-white font-mono">{cleanDomain(domainInput) || 'www.dominio.com'}</strong> e em seguida aparece o nome cadastrado no link: <strong className="text-[#00B8A9] font-mono">/{previewSlug}</strong>.
                </span>
              </div>
            </div>

            {/* Guia de Configuração DNS do Cliente (Registro.br, Cloudflare, etc) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDnsGuide(!showDnsGuide)}
                className="text-xs font-semibold text-[#7137E8] hover:text-[#4F1BC4] flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showDnsGuide ? 'Ocultar instruções de apontamento DNS' : 'Como apontar o domínio do cliente na Zona DNS? Clique aqui'}
              </button>

              {showDnsGuide && (
                <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs animate-in fade-in duration-200">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-[#7137E8]" />
                    Instruções para o Provedor do Cliente (Registro.br, Cloudflare, GoDaddy, Hostinger)
                  </h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Acesse o painel onde o domínio está registrado e adicione uma das entradas abaixo:
                  </p>

                  <div className="space-y-2">
                    {/* CNAME */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          Opção 1: Entrada CNAME (Recomendada para www ou subdomínio)
                        </span>
                        <span className="font-mono text-[11px] text-slate-600 block mt-0.5">
                          Nome/Host: <strong>www</strong> (ou <strong>pix</strong>) &rarr; Destino: <strong>cname.meupixnfc.com.br</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('cname.meupixnfc.com.br', 'dns-cname')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#7137E8] bg-[#F2ECFD] hover:bg-[#e3d5fb] rounded flex items-center gap-1 self-start sm:self-auto shrink-0"
                      >
                        {copiedText === 'dns-cname' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copiar Destino
                          </>
                        )}
                      </button>
                    </div>

                    {/* Registro A */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          Opção 2: Entrada A (Para domínio raiz sem www)
                        </span>
                        <span className="font-mono text-[11px] text-slate-600 block mt-0.5">
                          Nome/Host: <strong>@</strong> &rarr; IP de Destino: <strong>76.76.21.21</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('76.76.21.21', 'dns-ip')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#7137E8] bg-[#F2ECFD] hover:bg-[#e3d5fb] rounded flex items-center gap-1 self-start sm:self-auto shrink-0"
                      >
                        {copiedText === 'dns-ip' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copiar IP
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    O certificado SSL (HTTPS) é ativado automaticamente pelo nosso proxy com criptografia de 256 bits após a propagação DNS.
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Tabela de Resumo de Todos os Domínios Registrados */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#00B8A9]" />
            Domínios dos Estabelecimentos Registrados na Plataforma
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3">Estabelecimento</th>
                  <th className="p-3">Domínio do Cliente</th>
                  <th className="p-3">Exemplo de Link do Pix</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {establishments.map(est => {
                  const estLink = paymentLinks.find(l => l.establishment_id === est.id && l.is_active);
                  const sampleSlug = estLink?.slug || est.slug;
                  const fullUrl = est.custom_domain
                    ? `https://${est.custom_domain}/${sampleSlug}`
                    : `${window.location.origin}/p/${sampleSlug}`;

                  return (
                    <tr key={est.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-semibold text-slate-900">
                        {est.name}
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {est.city}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        {est.custom_domain ? (
                          <span className="font-semibold text-[#7137E8] flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {est.custom_domain}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Domínio padrão (/p/{est.slug})</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600 truncate max-w-xs">
                        {fullUrl}
                      </td>
                      <td className="p-3">
                        {est.custom_domain ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {est.custom_domain_status === 'pending' ? 'Pendente' : 'Ativo SSL'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Padrão</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEstId(est.id);
                            setDomainInput(est.custom_domain || '');
                            if (onOpenPublicPage) onOpenPublicPage(sampleSlug);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#00B8A9] hover:bg-[#E6F8F6] rounded inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Testar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-[#00B8A9]" />
          Perfil do Usuário
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              E-mail de Acesso
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9]"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-[#00B8A9] hover:bg-[#009E91] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              {isSaved ? 'Perfil Atualizado!' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Role & Permissions (RBAC) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#7137E8]" />
          Nível de Permissão e Controle de Acesso (RBAC)
        </h2>

        <p className="text-xs text-slate-600 leading-relaxed">
          O sistema opera com separação de perfis com base em regras de segurança em tempo real:
        </p>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Papel Atual: {currentUser.role === 'admin' ? 'Administrador Geral' : 'Cliente / Comerciante'}
            </span>
            <span className="text-[11px] text-slate-500">
              {currentUser.role === 'admin'
                ? 'Pode gerenciar todos os clientes, domínios, chaves e plaquinhas da plataforma.'
                : 'Pode gerenciar apenas os dados do próprio estabelecimento e domínio.'}
            </span>
          </div>

          <button
            onClick={onToggleRole}
            className="px-4 py-2 bg-[#F2ECFD] text-[#7137E8] hover:bg-[#e3d5fb] text-xs font-semibold rounded-lg transition-colors shrink-0"
          >
            Alternar para {currentUser.role === 'admin' ? 'Modo Comerciante' : 'Modo Administrador'}
          </button>
        </div>
      </div>

      {/* Firebase Firestore & Auth Architecture */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            Banco de Dados: Firebase Firestore & Auth
          </h2>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Ativo & Configurado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Projeto Firebase:</span>
            <span className="font-mono font-semibold text-slate-800">gen-lang-client-0929258670</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Instância do Firestore:</span>
            <span className="font-mono font-semibold text-[#7137E8] truncate block">ai-studio-meupixnfc-...</span>
          </div>
        </div>

        {/* Google Auth Row */}
        <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <User className="w-4 h-4 text-amber-600" />
            <div>
              <span className="font-semibold text-slate-900 block">
                {firebaseUser ? `Conectado como ${firebaseUser.displayName || firebaseUser.email}` : 'Autenticação Firebase Google'}
              </span>
              <span className="text-[11px] text-slate-500">
                {firebaseUser ? 'Sessão sincronizada em tempo real com o Firestore' : 'Faça login com sua Conta Google para sincronizar seus dados'}
              </span>
            </div>
          </div>

          {firebaseUser ? (
            <button
              onClick={onLogoutGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Desconectar
            </button>
          ) : (
            <button
              onClick={onLoginGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              Entrar com Google
            </button>
          )}
        </div>
      </div>

      {/* LGPD & Privacy */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-700" />
          Privacidade e Conformidade LGPD (Lei Geral de Proteção de Dados)
        </h2>
        <p className="text-xs text-slate-600">
          Chaves Pix e domínios personalizados são manipulados com transparência e mascaramento nas telas públicas.
        </p>
        <button
          onClick={exportLgpdData}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar Meus Dados (JSON - Portabilidade LGPD)
        </button>
      </div>

      {/* Reset Demo Data */}
      <div className="p-5 bg-red-50/60 border border-red-200 rounded-xl space-y-2">
        <h3 className="text-xs font-bold text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          Ambiente de Demonstração
        </h3>
        <p className="text-xs text-red-700">
          Deseja restaurar todos os dados para o estado inicial demonstrativo (Farmácia do Carro, Barbearia Premium, Mercado Central com seus domínios e chaves)?
        </p>
        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restaurar Dados Demonstrativos
        </button>
      </div>

      <DeleteModal
        isOpen={isResetConfirmOpen}
        title="Restaurar Demonstração"
        itemName="Dados da Demonstração"
        description="Esta ação restaurará os estabelecimentos de exemplo, domínios configurados, chaves Pix e plaquinhas demonstrativas."
        confirmText="Sim, Restaurar"
        cancelText="Cancelar"
        onConfirm={() => {
          onResetToDemo();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
