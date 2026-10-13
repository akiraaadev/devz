import React, { useState } from 'react';
import {
  Radio,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Globe
} from 'lucide-react';
import { NFCTag, Establishment, PaymentLink } from '../types';
import { DeleteModal } from '../components/DeleteModal';
import { formatDisplayDomainUrl } from '../utils/domain';

interface NfcTagsViewProps {
  nfcTags: NFCTag[];
  establishments: Establishment[];
  paymentLinks: PaymentLink[];
  onAddNFCTag: (data: any) => void;
  onUpdateNFCTag: (id: string, data: any) => void;
  onDeleteNFCTag: (id: string) => void;
  onSimulateTap: (tag: NFCTag) => void;
}

export const NfcTagsView: React.FC<NfcTagsViewProps> = ({
  nfcTags,
  establishments,
  paymentLinks,
  onAddNFCTag,
  onUpdateNFCTag,
  onDeleteNFCTag,
  onSimulateTap
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedTagCode, setCopiedTagCode] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<NFCTag | null>(null);

  // Form states
  const [tagCode, setTagCode] = useState('');
  const [establishmentId, setEstablishmentId] = useState(establishments[0]?.id || '');
  const [paymentLinkId, setPaymentLinkId] = useState('');
  const [label, setLabel] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const availableLinks = paymentLinks.filter(l => l.establishment_id === establishmentId && l.is_active);

  const handleOpenAdd = () => {
    const firstEst = establishments[0];
    const initialCode = `NFC-${Math.floor(1000 + Math.random() * 9000)}`;
    setTagCode(initialCode);
    setEstablishmentId(firstEst ? firstEst.id : '');
    const firstLink = paymentLinks.find(l => l.establishment_id === firstEst?.id && l.is_active);
    setPaymentLinkId(firstLink ? firstLink.id : '');
    setLabel('Plaquinha Balcão Caixa');
    setEditingId(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tag: NFCTag) => {
    setTagCode(tag.tag_code);
    setEstablishmentId(tag.establishment_id);
    setPaymentLinkId(tag.payment_link_id);
    setLabel(tag.label);
    setEditingId(tag.id);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = tagCode.trim().toUpperCase();
    if (!cleanCode || !establishmentId || !paymentLinkId) {
      setFormError('Preencha os campos obrigatórios.');
      return;
    }

    const duplicate = nfcTags.some(t => t.tag_code === cleanCode && t.id !== editingId);
    if (duplicate) {
      setFormError('Já existe uma plaquinha com este identificador único.');
      return;
    }

    if (editingId) {
      onUpdateNFCTag(editingId, {
        tag_code: cleanCode,
        establishment_id: establishmentId,
        payment_link_id: paymentLinkId,
        label: label.trim() || `Plaquinha ${cleanCode}`
      });
    } else {
      onAddNFCTag({
        tag_code: cleanCode,
        establishment_id: establishmentId,
        payment_link_id: paymentLinkId,
        label: label.trim() || `Plaquinha ${cleanCode}`,
        status: 'active'
      });
    }

    setIsModalOpen(false);
  };

  const copyNfcBurnUrl = (code: string) => {
    const burnUrl = `${window.location.origin}/nfc/${code}`;
    navigator.clipboard.writeText(burnUrl);
    setCopiedTagCode(code);
    setTimeout(() => setCopiedTagCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#182235]">
            Gestão de Plaquinhas NFC
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Grave o link permanente nas plaquinhas físicas e altere o destino a qualquer momento sem regravar a tag
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-[#7137E8]" />
            Como Gravar a Tag
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#7137E8] hover:bg-[#6025D8] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Plaquinha NFC
          </button>
        </div>
      </div>

      {/* Guide Banner */}
      {showGuide && (
        <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl space-y-3 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#7137E8] flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Guia Prático de Gravação Física em Plaquinhas NFC (NTAG213 / NTAG215 / NTAG216)
            </span>
            <button
              onClick={() => setShowGuide(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
            <li>Baixe qualquer app gravador NFC no seu celular (ex: <strong>NFC Tools</strong> na App Store ou Google Play).</li>
            <li>No Meu Pix NFC, clique em <strong>"Copiar URL para Gravar"</strong> ao lado da plaquinha desejada.</li>
            <li>No app NFC Tools, vá em <strong>Escrever &gt; Adicionar um registro &gt; URL / URI</strong> e cole o link permanente copiado.</li>
            <li>Aproxime o celular da plaquinha acrílica ou adesivo NFC para concluir a gravação.</li>
            <li><strong>Vantagem única:</strong> Se o lojista trocar de chave Pix ou de caixa, você altera o destino diretamente no painel. A plaquinha física <em>nunca precisa ser regravada</em>!</li>
          </ol>
        </div>
      )}

      {/* Plaquinhas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {nfcTags.map(tag => {
          const est = establishments.find(e => e.id === tag.establishment_id);
          const link = paymentLinks.find(l => l.id === tag.payment_link_id);
          const burnUrl = `${window.location.origin}/nfc/${tag.tag_code}`;

          return (
            <div
              key={tag.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-xs transition-shadow"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F2ECFD] text-[#7137E8] flex items-center justify-center shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900 block">
                        {tag.tag_code}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {tag.label}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onUpdateNFCTag(tag.id, {
                        status: tag.status === 'active' ? 'inactive' : 'active'
                      })
                    }
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                      tag.status === 'active'
                        ? 'bg-[#E6F8F6] text-[#008479]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tag.status === 'active' ? 'Ativa' : 'Inativa'}
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Estabelecimento:</span>
                    <span className="font-semibold text-slate-800">{est?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Link de Destino:</span>
                    <span className="font-mono text-[11px] text-[#7137E8] font-semibold flex items-center gap-1">
                      {est?.custom_domain && <Globe className="w-3 h-3 text-[#7137E8]" />}
                      {formatDisplayDomainUrl(est?.custom_domain, link?.slug || 'padrao')}
                    </span>
                  </div>
                </div>

                {/* URL permanente para gravação */}
                <div className="mt-4 p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    URL Permanente da Tag NFC
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-slate-700 truncate">
                      {burnUrl}
                    </span>
                    <button
                      onClick={() => copyNfcBurnUrl(tag.tag_code)}
                      className="px-2 py-1 text-[11px] font-semibold text-[#7137E8] hover:bg-[#F2ECFD] rounded flex items-center gap-1 shrink-0"
                    >
                      {copiedTagCode === tag.tag_code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer with Taps counter & Simulate button */}
              <div className="mt-5 pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Toques registrados:</span>
                  <span className="font-mono text-sm font-bold text-[#182235] tabular-nums">
                    {tag.taps_count} toques
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSimulateTap(tag)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#F2ECFD] hover:bg-[#e4d7fc] text-[#7137E8] text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Simular Toque
                  </button>

                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenEdit(tag)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                      title="Editar destino da plaquinha"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTagToDelete(tag)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {nfcTags.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200">
            <Radio className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">Nenhuma plaquinha NFC cadastrada</h3>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre e gerencie suas plaquinhas físicas para os balcões dos comércios.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-[#7137E8] text-white text-xs font-semibold rounded-lg hover:bg-[#6025D8]"
            >
              Cadastrar Primeira Plaquinha
            </button>
          </div>
        )}
      </div>

      {/* Modal Adicionar / Editar Plaquinha */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? 'Editar Plaquinha NFC' : 'Nova Plaquinha NFC Comercial'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identificador Físico Único *
                </label>
                <input
                  type="text"
                  required
                  value={tagCode}
                  onChange={e => setTagCode(e.target.value.toUpperCase())}
                  placeholder="Ex: NFC-FARMA-01"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#7137E8] font-mono uppercase"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Código impresso ou gravado a laser na plaquinha física do cliente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Localização / Descrição da Plaquinha
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="Ex: Balcão Caixa 1 ou Mesa 4"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#7137E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estabelecimento *
                </label>
                <select
                  value={establishmentId}
                  onChange={e => {
                    setEstablishmentId(e.target.value);
                    const l = paymentLinks.find(link => link.establishment_id === e.target.value && link.is_active);
                    if (l) setPaymentLinkId(l.id);
                  }}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#7137E8] bg-white"
                >
                  {establishments.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link de Destino Atual *
                </label>
                <select
                  value={paymentLinkId}
                  onChange={e => setPaymentLinkId(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#7137E8] bg-white"
                >
                  <option value="">Selecione o link...</option>
                  {availableLinks.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.title} (/p/{l.slug})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Você pode alterar este destino a qualquer momento pelo painel sem precisar regravar o chip NFC.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#7137E8] hover:bg-[#6025D8] rounded-lg transition-colors shadow-xs"
                >
                  {editingId ? 'Salvar Plaquinha' : 'Cadastrar Plaquinha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      <DeleteModal
        isOpen={!!tagToDelete}
        title="Excluir Plaquinha NFC"
        itemName={tagToDelete?.tag_code || ''}
        description="Esta plaquinha NFC será removida do sistema. Você poderá cadastrá-la novamente quando desejar."
        onConfirm={() => {
          if (tagToDelete) {
            onDeleteNFCTag(tagToDelete.id);
            setTagToDelete(null);
          }
        }}
        onCancel={() => setTagToDelete(null)}
      />
    </div>
  );
};
