import React, { useState, useEffect } from 'react';
import {
  Palette,
  Image,
  Sparkles,
  Save,
  Check,
  RefreshCw,
  Eye,
  Store,
  QrCode,
  ShieldCheck,
  Globe,
  Lock
} from 'lucide-react';
import { Establishment } from '../types';
import { cleanDomain, validateDomain, formatDisplayDomainUrl } from '../utils/domain';

interface CustomizationViewProps {
  establishment?: Establishment | null;
  onUpdateEstablishment: (id: string, updates: Partial<Establishment>) => void;
  onOpenPublicPage: (slug: string) => void;
}

export const CustomizationView: React.FC<CustomizationViewProps> = ({
  establishment,
  onUpdateEstablishment,
  onOpenPublicPage
}) => {
  const [primaryColor, setPrimaryColor] = useState(establishment?.primary_color || '#00B8A9');
  const [secondaryColor, setSecondaryColor] = useState(establishment?.secondary_color || '#7137E8');
  const [logoUrl, setLogoUrl] = useState(establishment?.logo_url || '');
  const [welcomeMessage, setWelcomeMessage] = useState(
    establishment?.welcome_message || 'Aproxime seu celular e pague rapidamente via Pix'
  );
  const [bgImageUrl, setBgImageUrl] = useState(establishment?.background_image_url || '');
  const [customDomain, setCustomDomain] = useState(establishment?.custom_domain || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (establishment) {
      setPrimaryColor(establishment.primary_color || '#00B8A9');
      setSecondaryColor(establishment.secondary_color || '#7137E8');
      setLogoUrl(establishment.logo_url || '');
      setWelcomeMessage(
        establishment.welcome_message || 'Aproxime seu celular e pague rapidamente via Pix'
      );
      setBgImageUrl(establishment.background_image_url || '');
      setCustomDomain(establishment.custom_domain || '');
    }
  }, [establishment]);

  const presetPalettes = [
    { name: 'Turquesa & Roxo (Padrão)', primary: '#00B8A9', secondary: '#7137E8' },
    { name: 'Roxo & Turquesa', primary: '#7137E8', secondary: '#00B8A9' },
    { name: 'Azul Financeiro & Verde', primary: '#1D4ED8', secondary: '#059669' },
    { name: 'Dark Slate & Turquesa', primary: '#182235', secondary: '#00B8A9' },
    { name: 'Esmeralda & Âmbar', primary: '#059669', secondary: '#D97706' },
  ];

  const handleSave = () => {
    if (!establishment) return;
    const cleanDom = customDomain.trim() ? cleanDomain(customDomain) : undefined;
    onUpdateEstablishment(establishment.id, {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      logo_url: logoUrl.trim(),
      welcome_message: welcomeMessage.trim(),
      background_image_url: bgImageUrl.trim(),
      custom_domain: cleanDom,
      custom_domain_status: cleanDom ? 'active' : undefined,
      custom_domain_ssl: cleanDom ? true : undefined,
      custom_domain_verified_at: cleanDom ? new Date().toISOString() : undefined
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  if (!establishment) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Nenhum estabelecimento ativo</h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Cadastre ou selecione um estabelecimento para personalizar suas cores e logotipo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#182235]">
            Personalização da Página de Pagamento
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Personalize a identidade visual e mensagem para os clientes de <span className="font-semibold text-slate-700">{establishment.name}</span>
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00B8A9] hover:bg-[#009E91] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              Personalização Salva!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor Controls */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#00B8A9]" />
              Identidade Visual da Página
            </h2>
            <span className="text-[11px] text-slate-400">Tempo real</span>
          </div>

          {/* Paletas Rápidas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Paletas Recomendadas
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presetPalettes.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrimaryColor(p.primary);
                    setSecondaryColor(p.secondary);
                  }}
                  className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10"
                      style={{ backgroundColor: p.primary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10"
                      style={{ backgroundColor: p.secondary }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-700 truncate">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cor Principal (Destaque & Botões)
              </label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-2 bg-slate-50">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded border-0 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-full text-xs font-mono font-semibold uppercase bg-transparent focus:outline-hidden text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cor Secundária (Acentos & Gradiente)
              </label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-2 bg-slate-50">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded border-0 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="w-full text-xs font-mono font-semibold uppercase bg-transparent focus:outline-hidden text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Logotipo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL do Logotipo da Loja
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              placeholder="https://exemplo.com/logo.png"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Recomendado: imagem quadrada (1:1) com fundo transparente ou branco.
            </p>
          </div>

          {/* Mensagem de boas-vindas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mensagem de Boas-Vindas aos Clientes
            </label>
            <textarea
              rows={2}
              value={welcomeMessage}
              onChange={e => setWelcomeMessage(e.target.value)}
              placeholder="Ex: Aproxime seu celular e faça o pagamento rápido via Pix."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] resize-none"
            />
          </div>

          {/* Imagem de Fundo (opcional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL de Imagem de Fundo Suave (opcional)
            </label>
            <input
              type="url"
              value={bgImageUrl}
              onChange={e => setBgImageUrl(e.target.value)}
              placeholder="https://exemplo.com/fundo-textura.jpg"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9]"
            />
          </div>

          {/* Domínio Próprio */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#7137E8]" />
                Domínio Próprio da Loja (Opcional)
              </span>
              <span className="text-[11px] text-[#7137E8] font-medium">
                ex: www.farmaciadocarro.com.br
              </span>
            </label>
            <input
              type="text"
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value)}
              placeholder="www.dominio.com ou pix.loja.com"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#7137E8] font-mono text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              O link do Pix abrirá diretamente com: <strong className="text-slate-600 font-mono">{customDomain.trim() ? `https://${cleanDomain(customDomain)}/${establishment.slug}` : `meupixnfc.com/p/${establishment.slug}`}</strong>.
            </p>
          </div>
        </div>

        {/* Live Smartphone Mockup Preview */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-[360px] bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-800">
            {/* Phone Speaker & Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-8 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Screen Content */}
            <div
              className="rounded-[28px] overflow-hidden bg-white min-h-[520px] flex flex-col justify-between border border-slate-100 text-center relative"
              style={{
                backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Phone Address Bar Simulation */}
              <div className="bg-slate-900 text-slate-200 px-3 py-1.5 flex items-center justify-between text-[10px] font-mono border-b border-slate-800">
                <div className="flex items-center gap-1.5 truncate text-emerald-400">
                  <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">https://</span>
                  <span className="text-white font-bold truncate">
                    {customDomain.trim() ? cleanDomain(customDomain) : 'meupixnfc.com'}
                  </span>
                  <span className="text-emerald-400">/{establishment.slug}</span>
                </div>
                <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded shrink-0">SSL</span>
              </div>

              {/* Top Gradient Header */}
              <div
                className="p-5 text-white"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                }}
              >
                <div className="w-14 h-14 rounded-2xl bg-white p-1 mx-auto shadow-md mb-2 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={establishment.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Store className="w-7 h-7 text-[#00B8A9]" />
                  )}
                </div>
                <h3 className="font-bold text-sm tracking-tight">{establishment.name}</h3>
                <p className="text-[10px] text-white/80">{establishment.city}</p>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col items-center justify-center">
                <p className="text-xs text-slate-600 font-medium mb-3">
                  {welcomeMessage || 'Faça seu pagamento via Pix'}
                </p>

                {/* Simulated QR Code */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="w-36 h-36 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-2">
                    <QrCode className="w-28 h-28 text-slate-800" />
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Valor Livre no App do Banco
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Recebedor: {establishment.name}
                  </span>
                </div>

                {/* Simulated Button */}
                <button
                  type="button"
                  className="mt-3 w-full py-2 px-3 text-xs font-semibold text-white rounded-lg shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  Copiar Código Pix
                </button>
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-400">
                Plaquinha NFC protegida · Meu Pix NFC
              </div>
            </div>

            {/* Home indicator bar */}
            <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
          </div>

          <button
            onClick={() => onOpenPublicPage(establishment.slug)}
            className="mt-3 text-xs text-[#008479] hover:text-[#009E91] font-semibold flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            Abrir página em tela cheia no navegador
          </button>
        </div>
      </div>
    </div>
  );
};
