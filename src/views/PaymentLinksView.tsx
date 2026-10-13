import React, { useState } from 'react';
import {
  Link2,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Globe
} from 'lucide-react';
import { PaymentLink, Establishment, PixKey } from '../types';
import { DeleteModal } from '../components/DeleteModal';
import { getEstablishmentPaymentUrl, formatDisplayDomainUrl } from '../utils/domain';

interface PaymentLinksViewProps {
  paymentLinks: PaymentLink[];
  establishments: Establishment[];
  pixKeys: PixKey[];
  onAddPaymentLink: (data: any) => void;
  onUpdatePaymentLink: (id: string, data: any) => void;
  onDeletePaymentLink: (id: string) => void;
  onOpenPublicPage: (slug: string) => void;
  onOpenQrGeneratorForLink: (link: PaymentLink) => void;
}

export const PaymentLinksView: React.FC<PaymentLinksViewProps> = ({
  paymentLinks,
  establishments,
  pixKeys,
  onAddPaymentLink,
  onUpdatePaymentLink,
  onDeletePaymentLink,
  onOpenPublicPage,
  onOpenQrGeneratorForLink
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<PaymentLink | null>(null);

  // Form states
  const [establishmentId, setEstablishmentId] = useState(establishments[0]?.id || '');
  const [pixKeyId, setPixKeyId] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountType, setAmountType] = useState<'free' | 'fixed'>('free');
  const [amountValue, setAmountValue] = useState('');
  const [txid, setTxid] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const availableKeys = pixKeys.filter(k => k.establishment_id === establishmentId && k.is_active);

  const resetForm = () => {
    setEstablishmentId(establishments[0]?.id || '');
    setPixKeyId('');
    setSlug('');
    setTitle('');
    setDescription('');
    setAmountType('free');
    setAmountValue('');
    setTxid('');
    setEditingId(null);
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    const firstEst = establishments[0];
    if (firstEst) {
      setEstablishmentId(firstEst.id);
      const k = pixKeys.find(key => key.establishment_id === firstEst.id && key.is_active);
      if (k) setPixKeyId(k.id);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (link: PaymentLink) => {
    setEstablishmentId(link.establishment_id);
    setPixKeyId(link.pix_key_id);
    setSlug(link.slug);
    setTitle(link.title);
    setDescription(link.description || '');
    if (link.amount && link.amount > 0) {
      setAmountType('fixed');
      setAmountValue(link.amount.toString());
    } else {
      setAmountType('free');
      setAmountValue('');
    }
    setTxid(link.txid || '');
    setEditingId(link.id);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    if (!cleanSlug || !title.trim() || !establishmentId || !pixKeyId) {
      setFormError('Preencha os campos obrigatórios.');
      return;
    }

    const duplicate = paymentLinks.some(
      l => l.slug.toLowerCase() === cleanSlug && l.id !== editingId
    );
    if (duplicate) {
      setFormError('Este slug já está sendo utilizado por outro link de pagamento.');
      return;
    }

    const numericAmount = amountType === 'fixed' && amountValue ? parseFloat(amountValue) : null;

    if (editingId) {
      onUpdatePaymentLink(editingId, {
        establishment_id: establishmentId,
        pix_key_id: pixKeyId,
        slug: cleanSlug,
        title: title.trim(),
        description: description.trim(),
        amount: numericAmount,
        txid: txid.trim() || '***'
      });
    } else {
      onAddPaymentLink({
        establishment_id: establishmentId,
        pix_key_id: pixKeyId,
        slug: cleanSlug,
        title: title.trim(),
        description: description.trim(),
        amount: numericAmount,
        is_active: true,
        txid: txid.trim() || '***'
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const copyLink = (link: PaymentLink) => {
    const est = establishments.find(e => e.id === link.establishment_id);
    const fullUrl = getEstablishmentPaymentUrl(est, link.slug);
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#182235]">
            Links de Pagamento Personalizados
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            URLs exclusivas para cobrança de valor fixo ou livre nos caixas e plaquinhas NFC
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#00B8A9] hover:bg-[#009E91] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Criar Novo Link Pix
        </button>
      </div>

      {/* Grid of Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {paymentLinks.map(link => {
          const est = establishments.find(e => e.id === link.establishment_id);
          const key = pixKeys.find(k => k.id === link.pix_key_id);

          return (
            <div
              key={link.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-xs transition-shadow"
            >
              <div>
                {/* Top header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
                    {est?.name || 'Geral'}
                  </span>
                  <button
                    onClick={() => onUpdatePaymentLink(link.id, { is_active: !link.is_active })}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                      link.is_active
                        ? 'bg-[#E6F8F6] text-[#008479]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {link.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {link.title}
                </h3>
                {link.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {link.description}
                  </p>
                )}

                {/* Amount badge */}
                <div className="mt-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Valor da cobrança:</span>
                  <span className="font-bold text-sm text-[#182235] tabular-nums font-mono">
                    {link.amount && link.amount > 0
                      ? `R$ ${link.amount.toFixed(2).replace('.', ',')}`
                      : 'Valor Livre'}
                  </span>
                </div>

                {/* Public link display */}
                <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    {est?.custom_domain ? (
                      <span className="text-[10px] bg-[#F2ECFD] text-[#7137E8] font-bold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1" title={`Domínio Próprio: ${est.custom_domain}`}>
                        <Globe className="w-3 h-3" />
                        Domínio
                      </span>
                    ) : null}
                    <span
                      className="font-mono text-[11px] text-[#7137E8] font-semibold truncate"
                      title={getEstablishmentPaymentUrl(est, link.slug)}
                    >
                      {formatDisplayDomainUrl(est?.custom_domain, link.slug)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyLink(link)}
                      className="p-1 text-slate-500 hover:text-slate-800"
                      title="Copiar URL"
                    >
                      {copiedId === link.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={getEstablishmentPaymentUrl(est, link.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-[#00B8A9] hover:text-[#008479]"
                      title="Abrir link do Pix em nova aba"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Chave Pix vinculada */}
                <p className="text-[11px] text-slate-400 mt-2 truncate">
                  Chave: <strong className="text-slate-600 font-medium">{key?.label || 'Chave padrão'}</strong>
                </p>
              </div>

              {/* Actions & Metrics Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono tabular-nums font-semibold text-slate-800">
                    {link.visits_count}
                  </span>
                  <span>acessos</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenQrGeneratorForLink(link)}
                    className="p-1.5 text-slate-500 hover:text-[#7137E8] hover:bg-[#F2ECFD] rounded-md transition-colors"
                    title="Ver QR Code Pix deste link"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(link)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                    title="Editar link"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLinkToDelete(link)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    title="Excluir link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {paymentLinks.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200">
            <Link2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">Nenhum link criado ainda</h3>
            <p className="text-xs text-slate-400 mt-1">
              Crie links personalizados para vincular às suas plaquinhas NFC.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-[#00B8A9] text-white text-xs font-semibold rounded-lg hover:bg-[#009E91]"
            >
              Criar Primeiro Link
            </button>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar Link */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? 'Editar Link de Pagamento' : 'Novo Link de Pagamento Pix'}
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
                  Estabelecimento *
                </label>
                <select
                  value={establishmentId}
                  onChange={e => {
                    setEstablishmentId(e.target.value);
                    const k = pixKeys.find(key => key.establishment_id === e.target.value && key.is_active);
                    if (k) setPixKeyId(k.id);
                  }}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] bg-white"
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
                  Chave Pix de Destino *
                </label>
                <select
                  value={pixKeyId}
                  onChange={e => setPixKeyId(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] bg-white"
                >
                  <option value="">Selecione uma chave...</option>
                  {availableKeys.map(k => (
                    <option key={k.id} value={k.id}>
                      {k.label} ({k.key_value})
                    </option>
                  ))}
                </select>
                {availableKeys.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Cadastre uma chave Pix para este estabelecimento primeiro na aba "Chaves Pix".
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do Link *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Balcão Caixa 1 ou Corte Masculino"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Aproxime seu celular e confirme o valor"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9]"
                />
              </div>

              {/* Amount options */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Cobrança
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setAmountType('free')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                      amountType === 'free'
                        ? 'border-[#00B8A9] bg-[#E6F8F6] text-[#008479]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Valor Livre (Cliente digita)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountType('fixed')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                      amountType === 'fixed'
                        ? 'border-[#00B8A9] bg-[#E6F8F6] text-[#008479]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Valor Fixo (Definido)
                  </button>
                </div>

                {amountType === 'fixed' && (
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amountValue}
                      onChange={e => setAmountValue(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] font-mono tabular-nums font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identificador na URL (Slug) *
                </label>
                {(() => {
                  const currentModalEst = establishments.find(e => e.id === establishmentId);
                  const isCustom = Boolean(currentModalEst?.custom_domain);
                  return (
                    <div>
                      <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                        <span className={`px-2.5 py-2 text-xs font-mono border-r border-slate-200 shrink-0 ${
                          isCustom ? 'bg-[#F2ECFD] text-[#7137E8] font-semibold' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isCustom ? `${currentModalEst!.custom_domain}/` : '/p/'}
                        </span>
                        <input
                          type="text"
                          required
                          value={slug}
                          onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                          placeholder="meu-link-balcao"
                          className="w-full text-xs p-2 bg-white focus:outline-hidden font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {isCustom ? (
                          <span className="text-[#7137E8] font-medium flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            O cliente abrirá diretamente: <strong>https://{currentModalEst!.custom_domain}/{slug || 'nome-do-link'}</strong>
                          </span>
                        ) : (
                          <span>
                            Dica: Você pode registrar o domínio próprio do cliente em Configurações para abrir como <strong>www.dominio.com/{slug || 'nome'}</strong>.
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })()}
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#00B8A9] hover:bg-[#009E91] rounded-lg transition-colors shadow-xs"
                >
                  {editingId ? 'Salvar Link' : 'Criar Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      <DeleteModal
        isOpen={!!linkToDelete}
        title="Excluir Link de Pagamento"
        itemName={linkToDelete?.title || ''}
        description="Este link de pagamento Pix será removido. Plaquinhas NFC vinculadas a ele precisarão ser redirecionadas."
        onConfirm={() => {
          if (linkToDelete) {
            onDeletePaymentLink(linkToDelete.id);
            setLinkToDelete(null);
          }
        }}
        onCancel={() => setLinkToDelete(null)}
      />
    </div>
  );
};
