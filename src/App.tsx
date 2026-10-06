import React, { useState, useEffect } from "react";
import { 
  Building2, Users, RefreshCw, Sparkles, Smartphone, Laptop, 
  Layers, Check, AlertTriangle, KeyRound
} from "lucide-react";
import CrmPortal from "./components/CrmPortal";
import DigitalCard from "./components/DigitalCard";
import AuthGateway from "./components/AuthGateway";
import { Lead, Property, BrokerProfile, AppStats, AutomationRule, SaaSPlan, UserSession } from "./types";
import { LogOut } from "lucide-react";

export default function App() {
  const [viewMode, setViewMode] = useState<"dual" | "portal" | "card">("dual");
  
  // Account session state simulating LGPD-compliant login persistency (Remember-me)
  const [session, setSession] = useState<UserSession | null>(() => {
    const cached = localStorage.getItem("sb_session");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.loggedIn) return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    localStorage.setItem("sb_session", JSON.stringify(newSession));
    if (newSession.userType === "Imobiliária") {
      setSelectedRole("Imobiliária");
    } else if (newSession.email === "admin@smartbroker.com") {
      setSelectedRole("MASTER ADMIN");
    } else {
      setSelectedRole("Corretor Premium");
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("sb_session");
  };
  
  // App States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [broker, setBroker] = useState<BrokerProfile | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  
  // Selected roles and simulated identification defaults
  const [selectedRole, setSelectedRole] = useState<string>("MASTER ADMIN");
  const [visitorEmail, setVisitorEmail] = useState("lucas.silva@outlook.com");
  const [visitorName, setVisitorName] = useState("Lucas Silva");
  const [visitorPhone, setVisitorPhone] = useState("(91) 98321-4490");

  const [loading, setLoading] = useState(true);

  // Fetch initial system states from server side endpoints
  const fetchSystemData = async () => {
    try {
      const [leadsRes, propRes, brokerRes, statsRes, autoRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/properties"),
        fetch("/api/broker"),
        fetch("/api/stats"),
        fetch("/api/automations")
      ]);

      const [leadsData, propData, brokerData, statsData, autoData] = await Promise.all([
        leadsRes.json(),
        propRes.json(),
        brokerRes.json(),
        statsRes.json(),
        autoRes.json()
      ]);

      setLeads(leadsData);
      setProperties(propData);
      setBroker(brokerData);
      setStats(statsData);
      setAutomations(autoData);

      // Dummy plans seed for SaaS admin tab
      setPlans([
        { id: "plan-starter", name: "Corretor Essencial", price: 97, leadsLimit: 100, features: ["1 corretor", "Até 100 leads", "QR Code estático", "Cartão digital premium", "Suporte e-mail"] },
        { id: "plan-premium", name: "Corretor Premium", price: 297, leadsLimit: 999999, features: ["Corretores ilimitados", "Leads ilimitados", "IA de recomendação e insights", "Automações ilimitadas", "RD Station Hub"] },
        { id: "plan-imob", name: "Imobiliária", price: 497, leadsLimit: 9999999, features: ["Múltiplas equipes", "Divisão automática de leads", "Controle de permissões master", "API de integrações nativa", "Gerente dedicado"] }
      ]);

    } catch (e) {
      console.error("Erro ao puxar dados do servidor:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  // Post dynamic tracking to backend when visitor performs interactions on Digital Card
  const handleTrackVisitorAction = async (
    actionType: string, 
    propertyId?: string, 
    propertyName?: string, 
    details?: string
  ) => {
    try {
      const response = await fetch("/api/leads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadEmail: visitorEmail,
          leadName: visitorName,
          leadPhone: visitorPhone,
          actionType,
          propertyId,
          propertyName,
          details: details || `Cliente ${visitorName} interagiu com ${actionType}`
        })
      });

      if (response.ok) {
        // Trigger soft fetch refresh in UI to update the stats, scoring, logs and insights instantly!
        await fetchSystemData();
      }
    } catch (e) {
      console.error("Erro ao postar tracking comportamental:", e);
    }
  };

  // Change Status value in Pipeline via database PATCH API
  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        await fetchSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete lead in VIP CRM
  const handleDeleteLeadInCrm = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        await fetchSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add new Property inside catalog
  const handleAddNewProperty = async (prop: Omit<Property, "id">) => {
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prop)
      });
      if (response.ok) {
        await fetchSystemData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Hard Reset Database to seed values
  const handleResetDatabase = async () => {
    try {
      const response = await fetch("/api/reset", { method: "POST" });
      if (response.ok) {
        await fetchSystemData();
        alert("Database reinstalado com sucesso para demonstração!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !broker || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white font-sans space-y-4">
        <RefreshCw className="h-10 w-10 text-amber-500 animate-spin" />
        <div className="text-center">
          <h2 className="font-extrabold text-lg text-slate-100 uppercase tracking-wider">Iniciando SmartBroker CRM</h2>
          <p className="text-xs text-slate-500 mt-1">Carregando painel de faturamento, catálogo de imóveis e rastreadores por IA...</p>
        </div>
      </div>
    );
  }

  if (!session || !session.loggedIn) {
    return <AuthGateway onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col justify-between">
      
      {/* GLOBAL HEADER CONTROLS */}
      <header className="bg-slate-900 border-b border-slate-850 px-6 py-4 sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Brand Name */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-amber-500 via-amber-550 to-amber-600 rounded-2xl flex items-center justify-center text-black font-black text-lg shadow-lg shadow-amber-950/20">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">SmartBroker CRM</span>
                <span className="bg-amber-400 text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">ImobLead AI</span>
              </div>
              <p className="text-xs text-slate-400">SaaS Imobiliário Inteligente para Corretores de Alta Conversão</p>
            </div>
          </div>

          {/* VIEW MODE CONTROLLER - Crucial for local dual testing of the tracking loop! */}
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode("dual")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${viewMode === 'dual' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                <Laptop className="h-3.5 w-3.5" /> Visão Dual (Demo Monitor)
              </button>
              <button 
                onClick={() => setViewMode("portal")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${viewMode === 'portal' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                <Layers className="h-3.5 w-3.5" /> Portal do Corretor (CRM)
              </button>
              <button 
                onClick={() => setViewMode("card")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${viewMode === 'card' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Smartphone (Card Premium)
              </button>
            </div>

            {/* Session account banner details (Modulo 20) */}
            <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-1 rounded-xl border border-slate-850/80">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-extrabold text-slate-200 leading-tight truncate max-w-[140px] uppercase font-mono">{session.name}</p>
                <p className="text-[9px] text-amber-500 font-bold leading-none uppercase font-mono">{session.userType}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-rose-500/20 transition cursor-pointer"
                title="Encerrar Sessão Segura"
              >
                <LogOut className="h-3 w-3" /> Sair
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* RENDER VIEW CONDITIONALS */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-6">
        
        {/* DUAL VIEW: side-by-side split CRM on left, Smartphone digital brochure card on right */}
        {viewMode === "dual" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Sales Portal (CRM) on left */}
            <div className="xl:col-span-8 space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-center text-xs text-amber-200">
                <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-bold uppercase tracking-wider">Mecanismo de Rastreamento Comportamental Ativo!</h4>
                  <p className="opacity-93 mt-0.5">
                    Selecione imóveis, favorite itens, solicite agendamentos ou clique nos canais no **Smartphone Preview (à direita)**. O CRM no lado esquerdo atualizará instantaneamente a Linha do Tempo, Leads, Gráficos e o **Lead Score** calculando a qualificação em tempo real!
                  </p>
                </div>
              </div>

              <CrmPortal 
                leads={leads}
                properties={properties}
                broker={broker}
                stats={stats}
                automations={automations}
                plans={plans}
                selectedRole={selectedRole}
                setSelectedRole={setSelectedRole}
                onRefreshData={fetchSystemData}
                onResetDb={handleResetDatabase}
                onUpdateLeadStatus={handleUpdateLeadStatus}
                onDeleteLead={handleDeleteLeadInCrm}
                onAddProperty={handleAddNewProperty}
              />
            </div>

            {/* Smartphone View (Digital card client experience) on right */}
            <div className="xl:col-span-4 sticky top-24">
              <div className="bg-slate-900 rounded-3xl p-3 border border-slate-800 shadow-2xl overflow-hidden relative">
                
                {/* Smartphone notches styling / top speaker simulation */}
                <div className="w-32 h-6 bg-slate-950 rounded-b-2xl mx-auto absolute top-0 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-center">
                  <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-850/80 max-h-[80vh] overflow-y-auto bg-slate-950">
                  <DigitalCard 
                    broker={broker}
                    properties={properties}
                    visitorEmail={visitorEmail}
                    setVisitorEmail={setVisitorEmail}
                    visitorName={visitorName}
                    setVisitorName={setVisitorName}
                    visitorPhone={visitorPhone}
                    setVisitorPhone={setVisitorPhone}
                    onTrackAction={handleTrackVisitorAction}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* FULL PORTAL VIEW: pure responsive sales portal */}
        {viewMode === "portal" && (
          <CrmPortal 
            leads={leads}
            properties={properties}
            broker={broker}
            stats={stats}
            automations={automations}
            plans={plans}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            onRefreshData={fetchSystemData}
            onResetDb={handleResetDatabase}
            onUpdateLeadStatus={handleUpdateLeadStatus}
            onDeleteLead={handleDeleteLeadInCrm}
            onAddProperty={handleAddNewProperty}
          />
        )}

        {/* FULL CARD VIEW: pure client digital brochure styled mobile card */}
        {viewMode === "card" && (
          <div className="max-w-md mx-auto bg-slate-900 rounded-3xl p-3 border border-slate-800/80 shadow-2xl">
            <DigitalCard 
              broker={broker}
              properties={properties}
              visitorEmail={visitorEmail}
              setVisitorEmail={setVisitorEmail}
              visitorName={visitorName}
              setVisitorName={setVisitorName}
              visitorPhone={visitorPhone}
              setVisitorPhone={setVisitorPhone}
              onTrackAction={handleTrackVisitorAction}
            />
          </div>
        )}

      </main>

      {/* PLATFORM TRADEMARK FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-850 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 SmartBroker SaaS. Desenvolvido para Corretores em conformidade com a LGPD e GDPR.</p>
          <div className="flex gap-4 font-mono text-[10px]">
            <span className="hover:text-amber-500 cursor-pointer transition">Políticas de Privacidade</span>
            <span>•</span>
            <span className="hover:text-amber-500 cursor-pointer transition">Termos de Assinatura</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
