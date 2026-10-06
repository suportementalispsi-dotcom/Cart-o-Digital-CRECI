import React from "react";
import { ShieldAlert, Check, HelpCircle, ArrowRight, Zap, Sparkles, Star, Award, Landmark, User, Heart } from "lucide-react";

interface SaaSUpgradeScreenProps {
  currentPlanId: string;
  requiredFeature: string;
  targetTabName?: string;
  onUpgrade: (targetPlanId: string) => void;
}

export default function SaaSUpgradeScreen({
  currentPlanId,
  requiredFeature,
  targetTabName,
  onUpgrade
}: SaaSUpgradeScreenProps) {
  
  const plansComparison = [
    {
      id: "plan-starter",
      name: "Corretor Essencial",
      badge: "Iniciante",
      price: 97,
      limits: {
        users: "1 Usuário",
        leads: "100 Leads Ativos",
        properties: "50 Imóveis Cadastrados"
      },
      features: [
        "Cartão de visita digital premium",
        "QR Code estático simples",
        "CRM imobiliário básico",
        "Funil de vendas simplificado",
        "Exportação básica em PDF/CSV",
        "WhatsApp integrado convencional"
      ],
      description: "Ideal para corretores iniciantes e autônomos que estão dando os primeiros passos no mercado digital."
    },
    {
      id: "plan-premium", // matched with simulated plan ids in database
      name: "Corretor Premium",
      badge: "Mais Vendido ★",
      price: 297,
      limits: {
        users: "1 Usuário",
        leads: "5.000 Leads Ativos",
        properties: "Imóveis Ilimitados"
      },
      features: [
        "Tudo do plano Essencial",
        "Analytics Avançado de Performance",
        "Inteligência Artificial (Consultor Gemini API)",
        "Automações de Fluxo e Notificações",
        "Lead Scoring inteligente em tempo real",
        "Segmentação comportamental avançada",
        "Exportação avançada p/ Excel e Google Sheets",
        "Integrações Externas (HubSpot, RD Station)"
      ],
      description: "O plano mais completo para corretores autônomos escalarem suas vendas utilizando IA."
    },
    {
      id: "plan-imob",
      name: "Imobiliária",
      badge: "Corporativo",
      price: 497,
      limits: {
        users: "Usuários Ilimitados",
        leads: "Leads Ilimitados",
        properties: "Imóveis Ilimitados"
      },
      features: [
        "Tudo do plano Corretor Premium",
        "Gestão de equipes e sub-corretores",
        "Painel administrativo corporativo",
        "Roteamento automático de leads",
        "Regras customizadas de distribuição",
        "Ranking de corretores e metas",
        "Auditoria interna e logs corporativos",
        "Gerente de contas dedicado"
      ],
      description: "Desenhado sob medida para imobiliárias, incorporadoras e equipes comerciais de alta performance."
    }
  ];

  // Suggest the correct plan to upgrade to based on requirements
  const isCurrentlyStarter = currentPlanId === "plan-starter";
  const requiredPlanToUnlock = requiredFeature.toLowerCase().includes("equipe") || 
                               requiredFeature.toLowerCase().includes("imobiliária") || 
                               requiredFeature.toLowerCase().includes("roteamento") || 
                               requiredFeature.toLowerCase().includes("concorrência") ? "plan-imob" : "plan-premium";

  const targetPlanObj = plansComparison.find(p => p.id === requiredPlanToUnlock) || plansComparison[1];

  return (
    <div id="saas_upgrade_boundary" className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-8 max-w-5xl mx-auto my-4 relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 right-0 w-[20%] h-[20%] rounded-full bg-amber-500/10 blur-[80px] pointer-events-none"></div>
      
      {/* Locked Alert Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-2">
          <ShieldAlert className="h-6 w-6 animate-pulse" />
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
          Recurso Exclusivo
        </h3>
        <p className="text-sm text-slate-300">
          Você tentou acessar <span className="text-amber-400 font-extrabold">{requiredFeature}</span>, que não está liberado no seu plano contratado atual.
        </p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Para garantir a alta performance da ferramenta, este recurso requer o nível de acesso disponível no <span className="text-slate-305 font-bold uppercase">{targetPlanObj.name}</span> ou superior.
        </p>
      </div>

      {/* Target recommended plan banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-600/5 to-transparent border border-amber-500/20 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-black text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full">Recomendado</span>
            <h4 className="font-bold text-white text-base">Faça o Upgrade para {targetPlanObj.name}</h4>
          </div>
          <p className="text-xs text-slate-400">{targetPlanObj.description}</p>
          <div className="flex flex-wrap gap-4 text-[11px] text-slate-300 font-mono pt-1">
            <span>👥 {targetPlanObj.limits.users}</span>
            <span>📍 {targetPlanObj.limits.leads}</span>
            <span>🏢 {targetPlanObj.limits.properties}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-mono">Por apenas</p>
            <p className="text-2xl font-black font-mono text-amber-400">R$ {targetPlanObj.price}<span className="text-[10px] text-slate-500 font-sans font-normal"> /mês</span></p>
          </div>
          <button
            onClick={() => {
              onUpgrade(targetPlanObj.id);
              alert(`🎉 Upgrade processado com sucesso!\nVocê agora tem acesso total aos recursos do plano [${targetPlanObj.name.toUpperCase()}].`);
            }}
            className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/15"
          >
            Ativar Agora <Zap className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Plans Comparison Matrix */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono text-center">
          Compare os Planos Comerciais e Seus Limites
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plansComparison.map((p) => {
            const isUserTarget = p.id === requiredPlanToUnlock;
            const isUserCurrent = p.id === currentPlanId;
            
            return (
              <div 
                key={p.id} 
                className={`bg-slate-950 p-5 rounded-2xl border flex flex-col justify-between relative transition-all duration-300 ${
                  isUserTarget 
                    ? "border-amber-500/80 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/25 scale-[1.01]" 
                    : isUserCurrent 
                      ? "border-teal-500/50 bg-teal-500/[0.01]" 
                      : "border-slate-850"
                }`}
              >
                {isUserCurrent && (
                  <span className="absolute top-3 right-3 bg-teal-500/10 text-teal-400 text-[8px] font-black font-mono px-2 py-0.5 rounded-full uppercase border border-teal-500/20">
                    Seu Plano Atual
                  </span>
                )}
                {!isUserCurrent && isUserTarget && (
                  <span className="absolute top-3 right-3 bg-amber-500 text-black text-[8px] font-black font-mono px-2 py-0.5 rounded-full uppercase font-extrabold tracking-wider">
                    Recomendado p/ Desbloquear
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase font-black tracking-widest">{p.badge}</p>
                    <h5 className="font-extrabold text-sm text-slate-100 mt-0.5">{p.name}</h5>
                    <p className="text-xl font-black font-mono text-amber-500 mt-1">
                      R$ {p.price}<span className="text-[10px] font-sans font-normal text-slate-500"> /mês</span>
                    </p>
                  </div>

                  {/* Limits block */}
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-900 text-[10px] font-mono text-slate-400 divide-y divide-slate-850">
                    <div className="pb-1 text-slate-350">👥 Usuários: <strong className="text-slate-100">{p.limits.users}</strong></div>
                    <div className="py-1 text-slate-350">📍 Leads: <strong className="text-slate-100">{p.limits.leads}</strong></div>
                    <div className="pt-1 text-slate-350">🏢 Imóveis: <strong className="text-slate-100">{p.limits.properties}</strong></div>
                  </div>

                  {/* Features list */}
                  <ul className="text-[10px] space-y-1.5 text-slate-400 border-t border-slate-900 pt-3">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-slate-350 leading-normal">
                        <span className="text-amber-500 font-bold shrink-0">✓</span>
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onUpgrade(p.id);
                    alert(`🎉 Plano alterado para [${p.name.toUpperCase()}] com sucesso!`);
                  }}
                  disabled={isUserCurrent}
                  className={`w-full mt-5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition ${
                    isUserCurrent 
                      ? "bg-slate-900 border border-slate-850 text-slate-600 cursor-not-allowed" 
                      : "bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-250 cursor-pointer hover:text-amber-500"
                  }`}
                >
                  {isUserCurrent ? "Plano Atual Ativo" : `Migrar para ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Guarantee Badge */}
      <div className="text-center border-t border-slate-850 pt-5 text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-2">
        <span>🔒 Garantia de Cancelamento de 7 Dias sem taxas adicionais</span>
        <span className="hidden sm:inline">•</span>
        <span>💳 Faturamento unificado via Stripe com Encriptação Segura SSL de 256 bits</span>
      </div>
    </div>
  );
}
