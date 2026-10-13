import React, { useState } from 'react';
import {
  Radio,
  Smartphone,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Store
} from 'lucide-react';
import { NFCTag, Establishment, PaymentLink } from '../types';

interface NfcTapModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfcTags: NFCTag[];
  establishments: Establishment[];
  paymentLinks: PaymentLink[];
  onTapConfirmed: (tagId: string, slug: string) => void;
}

export const NfcTapModal: React.FC<NfcTapModalProps> = ({
  isOpen,
  onClose,
  nfcTags,
  establishments,
  paymentLinks,
  onTapConfirmed
}) => {
  const [selectedTagId, setSelectedTagId] = useState<string>(nfcTags[0]?.id || '');
  const [isSimulating, setIsSimulating] = useState(false);
  const [tapSuccess, setTapSuccess] = useState(false);

  if (!isOpen) return null;

  const currentTag = nfcTags.find(t => t.id === selectedTagId) || nfcTags[0];
  const est = establishments.find(e => e.id === currentTag?.establishment_id);
  const link = paymentLinks.find(l => l.id === currentTag?.payment_link_id);
  const targetSlug = link?.slug || est?.slug || 'farmacia-do-carro';

  const handleSimulate = () => {
    if (!currentTag) return;
    setIsSimulating(true);
    setTapSuccess(false);

    setTimeout(() => {
      setIsSimulating(false);
      setTapSuccess(true);

      setTimeout(() => {
        onTapConfirmed(currentTag.id, targetSlug);
      }, 900);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center relative overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold"
        >
          ✕
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#F2ECFD] text-[#7137E8] flex items-center justify-center mx-auto mb-3">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>

        <h3 className="text-base font-bold text-slate-900">
          Simulador de Aproximação NFC
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Veja a experiência exata de um cliente aproximando o smartphone da plaquinha física no balcão
        </p>

        {/* Seleção da Plaquinha */}
        <div className="text-left mb-4">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
            Escolha a Plaquinha NFC:
          </label>
          <select
            value={selectedTagId}
            onChange={e => {
              setSelectedTagId(e.target.value);
              setTapSuccess(false);
            }}
            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
          >
            {nfcTags.map(t => {
              const e = establishments.find(est => est.id === t.establishment_id);
              return (
                <option key={t.id} value={t.id}>
                  {t.tag_code} — {t.label} ({e?.name})
                </option>
              );
            })}
          </select>
        </div>

        {/* Card da Plaquinha Selecionada */}
        {currentTag && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Estabelecimento:</span>
              <span className="font-bold text-slate-800">{est?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Destino:</span>
              <span className="font-mono text-[11px] font-semibold text-[#7137E8]">
                /p/{targetSlug}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total de Toques:</span>
              <span className="font-mono font-bold text-slate-900">{currentTag.taps_count}</span>
            </div>
          </div>
        )}

        {/* Visual Phone Tap Animation Area */}
        <div className="py-6 bg-slate-900 rounded-2xl mb-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
          {isSimulating ? (
            <div className="flex flex-col items-center gap-2 text-white">
              <div className="relative">
                <Smartphone className="w-10 h-10 text-[#00B8A9] animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B8A9] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00B8A9]"></span>
                </span>
              </div>
              <span className="text-xs font-semibold text-[#00B8A9]">
                Lendo chip NFC NDEF...
              </span>
            </div>
          ) : tapSuccess ? (
            <div className="flex flex-col items-center gap-1.5 text-white">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">
                Plaquinha Detectada! Abrindo página...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/80">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-white/60">
                Pronto para aproximação
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#7137E8] to-[#00B8A9] hover:opacity-95 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          Aproximar Celular da Plaquinha
        </button>
      </div>
    </div>
  );
};
