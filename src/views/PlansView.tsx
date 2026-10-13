import React from 'react';
import {
  CreditCard,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Radio,
  Store,
  BarChart3
} from 'lucide-react';
import { PlanDefinition, PlanTier } from '../types';
import { PLANS } from '../services/store';

interface PlansViewProps {
  currentPlanTier: PlanTier;
  onChangePlan: (tier: PlanTier) => void;
}

export const PlansView: React.FC<PlansViewProps> = ({
  currentPlanTier,
  onChangePlan
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-[#182235]">
          Planos e Assinaturas Meu Pix NFC
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Escolha a estrutura ideal para a escala de plaquinhas NFC e links de pagamento do seu negócio
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {PLANS.map(plan => {
          const isCurrent = plan.id === currentPlanTier;
          const isPro = plan.id === 'profissional';

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-5 border flex flex-col justify-between transition-all relative ${
                isCurrent
                  ? 'border-[#00B8A9] ring-2 ring-[#00B8A9]/20 shadow-sm'
                  : isPro
                  ? 'border-[#7137E8] shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {isPro && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7137E8] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Mais Popular
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00B8A9] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Seu Plano Ativo
                </div>
              )}

              <div>
                <div className="mb-4">
                  <h3 className="font-bold text-base text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                    {plan.target_audience}
                  </p>
                </div>

                {/* Price Display */}
                <div className="mb-5 pb-4 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#182235] tabular-nums font-mono">
                      {plan.price_monthly === 0 ? 'Grátis' : `R$ ${plan.price_monthly}`}
                    </span>
                    {plan.price_monthly > 0 && (
                      <span className="text-xs text-slate-400 font-medium">/mês</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Cobrança sem fidelidade
                  </span>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#00B8A9] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={() => onChangePlan(plan.id)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : isPro
                      ? 'bg-[#7137E8] hover:bg-[#6025D8] text-white shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isCurrent ? (
                    'Plano Ativo'
                  ) : (
                    <>
                      <span>Mudar para {plan.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-hidden">
        <h3 className="font-bold text-sm text-slate-900 mb-4">
          Matriz Comparativa de Recursos e Limites
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Recurso / Capacidade</th>
                <th className="py-2.5 px-3 text-center">Gratuito</th>
                <th className="py-2.5 px-3 text-center">Essencial</th>
                <th className="py-2.5 px-3 text-center">Profissional</th>
                <th className="py-2.5 px-3 text-center">Empresarial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-3 font-medium">Limite de Links Pix</td>
                <td className="py-3 px-3 text-center font-mono">Até 3</td>
                <td className="py-3 px-3 text-center font-mono">Até 20</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-[#008479]">Ilimitado</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-[#008479]">Ilimitado</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium">Gestão de Plaquinhas NFC</td>
                <td className="py-3 px-3 text-center text-slate-300">—</td>
                <td className="py-3 px-3 text-center text-slate-300">—</td>
                <td className="py-3 px-3 text-center font-bold text-[#7137E8]">Completa</td>
                <td className="py-3 px-3 text-center font-bold text-[#7137E8]">Completa</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium">Redirecionamento Dinâmico de Tags</td>
                <td className="py-3 px-3 text-center text-slate-300">—</td>
                <td className="py-3 px-3 text-center text-slate-300">—</td>
                <td className="py-3 px-3 text-center font-semibold text-emerald-600">Sim</td>
                <td className="py-3 px-3 text-center font-semibold text-emerald-600">Sim</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium">Personalização Visual e Logotipo</td>
                <td className="py-3 px-3 text-center text-slate-300">Padrão</td>
                <td className="py-3 px-3 text-center">Básica</td>
                <td className="py-3 px-3 text-center font-semibold text-emerald-600">Avançada</td>
                <td className="py-3 px-3 text-center font-semibold text-emerald-600">Avançada</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium">Múltiplos Estabelecimentos</td>
                <td className="py-3 px-3 text-center font-mono">1</td>
                <td className="py-3 px-3 text-center font-mono">1</td>
                <td className="py-3 px-3 text-center font-mono">Até 3</td>
                <td className="py-3 px-3 text-center font-mono font-bold">Até 10</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
