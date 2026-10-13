import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Store,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  AlertTriangle,
  Share2,
  Info,
  Globe,
  Lock
} from 'lucide-react';
import { Establishment, PixKey, PaymentLink } from '../types';
import { generatePixPayload, maskPixKey } from '../utils/pixPayload';

interface PublicPaymentPageProps {
  slug: string;
  establishment?: Establishment;
  paymentLink?: PaymentLink;
  pixKey?: PixKey;
  onBackToAdmin?: () => void;
  isStandalone?: boolean;
}

export const PublicPaymentPage: React.FC<PublicPaymentPageProps> = ({
  slug,
  establishment,
  paymentLink,
  pixKey,
  onBackToAdmin,
  isStandalone = false
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [pixPayload, setPixPayload] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // If data was passed via props or loaded
  useEffect(() => {
    if (!establishment || !pixKey) {
      setLoading(false);
      return;
    }

    try {
      const payload = generatePixPayload({
        pixKey: pixKey.key_value,
        merchantName: establishment.name,
        merchantCity: establishment.city || 'BRASIL',
        amount: paymentLink?.amount || null,
        txid: paymentLink?.txid || '***',
        description: paymentLink?.description || establishment.welcome_message
      });

      setPixPayload(payload);

      QRCode.toDataURL(payload, {
        width: 500,
        margin: 2,
        color: {
          dark: '#182235',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      }).then(url => {
        setQrDataUrl(url);
        setLoading(false);
      });
    } catch (err) {
      console.error('Falha ao gerar Pix para página pública:', err);
      setLoading(false);
    }
  }, [establishment, pixKey, paymentLink]);

  // Permite fechar a pré-visualização pressionando a tecla Esc (útil quando testando pelo painel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onBackToAdmin) {
        onBackToAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBackToAdmin]);

  const copyCode = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!establishment || !pixKey) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-6 rounded-2xl border border-slate-200 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">
            Página de Pagamento não encontrada
          </h2>
          <p className="text-xs text-slate-500">
            O link <code className="font-mono text-purple-600">/p/{slug}</code> pode ter sido desativado ou ainda não possui chave Pix associada.
          </p>
        </div>
      </div>
    );
  }

  const primaryColor = establishment.primary_color || '#00B8A9';
  const secondaryColor = establishment.secondary_color || '#7137E8';
  const maskedKey = maskPixKey(pixKey.key_value, pixKey.key_type);

  return (
    <div
      className="min-h-screen bg-[#F5F7FA] text-[#182235] flex flex-col justify-between"
      style={{
        backgroundImage: establishment.background_image_url
          ? `url(${establishment.background_image_url})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Main Content Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
          {/* Barra de Endereço do Navegador com Domínio do Cliente */}
          {(() => {
            const currentDomain = establishment.custom_domain
              ? establishment.custom_domain
              : (typeof window !== 'undefined' ? window.location.host : 'meupixnfc.com.br');
            const targetPath = paymentLink?.slug || slug || establishment.slug;
            return (
              <div className="bg-slate-900 text-slate-200 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700/80 text-[11px] font-mono truncate">
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-slate-400">https://</span>
                    <span className="text-white font-bold">{currentDomain}</span>
                    <span className="text-emerald-400 font-semibold">/{targetPath}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-800 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{establishment.custom_domain ? 'Domínio Oficial' : 'Pix Seguro'}</span>
                </div>
              </div>
            );
          })()}

          {/* Header customizado */}
          <div
            className="p-6 text-white text-center relative"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
            }}
          >
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-white p-1.5 mx-auto shadow-md mb-3 flex items-center justify-center overflow-hidden">
              {establishment.logo_url ? (
                <img
                  src={establishment.logo_url}
                  alt={establishment.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Store className="w-10 h-10 text-[#00B8A9]" />
              )}
            </div>

            <h1 className="text-xl font-extrabold tracking-tight">
              {establishment.name}
            </h1>
            <p className="text-xs text-white/90 mt-0.5">
              {establishment.city} · Pagamento Seguro
            </p>

            {establishment.welcome_message && (
              <p className="text-xs text-white/80 mt-2 max-w-xs mx-auto leading-relaxed">
                {establishment.welcome_message}
              </p>
            )}
          </div>

          {/* Área de Pagamento */}
          <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-[#182235]">
                Faça seu pagamento via Pix
              </h2>
              <p className="text-xs text-slate-500">
                Aproxime o leitor do banco do QR Code abaixo ou copie o código
              </p>
            </div>

            {/* Valor da Cobrança */}
            <div className="text-center py-2.5 px-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Valor a Pagar
              </span>
              <span className="text-2xl font-extrabold text-[#182235] font-mono tabular-nums block mt-0.5">
                {paymentLink?.amount && paymentLink.amount > 0
                  ? `R$ ${paymentLink.amount.toFixed(2).replace('.', ',')}`
                  : 'Valor Livre'}
              </span>
              {(!paymentLink?.amount || paymentLink.amount <= 0) && (
                <span className="text-[11px] text-slate-500 block">
                  Digite o valor no aplicativo do seu banco
                </span>
              )}
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-xs flex flex-col items-center justify-center">
              {loading ? (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                  Carregando código oficial...
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code Pix"
                  className="w-52 h-52 object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                  Falha ao gerar QR Code
                </div>
              )}

              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Padrão Oficial EMV / Banco Central
              </div>
            </div>

            {/* Botão Copiar Pix */}
            <button
              onClick={copyCode}
              disabled={!pixPayload}
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99]"
              style={{ backgroundColor: primaryColor }}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Código Pix Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white" />
                  Copiar Código Pix (Copia e Cola)
                </>
              )}
            </button>

            {/* Dados do Recebedor */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Recebedor:</span>
                <span className="font-bold text-slate-900">{establishment.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Chave Pix:</span>
                <span className="font-mono text-slate-700">{maskedKey}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cidade:</span>
                <span className="text-slate-700">{establishment.city}</span>
              </div>
            </div>

            {/* Instruções passo a passo */}
            <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-2">
              <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                Como pagar:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-600">
                <li>Abra o aplicativo do seu banco ou carteira digital.</li>
                <li>Escolha pagar com <strong>Pix</strong> e selecione <strong>QR Code</strong> ou <strong>Pix Copia e Cola</strong>.</li>
                <li>Confira se o nome do recebedor coincide com <strong>{establishment.name}</strong> antes de confirmar.</li>
              </ol>
            </div>
          </div>

          {/* Rodapé Obrigatório (Conformidade com Seção 10 & 14) */}
          <div className="p-4 bg-slate-50/90 border-t border-slate-200 text-center text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">
              Atenção: Confira sempre os dados do recebedor antes de confirmar no app do seu banco.
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              O pagamento é creditado diretamente na conta do estabelecimento. Esta página utiliza Pix Estático em conformidade com o Banco Central do Brasil.
            </p>
          </div>
        </div>
      </main>

      {/* Powered by Meu Pix NFC */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Tecnologia por <strong className="text-slate-600">Meu Pix NFC</strong> · Pagamentos inteligentes por proximidade
      </footer>
    </div>
  );
};
