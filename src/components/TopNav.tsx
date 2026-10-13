import { Menu, ExternalLink, Radio, Shield, Sparkles, LogOut, Store } from 'lucide-react';
import { Establishment, UserProfile } from '../types';

interface TopNavProps {
  currentTabName: string;
  establishment?: Establishment | null;
  currentUser: UserProfile;
  onOpenMobileMenu: () => void;
  onOpenPublicPreview: () => void;
  onSimulateNfcTap: () => void;
  onLogout?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTabName,
  establishment,
  currentUser,
  onOpenMobileMenu,
  onOpenPublicPreview,
  onSimulateNfcTap,
  onLogout
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="hidden sm:inline">Meu Pix NFC</span>
          <span className="hidden sm:inline" aria-hidden="true">/</span>
          <span className="text-slate-900 font-semibold">{establishment?.name || 'Painel'}</span>
          <span aria-hidden="true">/</span>
          <span className="text-[#008479] font-medium">{currentTabName}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Indicator Badge */}
        {currentUser.role === 'admin' ? (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold bg-[#F2ECFD] text-[#7137E8] px-2.5 py-1 rounded-lg">
            👑 Painel Administrador
          </span>
        ) : (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold bg-[#E6F8F6] text-[#008479] px-2.5 py-1 rounded-lg">
            🏪 Painel Cliente (Lojista)
          </span>
        )}

        {/* Simular Toque NFC Button */}
        <button
          onClick={onSimulateNfcTap}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#7137E8] bg-[#F2ECFD] hover:bg-[#e4d7fc] rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          <Radio className="w-3.5 h-3.5 text-[#7137E8]" />
          <span className="hidden sm:inline">Simular Toque NFC</span>
          <span className="sm:hidden">NFC</span>
        </button>

        {/* Ver Página de Pagamento */}
        <button
          onClick={onOpenPublicPreview}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#00B8A9] hover:bg-[#009E91] rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ver Página Pública</span>
          <span className="sm:hidden">Página</span>
        </button>

        {/* Botão Sair */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sair da Conta"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        )}
      </div>
    </header>
  );
};
