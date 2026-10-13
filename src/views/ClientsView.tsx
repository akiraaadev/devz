import React, { useState } from 'react';
import {
  Store,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Check,
  AlertCircle,
  Copy,
  Search,
  KeyRound,
  Globe
} from 'lucide-react';
import { Establishment, PixKeyType, UserProfile } from '../types';
import { validatePixKey } from '../utils/pixPayload';
import { DeleteModal } from '../components/DeleteModal';
import { cleanDomain, validateDomain, getEstablishmentPaymentUrl, formatDisplayDomainUrl } from '../utils/domain';

interface ClientsViewProps {
  establishments: Establishment[];
  currentUser?: UserProfile;
  onAddEstablishment: (data: any) => void;
  onUpdateEstablishment: (id: string, data: any) => void;
  onDeleteEstablishment: (id: string) => void;
  onOpenPublicPage: (slug: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  establishments,
  currentUser,
  onAddEstablishment,
  onUpdateEstablishment,
  onDeleteEstablishment,
  onOpenPublicPage
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [estToDelete, setEstToDelete] = useState<Establishment | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cnpj');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [slug, setSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [initialPixKey, setInitialPixKey] = useState('');
  const [initialKeyType, setInitialKeyType] = useState<PixKeyType>('cnpj');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setOwnerName('');
    setDocument('');
    setDocumentType('cnpj');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setLogoUrl('');
    setCity('');
    setAddress('');
    setSlug('');
    setCustomDomain('');
    setInitialPixKey('');
    setInitialKeyType('cnpj');
    setEditingId(null);
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (est: Establishment) => {
    setName(est.name);
    setOwnerName(est.owner_name);
    setDocument(est.document);
    setDocumentType(est.document_type);
    setPhone(est.phone);
    setWhatsapp(est.whatsapp || '');
    setEmail(est.email);
    setLogoUrl(est.logo_url || '');
    setCity(est.city);
    setAddress(est.address || '');
    setSlug(est.slug);
    setCustomDomain(est.custom_domain || '');
    setEditingId(est.id);
    setFormError(null);
    setIsModalOpen(true);
  };

  const autoGenerateSlug = (storeName: string) => {
    const generated = storeName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setSlug(generated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    if (!name.trim() || !ownerName.trim() || !document.trim() || !city.trim() || !cleanSlug) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }

    // Slug duplication check
    const duplicate = establishments.some(
      e => e.slug.toLowerCase() === cleanSlug && e.id !== editingId
    );
    if (duplicate) {
      setFormError('Este identificador de link (slug) já está sendo utilizado por outro estabelecimento.');
      return;
    }

    // Pix Key validation if adding new
    if (!editingId && initialPixKey) {
      const val = validatePixKey(initialPixKey, initialKeyType);
      if (!val.valid) {
        setFormError(`Chave Pix inválida: ${val.error}`);
        return;
      }
    }

    const cleanDom = customDomain.trim() ? cleanDomain(customDomain) : undefined;
    if (cleanDom) {
      const val = validateDomain(cleanDom);
      if (!val.valid) {
        setFormError(val.error || 'Formato de domínio inválido.');
        return;
      }
    }

    if (editingId) {
      onUpdateEstablishment(editingId, {
        name: name.trim(),
        owner_name: ownerName.trim(),
        document: document.trim(),
        document_type: documentType,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim(),
        logo_url: logoUrl.trim(),
        city: city.trim().toUpperCase(),
        address: address.trim(),
        slug: cleanSlug,
        custom_domain: cleanDom,
        custom_domain_status: cleanDom ? 'active' : undefined,
        custom_domain_ssl: cleanDom ? true : undefined,
        custom_domain_verified_at: cleanDom ? new Date().toISOString() : undefined
      });
    } else {
      onAddEstablishment({
        name: name.trim(),
        owner_name: ownerName.trim(),
        document: document.trim(),
        document_type: documentType,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim(),
        logo_url: logoUrl.trim(),
        city: city.trim().toUpperCase(),
        address: address.trim(),
        slug: cleanSlug,
        custom_domain: cleanDom,
        custom_domain_status: cleanDom ? 'active' : undefined,
        custom_domain_ssl: cleanDom ? true : undefined,
        custom_domain_verified_at: cleanDom ? new Date().toISOString() : undefined,
        user_id: 'user-demo',
        primary_color: '#00B8A9',
        secondary_color: '#7137E8',
        welcome_message: 'Aproxime e pague rapidamente via Pix',
        initial_pix_key: initialPixKey.trim(),
        initial_key_type: initialKeyType
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const filteredEstablishments = establishments.filter(
    e =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.document.includes(searchTerm)
  );

  const copyUrl = (est: Establishment) => {
    const fullUrl = getEstablishmentPaymentUrl(est, est.slug);
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(est.slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#182235]">
            {currentUser?.role === 'merchant'
              ? 'Meu Estabelecimento Comercial'
              : 'Meus Clientes & Estabelecimentos'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {currentUser?.role === 'merchant'
              ? 'Gerencie os dados cadastrais, endereço e o link da sua loja'
              : 'Gerencie os comércios que utilizam as plaquinhas NFC e páginas de pagamento Pix'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#00B8A9] hover:bg-[#009E91] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Estabelecimento
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, slug, cidade ou CNPJ..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden bg-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Estabelecimentos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEstablishments.map(est => (
          <div
            key={est.id}
            className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-xs transition-shadow"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {est.logo_url ? (
                    <img
                      src={est.logo_url}
                      alt={est.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-[#E6F8F6] text-[#008479] flex items-center justify-center font-bold text-sm shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {est.name}
                    </h3>
                    <p className="text-xs text-slate-500">{est.owner_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(est)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEstToDelete(est)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    title="Excluir estabelecimento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Info Rows */}
              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] font-medium w-16">Documento:</span>
                  <span className="font-mono text-slate-800">{est.document}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] font-medium w-16">Contato:</span>
                  <span>{est.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] font-medium w-16">Local:</span>
                  <span>{est.city}</span>
                </div>
              </div>

              {/* Public Link Pill box */}
              <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block font-medium flex items-center gap-1">
                    {est.custom_domain ? (
                      <span className="text-[#7137E8] font-bold flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Domínio do Cliente:
                      </span>
                    ) : (
                      'Link do Estabelecimento:'
                    )}
                  </span>
                  <span
                    className="font-mono text-xs font-semibold text-[#7137E8] truncate block"
                    title={getEstablishmentPaymentUrl(est, est.slug)}
                  >
                    {formatDisplayDomainUrl(est.custom_domain, est.slug)}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyUrl(est)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md"
                    title="Copiar URL"
                  >
                    {copiedSlug === est.slug ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => onOpenPublicPage(est.slug)}
                    className="p-1.5 text-white bg-[#00B8A9] hover:bg-[#009E91] rounded-md"
                    title="Abrir página pública"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Cadastrado em {new Date(est.created_at).toLocaleDateString('pt-BR')}</span>
              <span className="font-semibold text-slate-600 capitalize">Plaquinhas ativas</span>
            </div>
          </div>
        ))}

        {filteredEstablishments.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200">
            <Store className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">Nenhum estabelecimento encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre seu primeiro estabelecimento para gerar links e plaquinhas NFC.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-[#00B8A9] text-white text-xs font-semibold rounded-lg hover:bg-[#009E91]"
            >
              Cadastrar Agora
            </button>
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? 'Editar Estabelecimento' : 'Novo Estabelecimento Comercial'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Estabelecimento *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      if (!editingId && !slug) autoGenerateSlug(e.target.value);
                    }}
                    placeholder="Ex: Farmácia do Carro"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="Ex: Carlos Alberto Silva"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo Documento
                  </label>
                  <select
                    value={documentType}
                    onChange={e => setDocumentType(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden bg-white"
                  >
                    <option value="cnpj">CNPJ</option>
                    <option value="cpf">CPF</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF ou CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={document}
                    onChange={e => setDocument(e.target.value)}
                    placeholder="12.345.678/0001-90"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Comercial
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail de Contato *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contato@farmaciadocarro.com.br"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cidade * (BCB máx 15 chars)
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="SAO PAULO"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço Físico do Comércio
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Av. Paulista, 1500 - Bela Vista"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL do Logotipo (opcional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#00B8A9] focus:outline-hidden"
                />
              </div>

              {/* Slug Customizado */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identificador Personalizado do Link (Slug) *
                </label>
                <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-slate-50 focus-within:ring-1 focus-within:ring-[#00B8A9]">
                  <span className="px-3 py-2.5 text-xs text-slate-500 font-mono bg-slate-100 border-r border-slate-200">
                    meupixnfc.com/p/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="farmacia-do-carro"
                    className="w-full text-xs p-2.5 bg-white focus:outline-hidden font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Este link abrirá a página quando alguém aproximar o celular da plaquinha NFC.
                </p>
              </div>

              {/* Domínio Próprio do Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#7137E8]" />
                    Domínio Próprio do Cliente (Opcional)
                  </span>
                  <span className="text-[11px] text-[#7137E8] font-medium">
                    ex: www.farmaciadocarro.com.br
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={e => setCustomDomain(e.target.value)}
                    placeholder="www.dominio.com ou pix.nomedaloja.com.br"
                    className="w-full text-xs pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#7137E8] font-mono text-slate-800"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Quando preenchido, o link do Pix abrirá diretamente como: <strong className="text-slate-600 font-mono">{customDomain.trim() ? `https://${cleanDomain(customDomain)}/${slug || 'link'}` : 'www.dominio.com/{link}'}</strong>.
                </p>
              </div>

              {/* Initial Pix key if creating new */}
              {!editingId && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <KeyRound className="w-3.5 h-3.5 text-[#00B8A9]" />
                    <span>Chave Pix Inicial do Estabelecimento</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <select
                        value={initialKeyType}
                        onChange={e => setInitialKeyType(e.target.value as any)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="cnpj">CNPJ</option>
                        <option value="cpf">CPF</option>
                        <option value="phone">Celular</option>
                        <option value="email">E-mail</option>
                        <option value="random">Aleatória (EVP)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={initialPixKey}
                        onChange={e => setInitialPixKey(e.target.value)}
                        placeholder="Digite a chave Pix exata"
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Estabelecimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      <DeleteModal
        isOpen={!!estToDelete}
        title="Excluir Estabelecimento"
        itemName={estToDelete?.name || ''}
        description="Esta ação removerá o estabelecimento e desvinculará suas chaves Pix, links de pagamento e plaquinhas NFC associadas. Você poderá recriá-lo quando desejar."
        onConfirm={() => {
          if (estToDelete) {
            onDeleteEstablishment(estToDelete.id);
            setEstToDelete(null);
          }
        }}
        onCancel={() => setEstToDelete(null)}
      />
    </div>
  );
};
