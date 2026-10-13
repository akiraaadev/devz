import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode as QrIcon,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Info,
  Globe
} from 'lucide-react';
import { Establishment, PixKey, PaymentLink } from '../types';
import { generatePixPayload, validatePixKey, maskPixKey } from '../utils/pixPayload';
import { formatDisplayDomainUrl, getEstablishmentPaymentUrl } from '../utils/domain';

interface QrGeneratorViewProps {
  establishments: Establishment[];
  pixKeys: PixKey[];
  initialLink?: PaymentLink | null;
  onOpenPublicPage: (slug: string) => void;
}

export const QrGeneratorView: React.FC<QrGeneratorViewProps> = ({
  establishments,
  pixKeys,
  initialLink,
  onOpenPublicPage
}) => {
  const [selectedEstId, setSelectedEstId] = useState<string>(
    initialLink?.establishment_id || establishments[0]?.id || ''
  );
  const [selectedKeyId, setSelectedKeyId] = useState<string>(
    initialLink?.pix_key_id || ''
  );
  const [customKey, setCustomKey] = useState<string>('');
  const [merchantName, setMerchantName] = useState<string>('');
  const [merchantCity, setMerchantCity] = useState<string>('');
  const [amount, setAmount] = useState<string>(
    initialLink?.amount ? initialLink.amount.toString() : ''
  );
  const [isFreeAmount, setIsFreeAmount] = useState<boolean>(!initialLink?.amount);
  const [txid, setTxid] = useState<string>(initialLink?.txid || '***');
  const [description, setDescription] = useState<string>('');

  // Generated outputs
  const [pixPayload, setPixPayload] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync with establishment selection
  useEffect(() => {
    const currentEst = establishments.find(e => e.id === selectedEstId);
    if (currentEst) {
      setMerchantName(currentEst.name);
      setMerchantCity(currentEst.city);

      // Select first active key
      const keys = pixKeys.filter(k => k.establishment_id === currentEst.id && k.is_active);
      if (keys.length > 0) {
        setSelectedKeyId(keys[0].id);
        setCustomKey(keys[0].key_value);
      } else {
        setSelectedKeyId('');
        setCustomKey('');
      }
    }
  }, [selectedEstId, establishments, pixKeys]);

  // Sync selected key change
  useEffect(() => {
    if (selectedKeyId) {
      const k = pixKeys.find(key => key.id === selectedKeyId);
      if (k) setCustomKey(k.key_value);
    }
  }, [selectedKeyId, pixKeys]);

  // Generate payload whenever inputs change
  useEffect(() => {
    if (!customKey || !merchantName) {
      setPixPayload('');
      setQrDataUrl('');
      return;
    }

    try {
      setIsGenerating(true);
      const numericAmount = !isFreeAmount && amount ? parseFloat(amount) : null;
      const payload = generatePixPayload({
        pixKey: customKey,
        merchantName,
        merchantCity: merchantCity || 'BRASIL',
        amount: numericAmount,
        txid: txid || '***',
        description
      });

      setPixPayload(payload);

      // Generate QR Code image
      QRCode.toDataURL(payload, {
        width: 480,
        margin: 2,
        color: {
          dark: '#182235',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      }).then(url => {
        setQrDataUrl(url);
        setIsGenerating(false);
      });
    } catch (err) {
      console.error('Erro na geração:', err);
      setIsGenerating(false);
    }
  }, [customKey, merchantName, merchantCity, amount, isFreeAmount, txid, description]);

  const copyToClipboard = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const downloadQrCode = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `pix-${merchantName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-qrcode.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const currentEst = establishments.find(e => e.id === selectedEstId);
  const activeKeys = pixKeys.filter(k => k.establishment_id === selectedEstId && k.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#182235]">
          Gerador de QR Code Pix (Padrão BR Code EMV)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Gere códigos Pix oficiais com validação de CRC16 compatíveis com todos os bancos brasileiros
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <QrIcon className="w-4 h-4 text-[#00B8A9]" />
            <h2 className="text-sm font-bold text-slate-900">
              Dados da Cobrança Pix
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estabelecimento
              </label>
              <select
                value={selectedEstId}
                onChange={e => setSelectedEstId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                {establishments.map(est => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chave Pix do Recebedor
              </label>
              <select
                value={selectedKeyId}
                onChange={e => setSelectedKeyId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                {activeKeys.map(k => (
                  <option key={k.id} value={k.id}>
                    {k.label} ({k.key_value})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Recebedor (máx 25 chars) *
              </label>
              <input
                type="text"
                maxLength={25}
                value={merchantName}
                onChange={e => setMerchantName(e.target.value)}
                placeholder="NOME DA EMPRESA"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cidade do Recebedor (máx 15 chars) *
              </label>
              <input
                type="text"
                maxLength={15}
                value={merchantCity}
                onChange={e => setMerchantCity(e.target.value)}
                placeholder="SAO PAULO"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg uppercase"
              />
            </div>
          </div>

          {/* Valor */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Modalidade de Valor</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFreeAmount(true)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors ${
                    isFreeAmount
                      ? 'border-[#00B8A9] bg-white text-[#008479] shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Valor Livre
                </button>
                <button
                  type="button"
                  onClick={() => setIsFreeAmount(false)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors ${
                    !isFreeAmount
                      ? 'border-[#00B8A9] bg-white text-[#008479] shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Valor Fixo
                </button>
              </div>
            </div>

            {!isFreeAmount && (
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white font-mono tabular-nums font-bold"
                />
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              {isFreeAmount
                ? 'O cliente digitará o valor que deseja pagar diretamente no app do banco dele.'
                : 'O aplicativo bancário carregará este valor preenchido automaticamente ao escanear.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Identificador da Cobrança (TxID)
              </label>
              <input
                type="text"
                maxLength={25}
                value={txid}
                onChange={e => setTxid(e.target.value)}
                placeholder="Ex: BALCAO01 ou ***"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-mono text-slate-700"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Use *** para Pix estático sem identificador
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição no Comprovante
              </label>
              <input
                type="text"
                maxLength={40}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Pagamento no balcão"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Live Preview & Output Column */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold text-slate-700">QR Code Oficial do Banco Central</span>
              <span className="text-[10px] font-semibold bg-[#E6F8F6] text-[#008479] px-2 py-0.5 rounded">
                EMVCo CRC16
              </span>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl inline-block shadow-xs max-w-[240px] mx-auto">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code Pix"
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Preencha os dados ao lado
                </div>
              )}
            </div>

            <div className="mt-3">
              <span className="text-xs font-bold text-slate-900 block">
                {merchantName || 'Nome do Recebedor'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono block">
                {isFreeAmount || !amount
                  ? 'Valor Livre no App'
                  : `R$ ${parseFloat(amount || '0').toFixed(2).replace('.', ',')}`}
              </span>
            </div>

            {/* Link do Estabelecimento / Domínio do Cliente */}
            {currentEst && (
              <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block font-medium flex items-center gap-1">
                    {currentEst.custom_domain ? (
                      <span className="text-[#7137E8] font-bold flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Domínio do Cliente:
                      </span>
                    ) : (
                      'Link Web do Pix:'
                    )}
                  </span>
                  <span className="font-mono text-[11px] text-[#7137E8] font-semibold truncate block">
                    {formatDisplayDomainUrl(currentEst.custom_domain, initialLink?.slug || currentEst.slug)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const url = getEstablishmentPaymentUrl(currentEst, initialLink?.slug || currentEst.slug);
                    navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedLink ? 'Copiado' : 'Copiar Link'}
                </button>
              </div>
            )}

            {/* Copia e Cola Box */}
            <div className="mt-4 text-left">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                Código Pix Copia e Cola
              </label>
              <div className="relative">
                <textarea
                  readOnly
                  rows={2}
                  value={pixPayload}
                  className="w-full text-[11px] font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 resize-none select-all focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full mt-4 space-y-2">
            <button
              onClick={copyToClipboard}
              disabled={!pixPayload}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#7137E8] hover:bg-[#6025D8] disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              {copiedPayload ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Código Pix Copiado com Sucesso!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Código Pix Copia e Cola
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={downloadQrCode}
                disabled={!qrDataUrl}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar PNG
              </button>

              {currentEst && (
                <a
                  href={getEstablishmentPaymentUrl(currentEst, initialLink?.slug || currentEst.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#E6F8F6] hover:bg-[#c9f1ec] text-[#008479] text-xs font-semibold rounded-lg transition-colors"
                  title="Abrir página em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Página
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
