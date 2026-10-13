import React from 'react';
import {
  LayoutDashboard,
  Store,
  KeyRound,
  Link2,
  QrCode,
  Palette,
  Radio,
  CreditCard,
  Settings,
  ShieldCheck,
  Building2,
  ChevronRight,
  ExternalLink,
  Sparkles,
  UserCheck,
  LogOut
} from 'lucide-react';
import { UserProfile, Establishment } from '../types';

export type NavTab =
  | 'dashboard'
  | 'clients'
  | 'pix-keys'
  | 'payment-links'
  | 'qr-generator'
  | 'customization'
  | 'nfc-tags'
  | 'plans'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: UserProfile;
  establishments: Establishment[];
  selectedEstablishmentId: string;
  onSelectEstablishment: (id: string) => void;
  onToggleRole: () => void;
  onLogout?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  establishments,
  selectedEstablishmentId,
  onSelectEstablishment,
  onToggleRole,
  onLogout,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Meus Clientes', icon: Store },
    { id: 'pix-keys', label: 'Chaves Pix', icon: KeyRound },
    { id: 'payment-links', label: 'Links de Pagamento', icon: Link2 },
    { id: 'qr-generator', label: 'Gerador de QR Code', icon: QrCode },
    { id: 'customization', label: 'Personalização', icon: Palette },
    { id: 'nfc-tags', label: 'Plaquinhas NFC', icon: Radio },
    { id: 'plans', label: 'Planos e Assinaturas', icon: CreditCard },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7137E8] to-[#00B8A9] flex items-center justify-center text-white font-bold shadow-xs">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[#182235] block leading-none">
                Meu Pix NFC
              </span>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide block mt-1">
                Pagamentos por Proximidade
              </span>
            </div>
          </div>
        </div>

        {/* Estabelecimento Seletor Rápido */}
        <div className="p-3 border-b border-slate-100">
          <label className="text-[11px] font-semibold text-slate-500 px-2 uppercase tracking-wider block mb-1">
            Estabelecimento Ativo
          </label>
          <div className="relative">
            <select
              value={selectedEstablishmentId}
              onChange={(e) => onSelectEstablishment(e.target.value)}
              aria-label="Estabelecimento Ativo"
              className="w-full text-xs font-semibold text-[#182235] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-2 pr-7 appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[#00B8A9]"
            >
              {establishments.length === 0 && (
                <option value="">Nenhum estabelecimento</option>
              )}
              {establishments.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.name}
                </option>
              ))}
            </select>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none rotate-90" />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-[#E6F8F6] text-[#008479] font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#00B8A9]' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {item.id === 'nfc-tags' && (
                  <span className="ml-auto text-[10px] font-semibold bg-[#F2ECFD] text-[#7137E8] px-1.5 py-0.5 rounded">
                    NFC
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Role Switcher & Profile Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
          {/* Permission Mode Box */}
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Permissão:</span>
              <span className="font-semibold text-slate-900 capitalize">
                {currentUser.role === 'admin' ? 'Administrador Geral' : 'Comerciante'}
              </span>
            </div>
            <button
              onClick={onToggleRole}
              className="mt-2 w-full text-center text-[11px] font-medium text-[#7137E8] hover:text-[#6025D8] hover:bg-[#F2ECFD]/60 py-1 rounded transition-colors"
            >
              Alternar para {currentUser.role === 'admin' ? 'Comerciante' : 'Administrador'}
            </button>
          </div>

          {/* Profile row */}
          <div className="flex items-center gap-2.5 px-2 py-1 text-xs">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
              {currentUser.name.charAt(0)}
            </div>
            <div className="truncate flex-1">
              <p className="font-semibold text-slate-900 truncate leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 capitalize">
                Plano {currentUser.plan_tier}
              </p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Sair da Conta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
