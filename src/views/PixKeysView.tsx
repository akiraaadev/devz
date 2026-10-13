import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  AlertCircle,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { PixKey, PixKeyType, Establishment, PaymentLink } from '../types';
import { validatePixKey, maskPixKey } from '../utils/pixPayload';
import { DeleteModal } from '../components/DeleteModal';

interface PixKeysViewProps {
  pixKeys: PixKey[];
  establishments: Establishment[];
  paymentLinks: PaymentLink[];
  onAddPixKey: (data: any) => void;
  onUpdatePixKey: (id: string, data: any) => void;
  onDeletePixKey: (id: string) => void;
}

export const PixKeysView: React.FC<PixKeysViewProps> = ({
  pixKeys,
  establishments,
  paymentLinks,
  onAddPixKey,
  onUpdatePixKey,
  onDeletePixKey
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<PixKey | null>(null);
  const [establishmentId, setEstablishmentId] = useState(
    establishments[0]?.id || ''
  );
  const [keyType, setKeyType] = useState<PixKeyType>('cnpj');
  const [keyValue, setKeyValue] = useState('');
  const [label, setLabel] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [unmaskedKeys, setUnmaskedKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const keyTypeLabels: Record<PixKeyType, string> = {
    cnpj: 'CNPJ',
    cpf: 'CPF',
    phone: 'Celular',
    email: 'E-mail',
    random: 'Chave Aleatória (EVP)'
  };

  const handleOpenAdd = () => {
    setEstablishmentId(establishments[0]?.id || '');
    setKeyType('cnpj');
    setKeyValue('');
    setLabel('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!establishmentId) {
      setFormError('Selecione um estabelecimento.');
      return;
    }

    const val = validatePixKey(keyValue, keyType);
    if (!val.valid) {
      setFormError(val.error || 'Chave Pix com formato inválido.');
      return;
    }

    onAddPixKey({
      establishment_id: establishmentId,
      key_type: keyType,
      key_value: keyValue.trim(),
      label: label.trim() || `Chave ${keyTypeLabels[keyType]}`,
      is_active: true
    });

    setIsModalOpen(false);
  };

  const toggleMask = (keyId: string) => {
    setUnmaskedKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyKey = (key: PixKey) => {
    navigator.clipboard.writeText(key.key_value);
    setCopiedKeyId(key.id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleDelete = (key: PixKey) => {
    setKeyToDelete(key);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#182235]">
            Chaves Pix dos Estabelecimentos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastre as chaves bancárias onde os pagamentos dos clientes serão creditados diretamente
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#7137E8] hover:bg-[#6025D8] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Chave Pix
        </button>
      </div>

      {/* Security Banner */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-900">
        <Shield className="w-5 h-5 text-emerald-700 shrink-0" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Segurança garantida:</strong> A plataforma Meu Pix NFC nunca solicita senhas, tokens bancários ou dados de cartão. O pagamento é realizado diretamente pelo cliente via Pix para o recebedor cadastrado.
        </p>
      </div>

      {/* Table of Keys */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Estabelecimento</th>
                <th className="py-3 px-4">Identificação / Banco</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Chave Pix</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pixKeys.map(key => {
                const est = establishments.find(e => e.id === key.establishment_id);
                const isRevealed = !!unmaskedKeys[key.id];
                const displayValue = isRevealed
                  ? key.key_value
                  : maskPixKey(key.key_value, key.key_type);

                return (
                  <tr key={key.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {est?.name || 'Não vinculado'}
                    </td>
                    <td className="py-3.5 px-4 font-medium whitespace-nowrap">
                      {key.label}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-600">
                        {keyTypeLabels[key.key_type]}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
                          {displayValue}
                        </span>
                        <button
                          onClick={() => toggleMask(key.id)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                          title={isRevealed ? 'Ocultar' : 'Exibir chave completa'}
                        >
                          {isRevealed ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => copyKey(key)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                          title="Copiar chave"
                        >
                          {copiedKeyId === key.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => onUpdatePixKey(key.id, { is_active: !key.is_active })}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                          key.is_active
                            ? 'bg-[#E6F8F6] text-[#008479]'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {key.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-[#00B8A9]" />
                            Ativa
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            Inativa
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(key)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir chave"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {pixKeys.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Nenhuma chave Pix cadastrada. Clique em "Cadastrar Chave Pix".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Chave Pix */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Nova Chave Pix
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
                  Estabelecimento Pertencente *
                </label>
                <select
                  value={establishmentId}
                  onChange={e => setEstablishmentId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#7137E8] bg-white"
                >
                  {establishments.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identificador Interno (Rótulo)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="Ex: Santander PJ Balcão"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#7137E8]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={keyType}
                    onChange={e => setKeyType(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#7137E8] bg-white"
                  >
                    <option value="cnpj">CNPJ</option>
                    <option value="cpf">CPF</option>
                    <option value="phone">Celular</option>
                    <option value="email">E-mail</option>
                    <option value="random">Aleatória</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chave Pix *
                  </label>
                  <input
                    type="text"
                    required
                    value={keyValue}
                    onChange={e => setKeyValue(e.target.value)}
                    placeholder={
                      keyType === 'cnpj'
                        ? '12345678000190'
                        : keyType === 'cpf'
                        ? '12345678901'
                        : keyType === 'phone'
                        ? '+5511999999999'
                        : keyType === 'email'
                        ? 'pix@empresa.com'
                        : 'UUID EVP aleatória'
                    }
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#7137E8] font-mono"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                A chave será validada nos padrões do Banco Central do Brasil para garantir a compatibilidade com apps de banco.
              </p>

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
                  Salvar Chave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      <DeleteModal
        isOpen={!!keyToDelete}
        title="Excluir Chave Pix"
        itemName={keyToDelete ? `${keyToDelete.label} (${keyToDelete.key_value})` : ''}
        description="Esta chave Pix será removida permanentemente e desvinculada dos links que a utilizam."
        onConfirm={() => {
          if (keyToDelete) {
            onDeletePixKey(keyToDelete.id);
            setKeyToDelete(null);
          }
        }}
        onCancel={() => setKeyToDelete(null)}
      />
    </div>
  );
};
