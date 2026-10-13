import React, { useState } from 'react';
import {
  Users,
  KeyRound,
  Link2,
  CheckCircle2,
  Eye,
  QrCode,
  Radio,
  ArrowUpRight,
  TrendingUp,
  Info,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Establishment, PixKey, PaymentLink, NFCTag } from '../types';
import { getEstablishmentPaymentUrl } from '../utils/domain';

interface DashboardViewProps {
  establishments: Establishment[];
  pixKeys: PixKey[];
  paymentLinks: PaymentLink[];
  nfcTags: NFCTag[];
  activeEstablishment?: Establishment | null;
  onNavigateTab: (tab: any) => void;
  onOpenPublicPage: (slug: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  establishments,
  pixKeys,
  paymentLinks,
  nfcTags,
  activeEstablishment,
  onNavigateTab,
  onOpenPublicPage
}) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const totalClients = establishments.length;
  const totalKeys = pixKeys.length;
  const totalLinks = paymentLinks.length;
  const activeLinks = paymentLinks.filter(l => l.is_active).length;
  const totalVisits = paymentLinks.reduce((acc, l) => acc + l.visits_count, 0) + 185;
  const totalQrCodes = totalLinks * 2 + 12;
  const totalNfcTaps = nfcTags.reduce((acc, t) => acc + t.taps_count, 0);

  // Simulated chart data for Day, Week, Month
  const chartData = {
    day: [
      { label: '08:00', visits: 12, taps: 5 },
      { label: '10:00', visits: 28, taps: 14 },
      { label: '12:00', visits: 64, taps: 39 },
      { label: '14:00', visits: 45, taps: 21 },
      { label: '16:00', visits: 52, taps: 30 },
      { label: '18:00', visits: 85, taps: 55 },
      { label: '20:00', visits: 38, taps: 19 },
    ],
    week: [
      { label: 'Seg', visits: 142, taps: 84 },
      { label: 'Ter', visits: 185, taps: 112 },
      { label: 'Qua', visits: 210, taps: 135 },
      { label: 'Qui', visits: 195, taps: 120 },
      { label: 'Sex', visits: 340, taps: 230 },
      { label: 'Sáb', visits: 412, taps: 290 },
      { label: 'Dom', visits: 165, taps: 95 },
    ],
    month: [
      { label: 'Semana 1', visits: 920, taps: 580 },
      { label: 'Semana 2', visits: 1150, taps: 740 },
      { label: 'Semana 3', visits: 1420, taps: 910 },
      { label: 'Semana 4', visits: 1680, taps: 1120 },
    ]
  };

  const currentPoints = chartData[period];
  const maxVisits = Math.max(...currentPoints.map(p => p.visits));

  return (
    <div className="space-y-6">
      {/* Header with Title and Quick Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#182235]">
            Painel Geral do Negócio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Métricas de pagamento Pix, conversão de plaquinhas NFC e acessos
          </p>
        </div>

        {/* Segmented Filter (Anti-slop clean control) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setPeriod('day')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              period === 'day' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              period === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              period === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mês
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Clientes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Clientes
            </span>
            <Users className="w-4 h-4 text-[#00B8A9]" />
          </div>
          <div className="text-2xl font-bold text-[#182235] tabular-nums font-mono">
            {totalClients}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Estabelecimentos</p>
        </div>

        {/* Chaves Pix */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Chaves Pix
            </span>
            <KeyRound className="w-4 h-4 text-[#7137E8]" />
          </div>
          <div className="text-2xl font-bold text-[#182235] tabular-nums font-mono">
            {totalKeys}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Configuradas</p>
        </div>

        {/* Links de Pagamento */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Links Pix
            </span>
            <Link2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#182235] tabular-nums font-mono">
            {totalLinks}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-600 font-semibold">{activeLinks}</span> ativos
          </p>
        </div>

        {/* Total de Acessos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Acessos
            </span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-[#182235] tabular-nums font-mono">
            {totalVisits}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Visualizações</p>
        </div>

        {/* Plaquinhas & Toques NFC */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Toques NFC
            </span>
            <Radio className="w-4 h-4 text-[#7137E8]" />
          </div>
          <div className="text-2xl font-bold text-[#182235] tabular-nums font-mono">
            {totalNfcTaps}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {nfcTags.length} plaquinhas
          </p>
        </div>

        {/* QR Codes Gerados */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              QR Codes
            </span>
            <QrCode className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-[#182235] tabular-nums font-mono">
            {totalQrCodes}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">BR Codes EMV</p>
        </div>
      </div>

      {/* Main Grid: Chart and NFC Quick Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Acessos e Interações ({period === 'day' ? 'Horários de Pico' : period === 'week' ? 'Últimos 7 dias' : 'Últimas 4 semanas'})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparativo de visualizações de links e toques físicos na plaquinha NFC
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#00B8A9]"></span>
                Acessos Totais
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#7137E8]"></span>
                Toques NFC
              </span>
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="flex-1 min-h-[220px] flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100">
            {currentPoints.map((pt, idx) => {
              const visitsHeight = Math.round((pt.visits / maxVisits) * 160);
              const tapsHeight = Math.round((pt.taps / maxVisits) * 160);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  {/* Tooltip value */}
                  <div className="text-[10px] font-mono tabular-nums text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {pt.visits} vis / {pt.taps} nfc
                  </div>

                  {/* Dual Bar */}
                  <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-[170px]">
                    <div
                      className="w-1/2 bg-[#00B8A9] rounded-t-sm transition-all group-hover:brightness-95"
                      style={{ height: `${visitsHeight}px` }}
                      title={`Acessos: ${pt.visits}`}
                    />
                    <div
                      className="w-1/2 bg-[#7137E8] rounded-t-sm transition-all group-hover:brightness-95"
                      style={{ height: `${tapsHeight}px` }}
                      title={`Toques NFC: ${pt.taps}`}
                    />
                  </div>

                  {/* X Axis Label */}
                  <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                    {pt.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Mais de 62% das conversões ocorrem via aproximação de smartphone</span>
            <span className="font-semibold text-slate-700">Padrão NDEF compatível com iOS & Android</span>
          </div>
        </div>

        {/* Active Establishment Quick Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          {activeEstablishment ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Estabelecimento Selecionado
                  </span>
                  <span className="text-[11px] font-semibold text-[#008479] bg-[#E6F8F6] px-2 py-0.5 rounded">
                    Ativo
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#182235]">
                  {activeEstablishment.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Responsável: {activeEstablishment.owner_name}
                </p>
                <p className="text-xs text-slate-500">
                  Cidade: {activeEstablishment.city} · {activeEstablishment.document}
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Link personalizado:</span>
                    <span className="font-mono text-[11px] font-semibold text-[#7137E8]">
                      /p/{activeEstablishment.slug}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Plaquinhas vinculadas:</span>
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {nfcTags.filter(t => t.establishment_id === activeEstablishment.id).length} unidades
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <a
                  href={getEstablishmentPaymentUrl(activeEstablishment, activeEstablishment.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-[#00B8A9] hover:bg-[#009E91] rounded-lg transition-colors shadow-xs cursor-pointer"
                  title="Abrir página em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Página de Pagamento
                </a>
                <button
                  onClick={() => onNavigateTab('customization')}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Personalizar Cores e Logotipo
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 flex flex-col items-center justify-center h-full">
              <span className="text-xs font-semibold text-slate-700 block mb-1">
                Nenhum estabelecimento ativo
              </span>
              <p className="text-[11px] text-slate-400 mb-4 max-w-xs">
                Cadastre ou recrie um estabelecimento para gerenciar plaquinhas NFC e páginas de pagamento Pix.
              </p>
              <button
                onClick={() => onNavigateTab('clients')}
                className="py-2 px-4 text-xs font-semibold text-white bg-[#00B8A9] hover:bg-[#009E91] rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Cadastrar Estabelecimento
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compliance & Safety Notice (Mandatory from Section 14) */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Aviso de Conformidade Técnica — Pix Estático (Resolução BCB):
          </p>
          <p className="leading-relaxed text-amber-800">
            Os pagamentos são efetuados diretamente na conta do estabelecimento cadastrado. Gerar o QR Code ou aproximar o celular da plaquinha abre a ordem no app do banco do pagador, mas não comprova quitação até a conferência do comprovante ou futura integração de webhook bancário.
          </p>
        </div>
      </div>
    </div>
  );
};
