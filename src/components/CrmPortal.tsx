import React, { useState, useEffect } from "react";
import { 
  Building2, Users, Flame, Percent, TrendingUp, DollarSign, 
  MapPin, RefreshCw, Sparkles, Phone, Mail, Clock, Plus, 
  Trash2, ShieldCheck, Download, Layers, QrCode, Sliders, 
  CreditCard, ExternalLink, UserCircle, Settings, FileText, CheckCircle, 
  Play, BookOpen, AlertCircle, AlertTriangle, Copy, BarChart3, Smartphone, Laptop,
  ChevronDown, ChevronUp, Globe, Star, Ban, Unlock, Lock, X
} from "lucide-react";
import { Lead, Property, BrokerProfile, AppStats, AutomationRule, SaaSPlan } from "../types";
import SaaSUpgradeScreen from "./SaaSUpgradeScreen";

interface CrmPortalProps {
  leads: Lead[];
  properties: Property[];
  broker: BrokerProfile;
  stats: AppStats;
  automations: AutomationRule[];
  plans: SaaSPlan[];
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  onRefreshData: () => void;
  onResetDb: () => void;
  onUpdateLeadStatus: (leadId: string, newStatus: string) => void;
  onDeleteLead: (leadId: string) => void;
  onAddProperty: (prop: Omit<Property, "id">) => void;
}

export default function CrmPortal({
  leads,
  properties,
  broker,
  stats,
  automations,
  plans,
  selectedRole,
  setSelectedRole,
  onRefreshData,
  onResetDb,
  onUpdateLeadStatus,
  onDeleteLead,
  onAddProperty
}: CrmPortalProps) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // RBAC Role & Plan definition flags (Módulo 25)
  const isMasterAdmin = selectedRole === "MASTER ADMIN" || selectedRole === "Admin Master";
  const isEssencial = selectedRole === "Corretor Essencial" && !isMasterAdmin;
  const isPremium = selectedRole === "Corretor Premium" && !isMasterAdmin;
  const isImobiliaria = (selectedRole === "Imobiliária" || selectedRole === "Gestor Geral") && !isMasterAdmin;
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Property Creation Form states
  const [showAddPropModal, setShowAddPropModal] = useState(false);
  const [newPropData, setNewPropData] = useState({
    title: "", price: 1000000, neighborhood: "Nazaré", city: "Belém",
    bedrooms: 3, suites: 3, area: 150, condoPrice: 800,
    description: "", imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    features: "Piscina, Academia, Sacada Gourmet, Portaria 24h"
  });

  // Integrations state
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>(["whatsapp", "analytics"]);

  // --- MASTER ADMIN STATE (Módulo 25) ---
  const [saasSubTab, setSaasSubTab] = useState<"metrics" | "clients" | "financial" | "modules" | "audit">("metrics");
  const [adminCoupons, setAdminCoupons] = useState<Array<{ code: string; discount: number; active: boolean }>>([
    { code: "MASTER90", discount: 90, active: true },
    { code: "BLACKFRIDAY50", discount: 50, active: true },
    { code: "IMOBELITE", discount: 20, active: true }
  ]);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState(30);

  // Simulated clients list for the Master Admin visual manager
  const [saasClients, setSaasClients] = useState([
    { id: "c1", name: "Gabriel Menezes", email: "gabriel@smartbroker.com", plan: "Corretor Premium", status: "Ativo", creci: "12345-F" },
    { id: "c2", name: "Mariana Souza", email: "mariana@imobparai.com", plan: "Imobiliária", status: "Ativo", creci: "9812-J" },
    { id: "c3", name: "Rodrigo Alencar", email: "rodrigo.corretor@uol.com", plan: "Corretor Essencial", status: "Ativo", creci: "22019-F" },
    { id: "c4", name: "Cláudio Silva Imóveis", email: "claudio@silvaimoveis.com.br", plan: "Imobiliária", status: "Suspenso", creci: "7712-J" }
  ]);

  const [globalModules, setGlobalModules] = useState({
    geminiAi: true,
    automations: true,
    qrCodes: true,
    leadScoring: true,
    digitalCard: true
  });

  const [activeMasterLogs, setActiveMasterLogs] = useState([
    { id: 1, time: "16:45", event: "Stripe Webhook: Recebida assinatura f0219", user: "system_stripe" },
    { id: 2, time: "16:20", event: "Juliana Vasconcelos redefiniu senha JWT", user: "juliana@vip.com" },
    { id: 3, time: "15:40", event: "Admin Master alterou multiplicador global para 1.2x", user: "MASTER ADMIN" },
    { id: 4, time: "15:10", event: "Lead Scoring recalculado para 48 registros ativos", user: "ai_bot" },
    { id: 5, time: "14:15", event: "Mariana Souza exportou XLS (61 leads)", user: "mariana@imobparai.com" }
  ]);

  // SaaS Pricing dynamic multiplier state
  const [planMultiplier, setPlanMultiplier] = useState<number>(1.0);

  // Security and LGPD Logs state
  const [lgpdEnabled, setLgpdEnabled] = useState(true);
  const [securityLogs, setSecurityLogs] = useState<Array<{ time: string; event: string; user: string }>>([
    { time: "14:52", event: "Autenticação 2FA Bem-sucedida", user: "gabriel@smartbroker.com" },
    { time: "14:20", event: "Exportação de Leads (CSV)", user: "gabriel@smartbroker.com" },
    { time: "11:10", event: "Ajuste de Fluxo Automático", user: "gabriel@smartbroker.com" }
  ]);

  // --- STATE FOR MÓDULO 21: Meu Perfil Corretor ---
  const [personalCpf, setPersonalCpf] = useState("123.456.789-00");
  const [personalRg, setPersonalRg] = useState("8273615-PA");
  const [personalDob, setPersonalDob] = useState("1988-10-15");
  const [brokerSpecialty, setBrokerSpecialty] = useState("Lançamentos de Alto Padrão");
  const [brokerSegment, setBrokerSegment] = useState("Residencial de Luxo");
  const [brokerExperience, setBrokerExperience] = useState("8 anos");
  const [brokerPersonalLogo, setBrokerPersonalLogo] = useState("https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=150&q=80");
  
  // Custom presentation & card colors (Modulo 21 Digital Card settings)
  const [cardBgColor, setCardBgColor] = useState("slate-950"); // default style theme
  const [cardPresentationText, setCardPresentationText] = useState("Olá! Sou corretor especialista no mercado imobiliário em Belém. Auxilio você a encontrar o imóvel perfeito com o atendimento exclusivo que você merece.");
  const [savingBroker, setSavingBroker] = useState(false);

  // --- STATE FOR MÓDULO 22: Gestão de Imobiliária ---
  const [agencyData, setAgencyData] = useState({
    companyName: "SmartBroker Imobiliária Ltda",
    fantasyName: "SmartBroker Premium Imóveis",
    cnpj: "12.345.678/0001-99",
    creciJuridico: "9010-J",
    address: "Av. Doca de Souza Franco, 1001 - Umarizal",
    city: "Belém",
    state: "PA",
    phone: "(91) 3211-9000",
    whatsapp: "(91) 98112-9900",
    email: "diretoria@smartbroker.com.br",
    website: "https://www.smartbroker.com.br",
    logo: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=150&q=80",
    cover: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    primaryColor: "#f59e0b"
  });

  const [team, setTeam] = useState<any[]>([
    { id: "agent-1", name: "Gabriel Menezes", email: "gabriel@smartbroker.com", phone: "(91) 98124-5512", creci: "12345-F", role: "Supervisor", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", status: "active" },
    { id: "agent-2", name: "Mariana Costa", email: "mariana.costa@smartbroker.com", phone: "(91) 98331-5023", creci: "15920-F", role: "Corretor Sênior", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", status: "active" },
    { id: "agent-3", name: "Carlos Lima", email: "carlos.lima@smartbroker.com", phone: "(91) 98214-9912", creci: "19056-F", role: "Corretor Júnior", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", status: "active" }
  ]);
  const [transferLeadId, setTransferLeadId] = useState("");
  const [transferTargetAgentId, setTransferTargetAgentId] = useState("");

  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPhone, setNewAgentPhone] = useState("");
  const [newAgentCreci, setNewAgentCreci] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("Corretor Júnior");

  // --- STATE FOR MÓDULO 23: Planos e Assinaturas (Módulos 26 & 27) ---
  const [activePlanId, setActivePlanId] = useState("plan-premium");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [subscriptionStatus, setSubscriptionStatus] = useState<"Ativo" | "Trial" | "Pendente" | "Suspenso" | "Cancelado">("Ativo");
  
  // Trial Configs
  const [trialDurationDays, setTrialDurationDays] = useState<number>(14);
  const [trialExpiredSimulation, setTrialExpiredSimulation] = useState<boolean>(false);
  
  // Checkout & Coupon Configs
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [pendingMigratePlanId, setPendingMigratePlanId] = useState<string | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<"credit" | "pix" | "boleto" | "debito">("credit");
  
  const [paymentMethod, setPaymentMethod] = useState({
    brand: "Visa",
    last4: "9918",
    holder: "GABRIEL MENEZES"
  });
  
  // Simulated credit cards list
  const [editCardBrand, setEditCardBrand] = useState("Visa");
  const [editCardNum, setEditCardNum] = useState("4532 9018 7762 9918");
  const [editCardHolder, setEditCardHolder] = useState("GABRIEL MENEZES");
  const [showPaymentCardForm, setShowPaymentCardForm] = useState(false);

  // Hidden admin login modal controls & security logs
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminMfaInput, setAdminMfaInput] = useState("");
  const [loginFailedAttempts, setLoginFailedAttempts] = useState(0);
  const [loginLockoutUntil, setLoginLockoutUntil] = useState<number | null>(null);
  const [adminLoginState, setAdminLoginState] = useState<"login" | "mfa" | "success">("login");
  const [adminIpLog, setAdminIpLog] = useState("192.168.1.102");
  
  // Impersonating controls
  const [impersonatingUser, setImpersonatingUser] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<any[]>([
    { id: "INV-003", date: "2026-06-01", value: 149.00, status: "Pago", url: "#", planName: "Corretor Premium" },
    { id: "INV-002", date: "2026-05-01", value: 149.00, status: "Pago", url: "#", planName: "Corretor Premium" },
    { id: "INV-001", date: "2026-04-01", value: 149.00, status: "Pago", url: "#", planName: "Corretor Premium" }
  ]);
  
  // --- STATE FOR MÓDULO 24: Central de Exportações & Relatórios ---
  const [exportFormat, setExportFormat] = useState<"PDF" | "XLSX" | "CSV" | "Google Sheets">("CSV");
  const [reportSchedulerType, setReportSchedulerType] = useState<"diario" | "semanal" | "mensal">("semanal");
  const [scheduleEmailDestination, setScheduleEmailDestination] = useState("diretoria@smartbroker.com.br");
  const [activeSchedules, setActiveSchedules] = useState<any[]>([
    { id: "sched-1", type: "semanal", destination: "diretoria@smartbroker.com.br", active: true, format: "PDF" }
  ]);

  // Primary editable states for CRM broker profiles sync
  const [brokerName, setBrokerName] = useState(broker.name);
  const [brokerCreci, setBrokerCreci] = useState(broker.creci);
  const [brokerBio, setBrokerBio] = useState(broker.bio);
  const [brokerCity, setBrokerCity] = useState(broker.city);
  const [brokerWhatsapp, setBrokerWhatsapp] = useState(broker.whatsapp);
  const [brokerEmail, setBrokerEmail] = useState(broker.email);
  const [brokerSite, setBrokerSite] = useState(broker.site);
  const [brokerInstagram, setBrokerInstagram] = useState(broker.instagram);
  const [brokerLinkedin, setBrokerLinkedin] = useState(broker.linkedin);
  const [brokerFacebook, setBrokerFacebook] = useState(broker.facebook);
  const [brokerYoutube, setBrokerYoutube] = useState(broker.youtube);
  const [brokerPhoto, setBrokerPhoto] = useState(broker.photo);

  useEffect(() => {
    if (broker) {
      setBrokerName(broker.name);
      setBrokerCreci(broker.creci);
      setBrokerBio(broker.bio);
      setBrokerCity(broker.city);
      setBrokerWhatsapp(broker.whatsapp);
      setBrokerEmail(broker.email);
      setBrokerSite(broker.site);
      setBrokerInstagram(broker.instagram);
      setBrokerLinkedin(broker.linkedin);
      setBrokerFacebook(broker.facebook);
      setBrokerYoutube(broker.youtube);
      setBrokerPhoto(broker.photo);
    }
  }, [broker]);

  // Synchronize dynamic role selections to match SaaS billing plans for quick testing of Module 25
  useEffect(() => {
    if (selectedRole === "Admin Master" || selectedRole === "MASTER ADMIN") {
      // MASTER ADMIN has permanent, unlimited, unrestricted system access
    } else if (selectedRole === "Corretor Essencial") {
      if (activePlanId !== "plan-starter") setActivePlanId("plan-starter");
    } else if (selectedRole === "Corretor Premium") {
      if (activePlanId !== "plan-premium") setActivePlanId("plan-premium");
    } else if (selectedRole === "Imobiliária" || selectedRole === "Gestor Geral") {
      if (activePlanId !== "plan-imob") setActivePlanId("plan-imob");
    }
  }, [selectedRole]);

  // FRONTEND ACCESS CONTROL MIDDLEWARE RULES (Módulo 25 / RBAC)
  const isProtectedTab = (tab: string): "access_denied" | "upgrade_imob" | "upgrade_automations" | null => {
    if (tab === "saas" && !isMasterAdmin) {
      return "access_denied";
    }
    if (tab === "imobiliaria" && (isEssencial || isPremium)) {
      return "upgrade_imob";
    }
    if (tab === "automations" && isEssencial) {
      return "upgrade_automations";
    }
    return null;
  };

  const handleNavigateTab = (targetTab: string) => {
    const protection = isProtectedTab(targetTab);
    
    if (protection === "access_denied") {
      // Push safety intercept log in Master Admin activity streams
      const attemptTime = new Date().toLocaleTimeString().slice(0, 5);
      const logMsg = `MIDDLEWARE INTERCEPTED: Tentativa de acesso bloqueada à rota restrita [/api/admin/${targetTab.toUpperCase()}] por perfil [${selectedRole}]`;
      
      setActiveMasterLogs(prev => [
        { id: Date.now(), time: attemptTime, event: logMsg, user: "security_middleware" },
        ...prev
      ]);
      setSecurityLogs(prev => [
        { time: attemptTime, event: `Bloqueio: Acesso administrativo em /${targetTab}`, user: selectedRole || "Desconhecido" },
        ...prev
      ]);
    } else if (protection) {
      const attemptTime = new Date().toLocaleTimeString().slice(0, 5);
      const targetFeature = targetTab === "imobiliaria" ? "Gestão de Imobiliária Multiusuário" : "Automação de Fluxos";
      const logMsg = `MIDDLEWARE UPGRADE REDIRECT: Usuário [${selectedRole}] tentou acessar '${targetFeature}' (Plano insuficiente)`;
      
      setActiveMasterLogs(prev => [
        { id: Date.now(), time: attemptTime, event: logMsg, user: "saas_middleware" },
        ...prev
      ]);
    }
    
    // Set active tab - our rendering middleware inside the portal container will render either the component or the lock.
    setActiveTab(targetTab);
  };

  // COMPONENTE GESTOR DE ACESSO NEGADO (MIDDLEWARE VISUAL PANEL)
  const AccessDeniedScreen = ({ requiredRole, currentRole, tabName }: { requiredRole: string, currentRole: string, tabName: string }) => {
    return (
      <div id="access_denied_middleware_view" className="bg-slate-950/70 border border-slate-850 rounded-3xl p-8 max-w-xl mx-auto my-8 space-y-6 text-center shadow-2xl animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full pointer-events-none"></div>
        
        {/* Animated shield lock visual */}
        <div className="inline-flex relative">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl animate-pulse">
            <Lock className="h-8 w-8" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] font-black items-center justify-center text-white">!</span>
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-rose-500 uppercase tracking-tight font-mono">
            🛡️ ACESSO NEGADO: RECURSO RESTRITO
          </h3>
          <p className="text-xs text-slate-350 max-w-md mx-auto leading-relaxed">
            O middleware de controle de acessos da SmartBroker interceptou uma tentativa de navegação para a rota administrativa <span className="font-mono text-amber-400 font-extrabold select-all">/api/admin/{tabName}</span>.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl text-left space-y-2.5">
          <p className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">
            Logs do Middleware de Segurança (TLS Active):
          </p>
          <div className="space-y-1.5 font-mono text-[10px] text-slate-300">
            <p className="flex justify-between border-b border-slate-850/60 pb-1">
              <span className="text-slate-500">Nível de Permissão Logado:</span>
              <span className="text-rose-455 font-bold text-rose-400">{currentRole}</span>
            </p>
            <p className="flex justify-between border-b border-slate-850/60 pb-1">
              <span className="text-slate-500">Credencial Requerida:</span>
              <span className="text-amber-500 font-bold">{requiredRole}</span>
            </p>
            <p className="flex justify-between border-b border-slate-850/60 pb-1">
              <span className="text-slate-500">Destino Solicitado:</span>
              <span className="text-slate-100">{tabName === "saas" ? "Painel Master Admin / Faturamento" : "Recurso Comercial Corp"}</span>
            </p>
            <p className="flex justify-between border-b border-slate-850/60 pb-1">
              <span className="text-slate-500">Status de Rede:</span>
              <span className="text-emerald-500">● Criptografado (TLS/JWT Active)</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-500">Ação de Segurança de Rotas:</span>
              <span className="text-amber-400 font-bold uppercase">Bloqueio Preventivo Middleware RBAC</span>
            </p>
          </div>
        </div>

        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-left flex items-start gap-3">
          <AlertTriangle className="text-amber-550 h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h5 className="font-bold text-slate-200 text-[11px] uppercase">Como resolver este bloqueio técnico?</h5>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              Para validar o seu dispositivo e liberar este painel, utilize o seletor rápido no topo da barra lateral e escolha <strong className="text-amber-400">👑 MASTER ADMIN</strong>. Caso queira simular a verificação de duplo fator (2FA), o portal de login administrativo integrará as chaves encriptadas.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wide rounded-xl transition cursor-pointer"
          >
            ← Voltar para Dashboard
          </button>
          <button
            onClick={() => {
              setAdminLoginState("login");
              setAdminEmailInput("");
              setAdminPasswordInput("");
              setAdminMfaInput("");
              setShowAdminLoginModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/10"
          >
            Autenticar Master Admin Key →
          </button>
        </div>
      </div>
    );
  };

  // --- MASTER ADMIN SECURITY & LOCKOUT ACTIONS ---
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!loginLockoutUntil) return;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((loginLockoutUntil - Date.now()) / 1000));
      setLockoutRemainingSeconds(rem);
      if (rem <= 0) {
        setLoginLockoutUntil(null);
        setLoginFailedAttempts(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [loginLockoutUntil]);

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginLockoutUntil && Date.now() < loginLockoutUntil) {
      alert("Acesso temporariamente bloqueado por proteção Brute-Force!");
      return;
    }

    if (adminEmailInput === "admin@smartbroker.com.br" && adminPasswordInput === "admin123") {
      setAdminLoginState("mfa");
      setLoginFailedAttempts(0);
    } else {
      const nextFailures = loginFailedAttempts + 1;
      setLoginFailedAttempts(nextFailures);
      
      const ip = "187.95.101.44";
      const browser = "Chrome v122 / macOS (Intel)";
      const logEvent = `Falha de login Master Admin (Tentativa ${nextFailures}/3) - IP: ${ip} [${browser}]`;
      
      setActiveMasterLogs(prev => [
        { id: Date.now(), time: new Date().toLocaleTimeString().slice(0, 5), event: logEvent, user: "security_center" },
        ...prev
      ]);
      
      if (nextFailures >= 3) {
        const lockDuration = 30000; // 30 seconds
        const lockUntil = Date.now() + lockDuration;
        setLoginLockoutUntil(lockUntil);
        setLockoutRemainingSeconds(30);
        
        setActiveMasterLogs(prev => [
          { id: Date.now() + 1, time: new Date().toLocaleTimeString().slice(0, 5), event: `PROTEÇÃO BRUTE-FORCE ATIVADA: Painel bloqueado por 30 segundos`, user: "system" },
          ...prev
        ]);
        alert("🔒 Intrusão detectada! Múltiplas falhas de credenciais detectadas. Painel bloqueado por 30 segundos por motivos de segurança.");
      } else {
        alert(`❌ E-mail ou chave de acesso incorretos! (${nextFailures} de 3 tentativas)`);
      }
    }
  };

  const handleAdminMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminMfaInput === "123456") {
      setAdminLoginState("success");
      setSelectedRole("MASTER ADMIN");
      
      const ip = "187.95.101.44";
      const browser = "Chrome v122 / macOS (Intel)";
      const detailLog = `Master Admin Autenticado com sucesso via IP: ${ip} (${browser})`;
      
      setActiveMasterLogs(prev => [
        { id: Date.now(), time: new Date().toLocaleTimeString().slice(0, 5), event: detailLog, user: "MASTER ADMIN" },
        ...prev
      ]);
      setSecurityLogs(prev => [
        { time: new Date().toLocaleTimeString().slice(0, 5), event: "Login Master Admin (2FA)", user: "admin@smartbroker.com.br" },
        ...prev
      ]);
      
      alert("✅ Conectado com sucesso como MASTER ADMIN!");
      setShowAdminLoginModal(false);
      setActiveTab("saas");
    } else {
      alert("❌ Código verificador 2FA incorreto! Digite o token rotativo exibido na sincronia de segurança.");
    }
  };

  const handleUpgradePlan = (targetPlanId: string) => {
    setActivePlanId(targetPlanId);
    if (targetPlanId === "plan-starter" || targetPlanId === "plan-essencial") {
      setSelectedRole("Corretor Essencial");
    } else if (targetPlanId === "plan-premium" || targetPlanId === "plan-pro") {
      setSelectedRole("Corretor Premium");
    } else if (targetPlanId === "plan-imob" || targetPlanId === "plan-imobiliaria") {
      setSelectedRole("Imobiliária");
    }
  };

  const handleSaveBrokerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBroker(true);
    try {
      const response = await fetch("/api/broker", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brokerName,
          creci: brokerCreci,
          bio: brokerBio,
          city: brokerCity,
          whatsapp: brokerWhatsapp,
          email: brokerEmail,
          site: brokerSite,
          instagram: brokerInstagram,
          linkedin: brokerLinkedin,
          facebook: brokerFacebook,
          youtube: brokerYoutube,
          photo: brokerPhoto,
          // Custom metadata fields passed safely
          customCpf: personalCpf,
          customRg: personalRg,
          customDob: personalDob,
          specialty: brokerSpecialty,
          segment: brokerSegment,
          experience: brokerExperience,
          personalLogo: brokerPersonalLogo,
          cardBgColor: cardBgColor,
          cardPresentationText: cardPresentationText
        })
      });
      if (response.ok) {
        await triggerRefresh();
        alert("🎉 Perfil e configurações do Cartão Digital salvos com sucesso!\nAs configurações de visualização, cores e dados do corretor foram propagadas ao smartphone preview instantaneamente.");
      }
    } catch (err) {
      console.error(err);
      alert("Houve um erro ao atualizar os dados do corretor no servidor.");
    } finally {
      setSavingBroker(false);
    }
  };

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName || !newAgentEmail) return;
    const newAgent = {
      id: `agent-${Date.now()}`,
      name: newAgentName,
      email: newAgentEmail,
      phone: newAgentPhone || "(91) 98112-9018",
      creci: newAgentCreci || "S/CRECI",
      role: newAgentRole,
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      status: "active" as const
    };
    setTeam(prev => [...prev, newAgent]);
    setNewAgentName("");
    setNewAgentEmail("");
    setNewAgentPhone("");
    setNewAgentCreci("");
    alert(`Corretor [${newAgent.name}] adicionado à equipe comercial.`);
  };

  const handleRemoveAgent = (agentId: string, agentName: string) => {
    if (confirm(`Tem certeza que deseja remover [${agentName}] da equipe comercial?`)) {
      setTeam(prev => prev.filter(x => x.id !== agentId));
    }
  };

  const handleUpdateAgentRole = (agentId: string, newRole: string) => {
    setTeam(prev => prev.map(a => a.id === agentId ? { ...a, role: newRole } : a));
    alert(`Permissão do corretor atualizada para [${newRole}].`);
  };

  const handleTransferLeads = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferLeadId || !transferTargetAgentId) return;
    const selectedL = leads.find(l => l.id === transferLeadId);
    const selectedA = team.find(t => t.id === transferTargetAgentId);
    if (!selectedL || !selectedA) return;

    // Real-time mutative assignment reflect directly
    selectedL.responsible = selectedA.name;
    alert(`🔄 Suporte de Transferência de Carteira!\nProprietário do lead [${selectedL.name}] alterado.\nAntigo corretor substituído por: [ ${selectedA.name} ] (${selectedA.role})`);
    
    setTransferLeadId("");
    setTransferTargetAgentId("");
    triggerRefresh();
  };

  const handleDownloadCrmData = (dataType: "leads" | "properties" | "analytics") => {
    let content = "";
    let filename = "";

    if (dataType === "leads") {
      content = "ID,Nome,Telefone,E-mail,Cidade,Origem,Responsável,Status,Score,Tags\n" + 
        leads.map(l => `"${l.id}","${l.name}","${l.phone}","${l.email}","${l.city}","${l.origin}","${l.responsible}","${l.status}",${l.score},"${l.tags.join(';')}"`).join("\n");
      filename = "smartbroker_leads_export.csv";
    } else if (dataType === "properties") {
      content = "ID,Titulo,Preco,Bairro,Cidade,Suites,Area_m2\n" + 
        properties.map(p => `"${p.id}","${p.title}",${p.price},"${p.neighborhood}","${p.city}",${p.suites},${p.area}`).join("\n");
      filename = "smartbroker_properties_export.csv";
    } else {
      content = "Metrica,Valor,Frequencia\n" + 
        `"Total de Leads","${stats.totalLeads}","Geral"\n` +
        `"Score Medio",${stats.avgScore},"Geral"\n` +
        `"Cliques WhatsApp",${stats.clicks.whatsapp},"Geral"\n` +
        `"Cliques Salvar Contato",${stats.clicks.saved_contact},"Geral"\n` +
        `"CTR Geral Cliques","${stats.ctr}","Geral"`;
      filename = "smartbroker_analytics_report.csv";
    }

    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Dynamic refresh
  const triggerRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Generate Gemini Sales Insight
  const generateGeminiInsight = async (leadId: string) => {
    setAiInsightLoading(true);
    setAiInsight(null);
    try {
      const response = await fetch("/api/gemini/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await response.json();
      setAiInsight(data);
    } catch (e) {
      console.error(e);
      alert("Houve um erro ao consultar modelo Gemini no servidor.");
    } finally {
      setAiInsightLoading(false);
    }
  };

  // Auto select first lead if none selected when inspecting Funnel
  useEffect(() => {
    if (leads.length && !selectedLead) {
      setSelectedLead(leads[0]);
    }
  }, [leads]);

  // Copy trigger script
  const copyScriptToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Generate Report triggers
  const handleDownloadReport = (format: string) => {
    alert(`📥 Relatório de Leads exportado com sucesso no formato [${format}].\nRegistrado no auditor de segurança em conformidade com a LGPD.`);
    const newLog = {
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      event: `Relatório exportado (${format})`,
      user: `${broker.email} (${selectedRole})`
    };
    setSecurityLogs([newLog, ...securityLogs]);
  };

  const handleToggleIntegration = (name: string) => {
    if (connectedIntegrations.includes(name)) {
      setConnectedIntegrations(connectedIntegrations.filter(n => n !== name));
    } else {
      setConnectedIntegrations([...connectedIntegrations, name]);
    }
  };

  const handleAddNewProperty = (e: React.FormEvent) => {
    e.preventDefault();
    const featArray = newPropData.features.split(",").map(f => f.trim());
    onAddProperty({
      title: newPropData.title,
      price: Number(newPropData.price),
      neighborhood: newPropData.neighborhood,
      city: newPropData.city,
      bedrooms: Number(newPropData.bedrooms),
      suites: Number(newPropData.suites),
      area: Number(newPropData.area),
      condoPrice: Number(newPropData.condoPrice),
      description: newPropData.description,
      imageUrl: newPropData.imageUrl,
      features: featArray
    });
    setShowAddPropModal(false);
    alert("🏠 Imóvel cadastrado com sucesso no catálogo e sincronizado no Cartão Digital!");
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.includes(searchQuery)
  );

  return (
    <div className="w-full space-y-3">
      {impersonatingUser && (
        <div className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-2.5 text-xs font-black rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-2 shadow-xl border border-amber-400/20 animate-pulse">
          <div className="flex items-center gap-2 text-[11px] font-sans">
            <Users className="h-4 w-4 shrink-0 animate-bounce" />
            <span>
              MODO SUPORTE DE DIAGNÓSTICO: Você está navegando como o cliente <strong className="underline text-black">{impersonatingUser}</strong> com permissão restrita [<strong>{selectedRole}</strong>].
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedRole("MASTER ADMIN");
              setImpersonatingUser(null);
              setActiveTab("saas");
              alert("🔄 Retornado com sucesso ao Modo MASTER ADMIN Geral. Todos os privilégios ilimitados foram reestabelecidos.");
            }}
            className="px-3 py-1 bg-slate-950 text-amber-450 hover:text-white text-[10px] font-mono tracking-wider uppercase rounded-lg border border-slate-900 hover:border-white transition shrink-0 cursor-pointer"
          >
            Sair da Impersonação ✕
          </button>
        </div>
      )}

      <div id="crm_portal_view" className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col md:flex-row min-h-[85vh]">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-full md:w-64 bg-slate-950 border-r border-slate-850 p-5 flex flex-col justify-between">
        <div>
          {/* Platform Label */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-9 w-9 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl flex items-center justify-center font-black text-black">
              SB
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
                SmartBroker <span className="text-[10px] bg-amber-500/10 text-amber-500 font-mono px-1 py-0.5 rounded border border-amber-500/20">SaaS</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-mono">ImobLead AI Hub</p>
            </div>
          </div>

          {/* Current Role Select & Permission Level */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mb-5 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Perfil & Plano (RBAC):</span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
            </div>
            <select 
              value={selectedRole}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "MASTER ADMIN") {
                  setAdminLoginState("login");
                  setAdminEmailInput("");
                  setAdminPasswordInput("");
                  setAdminMfaInput("");
                  setShowAdminLoginModal(true);
                  return;
                }
                setSelectedRole(val);
                const feedbackMsgs: Record<string, string> = {
                  "Corretor Essencial": "Plano Corretor Essencial selecionado.\nLimite de 100 leads e 50 imóveis. IA insights e automações bloqueados.",
                  "Corretor Premium": "Plano Corretor Premium selecionado.\nAté 5.000 leads, imóveis ilimitados. IA (Gemini), automações, e analytics avançado liberados.",
                  "Imobiliária": "Plano Imobiliária selecionado.\nUsuários, corretores, leads e imóveis ilimitados. Gestão de equipes e indicador gerencial liberados."
                };
                alert(feedbackMsgs[val] || `Sua visão de permissão foi atualizada para [${val.toUpperCase()}].`);
              }}
              className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded font-semibold text-slate-200 outline-none cursor-pointer"
            >
              <option value="MASTER ADMIN">👑 MASTER ADMIN</option>
              <option value="Corretor Essencial">🟢 Corretor Essencial</option>
              <option value="Corretor Premium">🔵 Corretor Premium</option>
              <option value="Imobiliária">🏢 Imobiliária / Equipe</option>
            </select>
          </div>

          {/* Nav items */}
          <nav className="space-y-1">
            <button 
              onClick={() => handleNavigateTab("dashboard")}
              className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between text-xs font-semibold tracking-wide border transition cursor-pointer ${activeTab === 'dashboard' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="h-4 w-4" /> 
                <span>Dashboard Geral</span>
              </div>
            </button>
            <button 
              onClick={() => handleNavigateTab("funnel")}
              className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between text-xs font-semibold tracking-wide border transition cursor-pointer ${activeTab === 'funnel' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4" /> 
                <span>CRM Funil & IA</span>
              </div>
              {isEssencial && <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1 py-0.2 rounded font-mono">Básico</span>}
            </button>
            <button 
              onClick={() => handleNavigateTab("properties")}
              className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between text-xs font-semibold tracking-wide border transition cursor-pointer ${activeTab === 'properties' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4" /> 
                <span>Catálogo de Imóveis</span>
              </div>
              {isEssencial && <span className="text-[8px] bg-slate-900 text-slate-500 px-1 py-0.2 rounded font-mono">Máx 50</span>}
            </button>
            <button 
              onClick={() => handleNavigateTab("qrcodes")}
              className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between text-xs font-semibold tracking-wide border transition cursor-pointer ${activeTab === 'qrcodes' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="h-4 w-4" /> 
                <span>QR Codes Inteligentes</span>
              </div>
            </button>
            <button 
              onClick={() => handleNavigateTab("automations")}
              className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between text-xs font-semibold tracking-wide border transition cursor-pointer ${activeTab === 'automations' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="h-4 w-4" /> 
                <span>Automações de Fluxo</span>
              </div>
              {isEssencial && <span className="text-[9px] text-amber-500">🔒</span>}
            </button>
            <button 
              onClick={() => handleNavigateTab("corretor")}
              className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between text-xs font-semibold tracking-wide border transition cursor-pointer ${activeTab === 'corretor' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <UserCircle className="h-4 w-4 text-amber-550" /> 
                <span>Meu Perfil Corretor</span>
              </div>
            </button>
            <button 
              onClick={() => handleNavigateTab("imobiliaria")}
              className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between text-xs font-semibold tracking-wide border transition cursor-pointer ${activeTab === 'imobiliaria' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-amber-550" /> 
                <span>Gestão Imobiliária</span>
              </div>
              {(isEssencial || isPremium) && <span className="text-[9px] text-amber-500">🔒</span>}
            </button>
            <button 
              onClick={() => handleNavigateTab("signature")}
              className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between text-xs font-semibold tracking-wide border transition cursor-pointer ${activeTab === 'signature' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-emerald-500" /> 
                <span>Minha Assinatura</span>
              </div>
            </button>
            <button 
              onClick={() => handleNavigateTab("export_center")}
              className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between text-xs font-semibold tracking-wide border transition cursor-pointer ${activeTab === 'export_center' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <Download className="h-4 w-4 text-blue-400" /> 
                <span>Central de Exportação</span>
              </div>
            </button>
            <button 
              onClick={() => handleNavigateTab("saas")}
              className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between text-xs font-semibold tracking-wide border transition cursor-pointer ${activeTab === 'saas' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="h-4 w-4 text-indigo-400" /> 
                <span>Painel Master Admin</span>
              </div>
              {!isMasterAdmin && <span className="text-[9px] text-amber-500">🔒</span>}
            </button>
            <button 
              onClick={() => handleNavigateTab("docs")}
              className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between text-xs font-semibold tracking-wide border transition cursor-pointer ${activeTab === 'docs' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-4 w-4" /> 
                <span>Docs & Estrutura SaaS</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sync panel / Reset Database */}
        <div className="border-t border-slate-850 pt-4 space-y-2">
          {/* Dynamic broker brief */}
          <div className="flex items-center gap-2.5 mb-2">
            <img src={broker.photo} alt={broker.name} className="w-8 h-8 rounded-full object-cover border border-amber-500/30" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{broker.name}</p>
              <p className="text-[10px] text-slate-500 truncate">CRECI: {broker.creci}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button 
              onClick={triggerRefresh}
              className="py-1.5 bg-slate-900/60 hover:bg-slate-850 text-[10px] font-bold rounded-lg border border-slate-800 hover:text-white flex items-center justify-center gap-1 transition cursor-pointer"
              title="Recarregar"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} /> Sincronizar
            </button>
            <button 
              onClick={() => {
                if(confirm("Deseja realmente apagar todas as interações e resetar o banco de dados imobiliário para o estado inicial de demonstração?")) {
                  onResetDb();
                }
              }}
              className="py-1.5 bg-rose-950/20 hover:bg-rose-950/40 text-[10px] font-bold text-rose-400 rounded-lg border border-rose-900/20 flex items-center justify-center gap-1 transition cursor-pointer"
              title="Resetar Banco"
            >
              <Trash2 className="h-3 w-3" /> Reset DB
            </button>
          </div>
        </div>
      </div>

      {/* CORE DISPLAY PORTAL CONTAINER */}
      <div className="flex-1 bg-slate-900/40 p-6 flex flex-col justify-between">
        
        {/* TAB 1: DASHBOARD GERAL */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* Header & Stat line */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Dashboard de Conversão</h2>
                <p className="text-xs text-slate-400">Rastreamento de performance, cliques e funil imobiliário.</p>
              </div>
              
              {/* Reports exporting buttons (Módulo 13) */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 mr-1 font-mono">{broker.city}</span>
                <span className="h-4 w-px bg-slate-800"></span>
                <button 
                  onClick={() => handleDownloadReport("CSV")}
                  className="p-2 bg-slate-950 hover:bg-slate-850 rounded-lg text-slate-300 border border-slate-800 hover:text-white cursor-pointer"
                  title="Exportar CSV"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => handleDownloadReport("Excel")}
                  className="p-2 bg-slate-950 hover:bg-slate-850 rounded-lg text-slate-300 border border-slate-800 hover:text-white cursor-pointer"
                  title="Exportar Excel"
                >
                  <FileText className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* BENTO STATISTICS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850 shadow-md">
                <div className="flex justify-between items-center text-slate-500 mb-2">
                  <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400">Total Leads</span>
                  <Users className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-mono font-black text-white">{stats.totalLeads}</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1">
                  <TrendingUp className="h-3 w-3" /> +24% este mês
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850 shadow-md">
                <div className="flex justify-between items-center text-slate-500 mb-2">
                  <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400">Score Médio</span>
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-2xl font-mono font-black text-white">{stats.avgScore}<span className="text-xs text-slate-500">/100</span></p>
                <div className="text-[10px] text-amber-400 mt-1 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" /> Engajamento Elevado
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850 shadow-md">
                <div className="flex justify-between items-center text-slate-500 mb-2">
                  <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400">CTR Cliques whats</span>
                  <Percent className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-mono font-black text-white">{stats.ctr}</p>
                <div className="text-[10px] text-slate-500 mt-1">
                  Taxa de Cliques no Cartão
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850 shadow-md">
                <div className="flex justify-between items-center text-slate-500 mb-2">
                  <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400">Vendas Estimadas</span>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xl font-mono font-black text-white">{stats.vendasTotais}</p>
                <div className="text-[10px] text-slate-500 mt-1">
                  Meta Imobiliária Global
                </div>
              </div>
            </div>

            {/* VISUAL PIPELINE PROGRESS & TOP PROPERTIES INTEREST */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Pipeline Funnel Visual chart (Módulo 4 & Módulo 12) */}
              <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-500" /> Distribuição do Funil Imobiliário
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300 font-semibold font-mono">1. Novos Contatos</span>
                      <span className="text-slate-400 font-bold">{stats.pipeline.new ?? 0} leads</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.max((stats.pipeline.new / (stats.totalLeads || 1)) * 100, 10)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300 font-semibold font-mono">2. Contato Realizado</span>
                      <span className="text-slate-400 font-bold">{stats.pipeline.contact_made ?? 0} leads</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${Math.max((stats.pipeline.contact_made / (stats.totalLeads || 1)) * 100, 5)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300 font-semibold font-mono">3. Com Interesse Real</span>
                      <span className="text-slate-400 font-bold">{stats.pipeline.interested ?? 0} leads</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.max((stats.pipeline.interested / (stats.totalLeads || 1)) * 100, 10)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300 font-semibold font-mono">4. Visita Presencial</span>
                      <span className="text-slate-400 font-bold">{stats.pipeline.visit_scheduled ?? 0} leads</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${Math.max((stats.pipeline.visit_scheduled / (stats.totalLeads || 1)) * 100, 5)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300 font-semibold font-mono">5. Negociação / Vendas Realizadas</span>
                      <span className="text-emerald-400 font-bold">14 vitoriosos</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full w-[38%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property interest maps (Módulo 8) */}
              <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-500" /> Imóveis Mais Visitados no Catalogo
                </h3>
                
                <div className="space-y-3 text-xs">
                  {properties.map((p, index) => {
                    // count total views from mock leads
                    const views = leads.filter(l => l.timeline.some(a => a.propertyId === p.id)).length;
                    const pct = Math.max(views * 30, 20);
                    return (
                      <div key={p.id} className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-2 max-w-[70%]">
                          <span className="text-amber-500 font-bold font-mono">#0{index + 1}</span>
                          <span className="text-slate-200 truncate font-medium">{p.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono">({p.neighborhood})</span>
                          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-amber-400 font-bold text-[10px]">
                            {views + (index === 0 ? 54 : index === 1 ? 38 : index === 2 ? 29 : 14)} acessos
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* REAL-TIME BEHAVIORAL LOG FEED (Módulo 5 & Módulo 6) */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5 ">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Rastreamento Comportamental Ao Vivo (Digital Tracker)
                </h3>
                <span className="text-[10px] text-amber-500 font-mono uppercase bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                  Monitoramento Ativo
                </span>
              </div>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {leads.flatMap(l => l.timeline.map((t, idx) => ({ ...t, leadName: l.name, score: l.score }))).sort((a,b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5).map((act, i) => {
                  return (
                    <div key={i} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-start justify-between gap-3 text-xs">
                      <div className="flex gap-2.5 items-start">
                        <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-500 shrink-0 font-mono text-[9px] uppercase">
                          {act.type}
                        </div>
                        <div>
                          <p className="text-slate-300 font-medium">
                            <span className="text-amber-300 font-bold mr-1">{act.leadName}</span>
                            {act.details}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            Data: {new Date(act.timestamp).toLocaleDateString()} ás {new Date(act.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 font-bold block">Score atual</span>
                        <span className="text-amber-400 font-mono font-bold text-xs">⭐ {act.score} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: FUNNEL & CRM DETAILS */}
        {activeTab === "funnel" && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">CRM & Pipeline Inteligente</h2>
                <p className="text-xs text-slate-400 font-mono">Arraste de estágio, enriquecimento de interesse e IA de recomendação integrada.</p>
              </div>

              {/* Lead search */}
              <input 
                type="text"
                placeholder="🔍 Procurar Leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 w-full sm:w-60"
              />
            </div>

            {/* CRM SCREEN: LEFT LIST, RIGHT COLUMN DETAILED (Módulo 6 & 10) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Leals list column */}
              <div className="xl:col-span-5 bg-slate-950/50 rounded-2xl border border-slate-850 p-4 space-y-3">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Leads Monitorados ({filteredLeads.length})</span>
                
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredLeads.map(l => {
                    const isSelected = selectedLead?.id === l.id;
                    const isExpanded = expandedLeadId === l.id;
                    
                    const getActionMeta = (type: string) => {
                      switch (type) {
                        case "access": return { label: "Acessou Cartão", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: ExternalLink };
                        case "whatsapp": return { label: "Contatou WhatsApp", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: Phone };
                        case "email": return { label: "Enviou E-mail", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: Mail };
                        case "share": return { label: "Compartilhou", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", icon: ExternalLink };
                        case "save_contact": return { label: "Salvou Contato VCF", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", icon: UserCircle };
                        case "view_property": return { label: "Visualizou Imóvel", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Building2 };
                        case "schedule_visit": return { label: "Agendou Visita", color: "text-rose-400 bg-rose-500/10 border-rose-500/20", icon: Clock };
                        case "qrcode_scan": return { label: "Escaneou QR Code", color: "text-teal-400 bg-teal-500/10 border-teal-500/20", icon: QrCode };
                        case "property_favorite": return { label: "Favoritou Imóvel", color: "text-pink-400 bg-pink-500/10 border-pink-500/20", icon: Flame };
                        default: return { label: "Interação", color: "text-slate-400 bg-slate-500/10 border-slate-500/20", icon: FileText };
                      }
                    };

                    return (
                      <div 
                        key={l.id}
                        id={`crm_lead_card_${l.id}`}
                        onClick={() => {
                          setSelectedLead(l);
                          setAiInsight(null);
                          setExpandedLeadId(isExpanded ? null : l.id);
                        }}
                        className={`p-3.5 rounded-xl border transition cursor-pointer text-xs ${isSelected ? 'bg-amber-500/10 border-amber-500/40 shadow-lg' : 'bg-slate-950 border-slate-850 hover:border-slate-700'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-amber-500 shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                            )}
                            <h4 className="font-bold text-slate-200 truncate">{l.name}</h4>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0
                            ${l.score > 75 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' : 
                              l.score > 45 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25' : 
                              'bg-slate-900 text-slate-400 border border-slate-800'}`}
                          >
                            ⭐ {l.score} Pts
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-slate-400">
                          <span className="font-mono">{l.phone}</span>
                          <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-350 font-mono">
                            🏷️ {l.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        {/* Complete behavioral timeline inline detail section */}
                        {isExpanded && (
                          <div 
                            className="mt-3.5 pt-3.5 border-t border-slate-900/80 space-y-2 cursor-default"
                            onClick={(e) => e.stopPropagation()} // Keep scroll and detail clicks within card
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] text-amber-500 uppercase font-black tracking-wider font-mono">
                                Rastreamento Comportamental ({l.timeline.length})
                              </span>
                              <span className="text-[8px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded font-mono">
                                Histórico Ativo
                              </span>
                            </div>

                             {l.timeline.length === 0 ? (
                               <p className="text-[11px] text-slate-500 italic py-1">Nenhuma interação registrada ainda no cartão digital.</p>
                             ) : (
                               <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                 {(() => {
                                   const reversedTimeline = [...l.timeline].reverse();
                                   const displayedTimeline = isEssencial ? reversedTimeline.slice(0, 2) : reversedTimeline;
                                   return (
                                     <>
                                       {displayedTimeline.map((act) => {
                                         const meta = getActionMeta(act.type);
                                         const IconComponent = meta.icon;
                                         return (
                                           <div key={act.id} className="bg-slate-900/80 p-2 rounded-lg border border-slate-855 flex flex-col gap-1">
                                             <div className="flex items-center justify-between text-[10px]">
                                               <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${meta.color} border flex items-center gap-1`}>
                                                 <IconComponent className="h-2.5 w-2.5" />
                                                 {meta.label}
                                               </span>
                                               <span className="text-slate-500 font-mono text-[8.5px]">
                                                 {new Date(act.timestamp).toLocaleDateString("pt-BR", {day: '2-digit', month: '2-digit'})} às {new Date(act.timestamp).toLocaleTimeString("pt-BR", {hour: '2-digit', minute: '2-digit'})}
                                               </span>
                                             </div>
                                             
                                             {act.details && (
                                               <p className="text-[10px] text-slate-350 font-medium leading-relaxed pl-1">
                                                 {act.details}
                                               </p>
                                             )}
                                           </div>
                                         );
                                       })}
                                       {isEssencial && reversedTimeline.length > 2 && (
                                         <div className="bg-amber-400/5 p-2 rounded-xl border border-amber-400/10 text-center space-y-1 mt-2">
                                           <p className="text-[10px] text-amber-500 font-bold">⭐ +{reversedTimeline.length - 2} interações comportamentais bloqueadas</p>
                                           <p className="text-[8.5px] text-slate-400">Inscreva-se no plano <span className="text-amber-400 font-black">PREMIUM</span> para desbloquear o rastreamento em tempo real ilimitado do cartão.</p>
                                         </div>
                                       )}
                                     </>
                                   );
                                 })()}
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Lead panel with IA engine (Módulo 10 & Módulo 17) */}
              <div className="xl:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-5">
                {selectedLead ? (
                  <div className="space-y-4">
                    
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-3 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-100">{selectedLead.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 font-mono text-amber-500">
                            Origem: {selectedLead.origin}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{selectedLead.email} • {selectedLead.phone}</p>
                      </div>

                      {/* Manual Status pipeline editor */}
                      <div className="flex items-center gap-1.5">
                        <select 
                          value={selectedLead.status}
                          onChange={(e) => onUpdateLeadStatus(selectedLead.id, e.target.value)}
                          className="bg-slate-900 text-slate-200 border border-slate-850 font-bold text-[11px] rounded px-2 py-1 outline-none"
                        >
                          <option value="new">Novo Lead</option>
                          <option value="contact_made">Contato Realizado</option>
                          <option value="interested">Interessado</option>
                          <option value="visit_scheduled">Visita Agendada</option>
                          <option value="proposal">Proposta Recebida</option>
                          <option value="negotiation">Em Negociação</option>
                          <option value="won">Negócio Fechado (Venda 🎉)</option>
                          <option value="lost">Lead Perdido</option>
                        </select>

                        <button 
                          onClick={() => {
                            if(confirm("Deseja apagar permanentemente este contato do CRM imobiliário?")) {
                              onDeleteLead(selectedLead.id);
                              setSelectedLead(null);
                            }
                          }}
                          className="p-1.5 bg-rose-950/20 text-rose-400 border border-rose-900/40 rounded hover:bg-rose-950/50 cursor-pointer"
                          title="Excluir Lead"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Behavior Map & Score Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Behavior profile (Módulo 8) */}
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bairros e Preferências Coletadas</span>
                        <div className="space-y-1.5 mt-2 text-xs">
                          <p className="text-slate-200">
                            📍 <span className="font-semibold">Localizações:</span> {selectedLead.interestProfile.neighborhoods.join(", ")}
                          </p>
                          <p className="text-slate-200">
                            💵 <span className="font-semibold">Faixa Preço:</span> R$ {selectedLead.interestProfile.priceRange.min.toLocaleString()} a R$ {selectedLead.interestProfile.priceRange.max.toLocaleString()}
                          </p>
                          <p className="text-slate-200">
                            🛏️ <span className="font-semibold">Tipologia:</span> {selectedLead.interestProfile.types.join(", ") || "Apartamentos"} ({selectedLead.interestProfile.bedrooms} quartos)
                          </p>
                        </div>
                      </div>

                      {/* Lead Score thermometer (Módulo 9) */}
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Estágio de Temperatura</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-base font-black text-amber-400">{selectedLead.score} Pontos</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold
                              ${selectedLead.score > 75 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 
                                selectedLead.score > 30 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 
                                'bg-slate-800 text-slate-400'}`}
                            >
                              {selectedLead.score > 75 ? 'Muito Quente 🌡️' : selectedLead.score > 30 ? 'Morno' : 'Frio ❄️'}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2">
                          <div className={`h-1.5 rounded-full ${selectedLead.score > 75 ? 'bg-rose-500' : selectedLead.score > 30 ? 'bg-amber-500' : 'bg-slate-700'}`} style={{ width: `${selectedLead.score}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* MÓDULO 10: INTEGRAÇÃO COM GEMINI IA COMERCIAL */}
                    <div id="ai_insight_section" className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 shadow-md shadow-amber-950/20 relative overflow-hidden space-y-3">
                      <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-4.5 w-4.5 text-amber-400" />
                          <h4 className="font-extrabold text-slate-100 text-xs uppercase tracking-wide">
                            Assistente Comercial Cognitivo IA
                          </h4>
                        </div>
                        
                        <button 
                          onClick={() => generateGeminiInsight(selectedLead.id)}
                          disabled={aiInsightLoading}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550 text-black font-black text-xs rounded-lg transition shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {aiInsightLoading ? "Consultando Gemini..." : "Gerar Roteiro de Abordagem com IA"}
                        </button>
                      </div>

                      {/* Insight Response Details */}
                      {aiInsightLoading && (
                        <div className="py-8 text-center space-y-2.5">
                          <RefreshCw className="h-6 w-6 text-amber-500 animate-spin mx-auto" />
                          <p className="text-xs text-amber-200 animate-pulse font-mono">
                            Sincronizando logs comportamentais do lead e formulando script pelo modelo gemini-3.5-flash...
                          </p>
                        </div>
                      )}

                      {!aiInsightLoading && aiInsight && (
                        <div className="space-y-3 mt-2 text-xs border-t border-slate-900 pt-3">
                          <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase">Probabilidade de Compra</p>
                              <p className="text-sm font-black text-amber-400 font-mono">{aiInsight.purchaseProbability}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase">Classificação IA</p>
                              <p className="text-sm font-black text-rose-450 font-mono">{aiInsight.intentClassification}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-450 font-bold uppercase mb-0.5">Perfil Sintetizado</p>
                            <p className="text-slate-300 italic">{aiInsight.interestProfileSummary}</p>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-450 font-bold uppercase mb-0.5">Visão Psicológica Comercial</p>
                            <p className="text-slate-300 text-[11px] leading-relaxed">{aiInsight.psychologicalInsight}</p>
                          </div>

                          <div className="bg-slate-950 border border-amber-500/10 p-3 rounded-xl relative">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold font-mono">Script WhatsApp para Copiar</span>
                              <button 
                                onClick={() => copyScriptToClipboard(aiInsight.directActionScript)}
                                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                {copiedScript ? <span className="text-emerald-400">Copiado!</span> : <><Copy className="h-3 w-3" /> Copiar</>}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-200 leading-relaxed font-sans">{aiInsight.directActionScript}</p>
                          </div>

                          {/* Property Match and AI Recommendation Map (Módulo 17) */}
                          <div className="border-t border-slate-900 pt-2">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">Clientes que viram isso também se interessaram por:</span>
                            <div className="grid grid-cols-2 gap-2">
                              {aiInsight.recommendedPropertiesIds?.map((idId: string) => {
                                const prop = properties.find(p => p.id === idId);
                                if (!prop) return null;
                                return (
                                  <div key={idId} className="bg-slate-900 p-2 rounded border border-slate-800 flex items-center gap-2">
                                    <img src={prop.imageUrl} className="w-8 h-8 rounded object-cover" />
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-bold text-slate-200 truncate">{prop.title}</p>
                                      <p className="text-[9px] text-amber-400 font-mono">R$ {prop.price.toLocaleString("pt-BR")}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {!aiInsight && !aiInsightLoading && (
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850/80 text-center text-[11px] text-slate-400">
                          Clique no botão acima para acionar a Inteligência Artificial proprietária. Analisará o rastreamento comportamental, favorizamentos e gerará insights táticos em português.
                        </div>
                      )}

                    </div>

                    {/* Timeline do Lead (Módulo 6) */}
                    <div>
                      <h4 className="text-[10px] font-black tracking-wider uppercase text-slate-450 mb-2 font-mono">
                        Linha do Tempo de Rastreamento do Contato ({selectedLead.timeline.length})
                      </h4>
                      
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {selectedLead.timeline.map((act) => {
                          return (
                            <div key={act.id} className="bg-slate-900/50 border border-slate-850/60 p-2 rounded-lg flex justify-between items-start text-[11px]">
                              <div>
                                <span className="font-semibold text-slate-200 block">{act.details}</span>
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {new Date(act.timestamp).toLocaleDateString("pt-BR")} às {new Date(act.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <span className="text-[10px] bg-slate-950 text-amber-405 font-mono px-1.5 py-0.5 rounded border border-white/5 uppercase">
                                {act.type}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="py-20 text-center space-y-2">
                    <Users className="h-8 w-8 text-slate-600 mx-auto" />
                    <p className="text-slate-400 text-xs">Selecione um Lead na coluna ao lado para visualizar os insights comerciais, timeline comportamental e score.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: CATÁLOGO DE IMÓVEIS */}
        {activeTab === "properties" && (
          <div className="space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-slate-100 flex items-center gap-1">
                  Catálogo Imobiliário Exclusivo <span className="text-xs font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded">Rastreável</span>
                </h2>
                <p className="text-xs text-slate-400">Total de {properties.length} imóveis prontos de alto padrão.</p>
              </div>

              <button 
                onClick={() => setShowAddPropModal(true)}
                className="py-1.5 px-3 bg-amber-500 hover:bg-amber-450 text-black font-extrabold text-xs rounded-lg shadow flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="h-4 w-4" /> Cadastrar Imóvel
              </button>
            </div>

            {/* List of properties on catalog */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map(p => (
                <div key={p.id} className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-lg hover:border-slate-700 transition">
                  <div className="h-32 overflow-hidden relative">
                    <img src={p.imageUrl} className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur px-2 py-0.5 text-[9px] text-amber-400 rounded uppercase font-mono">
                      {p.neighborhood}
                    </span>
                  </div>

                  <div className="p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-slate-200 truncate">{p.title}</h4>
                    <p className="text-sm font-black font-mono text-amber-400">R$ {p.price.toLocaleString("pt-BR")}</p>
                    <p className="text-slate-405 line-clamp-2 h-8 text-[11px]">{p.description}</p>
                    
                    <div className="flex gap-2 text-[10px] font-mono text-slate-405 border-t border-slate-900 pt-2">
                      <span>📐 {p.area}m²</span>
                      <span>🛏️ {p.bedrooms} Qrt</span>
                      <span>🚿 {p.suites} Suítes</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {p.features.slice(0, 3).map((ft, i) => (
                        <span key={i} className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-amber-350">{ft}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* MODAL PARA ADICIONAR IMÓVEL */}
            {showAddPropModal && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <form 
                  onSubmit={handleAddNewProperty}
                  className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 p-6 max-w-md w-full scroll-y max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-amber-450">Cadastrar Novo Imóvel</h3>
                    <button type="button" onClick={() => setShowAddPropModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-405 block mb-1">Título do Imóvel</label>
                      <input 
                        type="text" 
                        required
                        value={newPropData.title}
                        onChange={(e) => setNewPropData({ ...newPropData, title: e.target.value })}
                        className="w-full bg-slate-905 border border-slate-800 p-2 rounded text-slate-200"
                        placeholder="Ex: Apartamento de Luxo frente praça"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-405 block mb-1">Preço (R$)</label>
                        <input 
                          type="number" 
                          required
                          value={newPropData.price}
                          onChange={(e) => setNewPropData({ ...newPropData, price: Number(e.target.value) })}
                          className="w-full bg-slate-905 border border-slate-800 p-2 rounded text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-450 block mb-1">Bairro</label>
                        <input 
                          type="text" 
                          required
                          value={newPropData.neighborhood}
                          onChange={(e) => setNewPropData({ ...newPropData, neighborhood: e.target.value })}
                          className="w-full bg-slate-905 border border-slate-800 p-2 rounded text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-1">Área (m²)</label>
                        <input 
                          type="number" 
                          required
                          value={newPropData.area}
                          onChange={(e) => setNewPropData({ ...newPropData, area: Number(e.target.value) })}
                          className="w-full bg-slate-901 border border-slate-800 p-2 rounded text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Quartos</label>
                        <input 
                          type="number" 
                          required
                          value={newPropData.bedrooms}
                          onChange={(e) => setNewPropData({ ...newPropData, bedrooms: Number(e.target.value) })}
                          className="w-full bg-slate-901 border border-slate-800 p-2 rounded text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Suítes</label>
                        <input 
                          type="number" 
                          required
                          value={newPropData.suites}
                          onChange={(e) => setNewPropData({ ...newPropData, suites: Number(e.target.value) })}
                          className="w-full bg-slate-901 border border-slate-800 p-2 rounded text-slate-200 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Destaques / Facilidades (Separados por vírgula)</label>
                      <input 
                        type="text" 
                        value={newPropData.features}
                        onChange={(e) => setNewPropData({ ...newPropData, features: e.target.value })}
                        className="w-full bg-slate-901 border border-slate-800 p-2 rounded text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">URL Imagem (Unsplash de preferência)</label>
                      <input 
                        type="text" 
                        value={newPropData.imageUrl}
                        onChange={(e) => setNewPropData({ ...newPropData, imageUrl: e.target.value })}
                        className="w-full bg-slate-901 border border-slate-800 p-2 rounded text-slate-200 block truncate"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Descrição Comercial Detalhada</label>
                      <textarea 
                        rows={3}
                        required
                        value={newPropData.description}
                        onChange={(e) => setNewPropData({ ...newPropData, description: e.target.value })}
                        className="w-full bg-slate-901 border border-slate-800 p-2 rounded text-slate-200 placeholder-slate-700"
                        placeholder="Escreva os diferenciais de venda do imóvel..."
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-450 text-black font-extrabold text-xs tracking-wider uppercase transition mt-5 rounded-xl cursor-pointer"
                  >
                    Confirmar Cadastro de Imóvel
                  </button>
                </form>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: QR CODES INTELIGENTES */}
        {activeTab === "qrcodes" && (
          <div className="space-y-6">
            
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-slate-100 flex items-center gap-1.5">
                <QrCode className="text-amber-500" /> QR Codes Inteligentes Rastreáveis (Módulo 3)
              </h2>
              <p className="text-xs text-slate-400">Compartilhe o perfil do corretor ou unidades específicas com rastreamento de scan por UTM/Localização.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {broker.qrcodes?.map(qr => (
                <div key={qr.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col items-center text-center space-y-3">
                  <span className="text-[10px] text-slate-400 font-mono self-start uppercase">Identificação: #{qr.id}</span>
                  
                  {/* Visual simulated QR code */}
                  <div className="bg-white p-2.5 rounded-lg border-2 border-amber-500/20 shadow-md">
                    <svg className="w-28 h-28 text-black" viewBox="0 0 100 100" fill="currentColor">
                      <rect width="20" height="20" />
                      <rect x="80" width="20" height="20" />
                      <rect y="80" width="20" height="20" />
                      <rect x="25" y="25" width="50" height="10" />
                      <rect x="25" y="45" width="20" height="30" />
                      <rect x="55" y="55" width="20" height="20" />
                      <rect x="80" y="80" width="20" height="20" />
                      <rect x="50" y="80" width="10" height="10" />
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-200">{qr.title}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">Último scan: {qr.lastScan}</p>
                  </div>

                  <div className="w-full bg-slate-900 border border-slate-850 py-1.5 rounded text-[11px] font-bold text-amber-400 font-mono flex justify-center gap-1.5 items-center">
                    📊 Total de {qr.scans} escaneamentos
                  </div>

                  <button 
                    onClick={() => {
                      alert("📥 Baixando arquivo ZIP para o desktop contendo o QRCode em alta resolução (Vetor SVG + PNG 300DPI) para impressão gráfica de placas.");
                    }}
                    className="w-full py-1.5 bg-slate-900 text-slate-300 border border-slate-800 rounded font-semibold text-[10px] hover:text-white cursor-pointer"
                  >
                    Baixar Kit de Impressão (Placa)
                  </button>
                </div>
              ))}
            </div>

            {/* QR Code Creation flow */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850/80 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-slate-300">Como funciona o QR Code Inteligente da SmartBroker?</h4>
                <p className="text-[11px] leading-relaxed mt-1">
                  Ao gerar placas físicas ou artes, o sistema cria redirecionamentos de URL únicos. Quando o cliente escaneia com o smartphone, o sistema computa o horário, detecta a localização aproximada e dispara o ID promocional correspondente para o CRM, elevando o lead score automaticamente para +10 pontos em tempo real.
                </p>
              </div>
              <button 
                onClick={() => alert("Serviço de geração dinâmica de QR Code personalizado disponível e dinâmico na assinatura Premium/Pro.")}
                className="py-1.5 px-3 bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 transition font-bold whitespace-nowrap rounded shrink-0 cursor-pointer"
              >
                Gerar Novo Código Dinâmico
              </button>
            </div>

          </div>
        )}

        {/* TAB 5: AUTOMATION WORKFLOWS */}
        {activeTab === "automations" && (
          isEssencial ? (
            <SaaSUpgradeScreen
              currentPlanId={activePlanId}
              requiredFeature="Automações de Fluxo por Eventos e WhatsApp Automatizado"
              onUpgrade={handleUpgradePlan}
            />
          ) : (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tight text-slate-100 flex items-center gap-1.5">
                    <Sliders className="text-amber-500" /> Automação de Fluxos de Trabalho (Módulo 11)
                  </h2>
                  <p className="text-xs text-slate-400">Ative regras dinâmicas que alteram pontuação, enviam notificações e aceleram a qualificação de leads.</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">Engine ON</span>
              </div>

              {/* List of active automation rules */}
              <div className="space-y-3">
                {automations.map(auto => (
                  <div key={auto.id} className="bg-slate-950 p-4 border border-slate-850 rounded-xl relative overflow-hidden text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span className={`h-2 h-2 w-2 rounded-full ${auto.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                        {auto.title}
                      </h4>
                      <p className="text-slate-400 text-[11px]"><span className="text-amber-400 font-mono font-semibold">Gatilho:</span> {auto.trigger}</p>
                      <p className="text-slate-350 text-[11px]"><span className="text-slate-450 font-mono font-semibold">Execução comercial:</span> {auto.action}</p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      <button 
                        onClick={() => alert(`Simulação do disparo automático [${auto.title}] realizado com sucesso para o lead visitando o cartão!`)}
                        className="py-1 px-2.5 bg-slate-900 border border-slate-800 text-[10px] rounded text-amber-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="h-3 w-3" /> Forçar Disparo
                      </button>
                      
                      {/* Simulator toggle switch */}
                      <button 
                        onClick={() => {
                          auto.active = !auto.active;
                          triggerRefresh();
                        }}
                        className={`font-semibold text-[10px] px-2.5 py-1 rounded transition border cursor-pointer ${auto.active ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                      >
                        {auto.active ? 'ATIVADO' : 'DESATIVADO'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom rule creation statement preview */}
              <div className="p-4 rounded-xl border border-slate-850 bg-slate-900/65 flex flex-col md:flex-row gap-4 items-end text-xs">
                <div className="flex-1 space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-500 tracking-wider block uppercase">Criador Virtual de Regras Personalizadas:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500 block uppercase">SE o Lead realizar...</label>
                      <select className="w-full bg-slate-950 border border-slate-850 p-1.5 rounded text-slate-300">
                        <option>Visualizar imóvel 3 vezes</option>
                        <option>Salvar contato (VFC)</option>
                        <option>Abandonar preenchimento</option>
                        <option>Clicar em WhatsApp</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block uppercase">E o Lead Score for...</label>
                      <select className="w-full bg-slate-950 border border-slate-850 p-1.5 rounded text-slate-300">
                        <option>Maior que 50 pontos</option>
                        <option>Igual ou morno (&gt; 30)</option>
                        <option>Qualquer classificação</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block uppercase">ENTÃO execute a ação...</label>
                      <select className="w-full bg-slate-950 border border-slate-850 p-1.5 rounded text-slate-300">
                        <option>Enviar e-mail automático</option>
                        <option>Mover status para 'Proposta'</option>
                        <option>Alocar corretor sênior</option>
                        <option>Notificar celular via Push</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => alert("Parabéns! Sua nova regra de automação foi compilada. Disponível na próxima build da aplicação SaaS comercial!")}
                  className="py-2 px-4 bg-amber-500 hover:bg-amber-450 text-black font-extrabold rounded-lg tracking-wide whitespace-nowrap cursor-pointer hover:scale-103 transition text-center w-full md:w-auto text-xs"
                >
                  Salvar Automação
                </button>
              </div>

            </div>
          )
        )}

        {/* TAB 6: ADMINISTRAÇÃO SAAS MASTER & BILLING */}
        {activeTab === "saas" && (
          !isMasterAdmin ? (
            <AccessDeniedScreen 
              requiredRole="MASTER ADMIN" 
              currentRole={selectedRole} 
              tabName="saas" 
            />
          ) : (
            <div className="space-y-6">
              
              {/* Master Admin Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-4 gap-3">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tight text-white flex items-center gap-1.5 font-sans">
                    <ShieldCheck className="text-amber-550 h-5 w-5" /> Painel Master Admin Geral (SaaS Commercial Control)
                  </h2>
                  <p className="text-xs text-slate-400">Ambiente interno exclusivo. Monitoramento global de faturamento, credenciais, segurança e planos de parceiros.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="bg-rose-500/10 border border-rose-500/20 text-rose-450 font-bold px-2.5 py-1 rounded text-[10px] tracking-wide font-mono uppercase">
                    Acesso Absoluto Unrestricted
                  </span>
                </div>
              </div>

              {/* Master Admin Inner Subtabs Navigation */}
              <div className="flex flex-wrap gap-1.5 border-b border-slate-900 pb-3">
                {[
                  { id: "metrics", label: "Métricas Globais", icon: TrendingUp },
                  { id: "clients", label: "Gestão de Clientes", icon: Users },
                  { id: "financial", label: "Financeiro & Stripe", icon: DollarSign },
                  { id: "modules", label: "Controle da Plataforma", icon: Sliders },
                  { id: "audit", label: "Auditoria & Logs", icon: Clock }
                ].map((st) => {
                  const Icon = st.icon;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setSaasSubTab(st.id as any)}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold tracking-wide transition flex items-center gap-1.5 cursor-pointer ${
                        saasSubTab === st.id 
                          ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10" 
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {st.label}
                    </button>
                  );
                })}
              </div>

              {/* METRICS SUBTAB */}
              {saasSubTab === "metrics" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Dynamic global stats grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Receita Recorrente Mensal (MRR)</p>
                      <p className="text-2xl font-black font-mono text-emerald-400">R$ 38.540</p>
                      <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">↑ +14.8% <span className="font-sans text-slate-500 font-normal">vs mês anterior</span></p>
                    </div>
                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Receita Recorrente Anual (ARR)</p>
                      <p className="text-2xl font-black font-mono text-amber-500">R$ 462.480</p>
                      <p className="text-[10px] text-amber-500 font-bold flex items-center gap-1">★ Projeção <span className="font-sans text-slate-500 font-normal">anual atualizada</span></p>
                    </div>
                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Total de Contas SaaS Ativas</p>
                      <p className="text-2xl font-black font-mono text-white">154</p>
                      <p className="text-[10px] text-slate-400 font-mono">120 corretores • 34 imobiliárias</p>
                    </div>
                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Taxa de Cancelamento (Churn)</p>
                      <p className="text-2xl font-black font-mono text-rose-400">2.1%</p>
                      <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">↓ Redução <span className="font-sans text-slate-500 font-normal">estável saudável</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-1">
                      <span className="text-slate-400 font-mono block">Leads Captados na Plataforma</span>
                      <strong className="text-lg text-slate-200">14.890 leads</strong>
                      <div className="w-full bg-slate-900 rounded-full h-1 mt-2">
                        <div className="bg-amber-500 h-1 rounded-full w-[74%]"></div>
                      </div>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-1">
                      <span className="text-slate-400 font-mono block">Imóveis Ativos no Catálogo</span>
                      <strong className="text-lg text-slate-200">3.421 imóveis</strong>
                      <div className="w-full bg-slate-900 rounded-full h-1 mt-2">
                        <div className="bg-indigo-500 h-1 rounded-full w-[58%]"></div>
                      </div>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-1">
                      <span className="text-slate-400 font-mono block">Conversão Média de Visitas</span>
                      <strong className="text-lg text-emerald-400 font-mono">16.8%</strong>
                      <div className="w-full bg-slate-900 rounded-full h-1 mt-2">
                        <div className="bg-emerald-500 h-1 rounded-full w-[44%]"></div>
                      </div>
                    </div>
                  </div>

                  {/* Multiplier controller (demonstrating dynamically updating plan prices) */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                    <div className="space-y-1 bg-transparent">
                      <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Ajuste Global de Preços Comerciais (Plan Multiplier)</h4>
                      <p className="text-xs text-slate-400">Ajuste o multiplicador geral para aplicar descontos, testar flutuações de mercado ou simular taxas de inflação nos preços de faturamento.</p>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-3 shrink-0">
                      <span className="text-slate-450 font-mono text-[10px] uppercase font-bold">Multiplicador SaaS:</span>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => {
                            setPlanMultiplier(prev => Math.max(0.5, Number((prev - 0.1).toFixed(1))));
                            alert(`Multiplicador de preços reduzido! Todos os planos receberam as novas taxas.`);
                          }}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 text-white hover:text-amber-500 border border-slate-800 rounded-md cursor-pointer transition font-mono font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono text-amber-400 font-black text-sm px-2">{planMultiplier}x</span>
                        <button 
                          onClick={() => {
                            setPlanMultiplier(prev => Math.min(2.0, Number((prev + 0.1).toFixed(1))));
                            alert(`Multiplicador de preços inflacionado! Novos valores aplicados imediatamente aos planos.`);
                          }}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 text-white hover:text-amber-500 border border-slate-800 rounded-md cursor-pointer transition font-mono font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* CLIENTS SUBTAB */}
              {saasSubTab === "clients" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">Contas e Inscritos Ativos (SaaS Client Manager)</h3>
                    <span className="text-[10px] text-slate-500 font-mono">Buscando contas de corretores comerciais</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-850">
                        <tr>
                          <th className="p-3">Nome / E-mail</th>
                          <th className="p-3">Plano Oficial</th>
                          <th className="p-3">CRECI</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Ações de Resolução (RBAC)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        {saasClients.map(c => {
                          return (
                            <tr key={c.id} className="hover:bg-slate-900/40">
                              <td className="p-3">
                                <p className="font-bold text-white">{c.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{c.email}</p>
                              </td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  c.plan === 'Imobiliária' ? 'bg-indigo-500/10 text-indigo-400' :
                                  c.plan === 'Corretor Premium' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {c.plan}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[11px] text-slate-400">{c.creci}</td>
                              <td className="p-3">
                                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                                  c.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                
                                <button
                                  onClick={() => {
                                    const nextStatus = c.status === "Ativo" ? "Suspenso" : "Ativo";
                                    setSaasClients(prev => prev.map(cl => cl.id === c.id ? { ...cl, status: nextStatus } : cl));
                                    setActiveMasterLogs(prev => [
                                      { id: Date.now(), time: new Date().toLocaleTimeString().slice(0, 5), event: `Admin alterou status de ${c.name} para ${nextStatus.toUpperCase()}`, user: "MASTER ADMIN" },
                                      ...prev
                                    ]);
                                    alert(`Status da conta alterado!\nO cliente [${c.name}] agora está com acesso [${nextStatus.toUpperCase()}].`);
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                                    c.status === "Ativo" 
                                      ? "bg-rose-500/10 text-rose-450 border border-rose-500/20 hover:bg-rose-500/20" 
                                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                  }`}
                                >
                                  {c.status === "Ativo" ? "Suspender" : "Reativar"}
                                </button>

                                <button
                                  onClick={() => {
                                    const roleToSwitch = c.plan === "Corretor Essencial" ? "Corretor Essencial" : c.plan === "Corretor Premium" ? "Corretor Premium" : "Imobiliária";
                                    setSelectedRole(roleToSwitch);
                                    setImpersonatingUser(c.name);
                                    setActiveTab("dashboard");
                                    alert(`👥 Personificação Concedida!\nVocê agora está impersonando de forma segura o portal do cliente [${c.name}].\n\nTodas as regras de bloqueio do plano [${c.plan.toUpperCase()}] já foram impostas de forma simulada no visual!`);
                                  }}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-850 rounded text-[10px] font-bold cursor-pointer transition"
                                >
                                  Impersonar 👥
                                </button>

                                <button
                                  onClick={() => {
                                    const nextPlanMap: Record<string, string> = {
                                      "Corretor Essencial": "Corretor Premium",
                                      "Corretor Premium": "Imobiliária",
                                      "Imobiliária": "Corretor Essencial"
                                    };
                                    const nextPlan = nextPlanMap[c.plan];
                                    setSaasClients(prev => prev.map(cl => cl.id === c.id ? { ...cl, plan: nextPlan } : cl));
                                    alert(`Plano alterado!\nO corretor [${c.name}] foi migrado de forma imediata para o plano [${nextPlan.toUpperCase()}].`);
                                  }}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-500 hover:text-white border border-slate-850 rounded text-[10px] font-bold cursor-pointer transition"
                                >
                                  Alterar Plano
                                </button>

                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* FINANCIAL SUBTAB */}
              {saasSubTab === "financial" && (
                <div className="space-y-6 animate-fade-in text-xs">
                  
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Histórico de Cobrança e Gateway Stripe</h4>
                    <div className="space-y-2">
                      {[
                        { id: "tx_101", customer: "Rodrigo Alencar", method: "Stripe Card (Visa)", value: 97, date: "Hoje, 11:24", status: "Pago" },
                        { id: "tx_102", customer: "Mariana Souza", method: "Pix Gateway", value: 597, date: "Ontem, 18:40", status: "Pago" },
                        { id: "tx_103", customer: "Cláudio Silva Imóveis", method: "Pix Gateway", value: 597, date: "09 de Junho", status: "Contestado/Reembolsado" }
                      ].map((tx) => (
                        <div key={tx.id} className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex items-center justify-between gap-3 font-sans">
                          <div>
                            <p className="font-bold text-slate-200">{tx.customer} <span className="text-[10px] text-slate-500 font-mono">({tx.id})</span></p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.date} • {tx.method}</p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-amber-500 font-black font-mono">R$ {tx.value}</p>
                              <span className={`text-[9px] font-mono px-2 py-0.2 rounded-full float-right ${tx.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'}`}>
                                {tx.status}
                              </span>
                            </div>
                            
                            {tx.status === "Pago" && (
                              <button
                                onClick={() => {
                                  alert(`💸 Transação [${tx.id}] Reembolsada com Sucesso!\nIniciando estorno do valor de R$ ${tx.value},00 de volta para o cliente de forma integrada no sandbox Stripe.`);
                                }}
                                className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-black font-extrabold text-[9px] rounded uppercase cursor-pointer transition shrink-0"
                              >
                                Reembolsar 💸
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COUONS BUILDER TOOL */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Criador de Cupons de Desconto Dinâmicos (SaaS Discount Engine)</h4>
                      <p className="text-xs text-slate-400">Configure códigos promocionais ativos que podem ser inseridos pelos corretores na tela de assinatura para conceder descontos.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Código do Cupom (ex: MEUDESCONTO):</label>
                        <input
                          type="text"
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                          placeholder="DIGITEOCUPOM"
                          className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-100 placeholder-slate-600 focus:border-amber-500 outline-none transition font-mono"
                        />
                      </div>
                      <div className="w-full sm:w-1/3 space-y-1">
                        <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">% Porcentagem de Desconto:</label>
                        <select
                          value={newCouponDiscount}
                          onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 outline-none"
                        >
                          <option value={10}>10% OFF</option>
                          <option value={20}>20% OFF</option>
                          <option value={30}>30% OFF</option>
                          <option value={50}>50% OFF</option>
                          <option value={90}>90% OFF</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          if (!newCouponCode.trim()) {
                            alert("Por favor digite um código de cupom válido!");
                            return;
                          }
                          const codeToAdd = newCouponCode.replace(/\s+/g, "");
                          if (adminCoupons.some(v => v.code === codeToAdd)) {
                            alert("Esse cupom já existe!");
                            return;
                          }
                          setAdminCoupons(prev => [...prev, { code: codeToAdd, discount: newCouponDiscount, active: true }]);
                          setNewCouponCode("");
                          alert(`🎉 Cupom [${codeToAdd}] com ${newCouponDiscount}% OFF cadastrado perfeitamente!`);
                        }}
                        className="py-2.5 px-4 bg-amber-500 hover:bg-amber-450 text-black font-extrabold rounded-xl transition text-center text-xs uppercase font-mono cursor-pointer shrink-0"
                      >
                        Ativar Cupom
                      </button>
                    </div>

                    <div className="border-t border-slate-900 pt-3">
                      <span className="text-[9px] text-slate-400 font-mono block mb-1">Cupons Ativos no Banco de Dados:</span>
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        {adminCoupons.map((cp) => (
                          <div key={cp.code} className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400">{cp.code}</span>
                            <span className="bg-amber-400 text-black px-1.5 py-0.2 rounded font-black font-mono text-[9px]">{cp.discount}% OFF</span>
                            <button
                              onClick={() => {
                                setAdminCoupons(prev => prev.filter(v => v.code !== cp.code));
                              }}
                              className="text-rose-500 hover:text-rose-455 ml-1 transition"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* MODULES SUBTAB */}
              {saasSubTab === "modules" && (
                <div className="space-y-6 animate-fade-in text-xs">
                  
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Ativação de Módulos Globais</h4>
                      <p className="text-xs text-slate-400">Ative ou desative módulos inteiros da aplicação comercial instantaneamente para manutenção programada.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { key: "geminiAi", label: "Módulo IA e Insights (Gemini SDK)" },
                        { key: "automations", label: "Módulo Editor de Automações" },
                        { key: "qrCodes", label: "Módulo Gerador de QR Code estático" },
                        { key: "leadScoring", label: "Lead Scoring Comportamental" },
                        { key: "digitalCard", label: "Digital Premium Card Tracker" }
                      ].map((m) => {
                        const val = (globalModules as any)[m.key];
                        return (
                          <div key={m.key} className="bg-slate-900/60 p-3 border border-slate-850 rounded-xl flex items-center justify-between gap-3 text-xs">
                            <span className="font-semibold text-slate-300">{m.label}</span>
                            
                            <button
                              onClick={() => {
                                const nextVal = !val;
                                setGlobalModules({ ...globalModules, [m.key]: nextVal });
                                alert(`Módulo global [${m.label}] foi ${nextVal ? 'ATIVADO' : 'DESABILITADO'} com absoluto sucesso.`);
                              }}
                              className={`px-2 py-1 text-[9px] font-black rounded uppercase font-mono ${val ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'}`}
                            >
                              {val ? 'Ativo ✓' : 'Inativo ✕'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                      <span className="text-[10px] text-amber-500 font-mono block uppercase font-bold">1. Conexão Webhook Stripe</span>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 font-bold block uppercase">Stripe Webhook Secret Signature (whsec):</label>
                        <input
                          type="password"
                          value="••••••••••••••••••••••••••••••••••••••••••••••"
                          readOnly
                          className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-400 font-mono outline-none"
                        />
                        <button
                          onClick={() => alert("Chave secreta do Webhook de auditoria Stripe redefinida com sucesso!")}
                          className="py-1 px-3 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-200 border border-slate-800 rounded-lg cursor-pointer transition uppercase"
                        >
                          Trocar Token whsec
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                      <span className="text-[10px] text-amber-500 font-mono block uppercase font-bold">2. Configuração Engine LLM IA (Gemini SDK)</span>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 font-bold block uppercase">Modelo Gemini Padrão para Insights:</label>
                        <select className="w-full bg-slate-900 border border-slate-800 text-xs p-2 rounded-xl text-slate-200 cursor-pointer">
                          <option>Gemini 2.5 Flash Latest (Recomendado)</option>
                          <option>Gemini 2.5 Pro Ultra (Insights profundos)</option>
                          <option>Gemini 1.5 Flash (Legacy)</option>
                        </select>
                        <p className="text-[9px] text-slate-500 leading-normal">O SmartBroker SaaS utiliza o inovador sdk da biblioteca @google/genai para processar as timelined.</p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* AUDIT & SECURITY LOGS LIST */}
              {saasSubTab === "audit" && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                    <p className="font-semibold text-slate-200">
                      📜 Central de Log Geral e Auditoria Faturamento
                    </p>
                    <button
                      onClick={() => {
                        setActiveMasterLogs(prev => [
                          { id: Date.now(), time: new Date().toLocaleTimeString().slice(0, 5), event: "Auditoria global limpa e reinicializada", user: "MASTER ADMIN" },
                          ...prev
                        ]);
                        alert("Auditoria de faturamento e logins re-verificadas.");
                      }}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded-lg transition shrink-0 cursor-pointer"
                    >
                      Refrescar Trilha Logs
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 rounded-xl max-h-96 overflow-y-auto divide-y divide-slate-900 font-mono text-[11px] text-slate-350 p-1">
                    {activeMasterLogs.map((log) => (
                      <div key={log.id} className="p-3 hover:bg-slate-900/40 flex justify-between gap-3 items-start">
                        <div>
                          <span className="text-slate-500 mr-2">[{log.time}]</span>
                          <span className="text-slate-200">{log.event}</span>
                        </div>
                        <span className="text-indigo-400 font-bold bg-indigo-500/5 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-[9px] shrink-0 border border-indigo-500/10">
                          {log.user}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )
        )}

        {/* TAB 7: STRUCTURAL DOCUMENTATION & MODEL DESIGN */}
        {activeTab === "docs" && (
          <div className="space-y-6">
            
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-white flex items-center gap-1.5">
                <BookOpen className="text-amber-500" /> Arquitetura do Sistema, Modelos de Entidades e Plano SaaS
              </h2>
              <p className="text-xs text-slate-400">Modelagem técnica, estrutural e diretrizes requeridas para comercialização do produto.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              {/* Architecture & Model Details */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-4">
                <h4 className="font-extrabold text-amber-450 uppercase text-[11px] tracking-wide">1. Arquitetura do Produto & Banco PostgreSQL</h4>
                
                <div className="space-y-3 font-mono text-[10px] leading-relaxed text-slate-305">
                  <div>
                    <span className="text-amber-500 block font-sans font-bold text-xs mb-1">Modelagem de Entidades Centralizadas:</span>
                    <p className="text-slate-400 italic">Estruturas implementadas relacionalmente:</p>
                    <ul className="list-disc pl-4 mt-1 text-[11px]">
                      <li><strong className="text-slate-200">BROKERS (Corretores)</strong>: id, nome, CRECI, bio, contato, plano_atual_id, hash_senha, multi_2fa_ativo.</li>
                      <li><strong className="text-slate-200">LEADS</strong>: id, nome, telefone, email, responsible_broker_id, score, status (Funil), visualizacoes_id, tags_array.</li>
                      <li><strong className="text-slate-200">PROPERTIES</strong>: id, titulo, preco, bairro, cidade, suites, area_m2, fotos_urls, tour_virtual_url, status_dispo.</li>
                      <li><strong className="text-slate-200">COMPORTAMENTO_TRACKS</strong>: id, lead_id, acao_tipo (Whats, Compartilhamento, Cliques), property_id_nulo, dispositivo, utm_campaign, timestamp.</li>
                    </ul>
                  </div>

                  <div>
                    <span className="text-amber-500 block font-sans font-bold text-xs mb-1">Tecnologias Prontas Recomendadas para Produção:</span>
                    <p className="text-[10px]">
                      PostgreSQL em Nuvem Relacional (Supabase / Cloud SQL) configurados para conexões via Prisma/Drizzle. 
                      Cache com Redis de visualizações rápidas de imóvel para evitar gargalos nos cartões com múltiplos tráfegos de campanhas sociais.
                    </p>
                  </div>
                </div>
              </div>

              {/* Monetize, Rentention & Scalability Strategy */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                <h4 className="font-extrabold text-amber-450 uppercase text-[11px] tracking-wide">2. Monetização, Retenção & Estratégia de Crescimento</h4>
                
                <div className="space-y-2.5 text-[11px] leading-relaxed text-slate-300">
                  <div>
                    <strong className="text-amber-500 block uppercase text-[10px] font-mono">Retenção de Clientes (Churn Zero):</strong>
                    <p className="text-[10px] leading-relaxed text-slate-400">
                      O corretor só desassina se não tiver conversão. Fornecendo IA Inteligente que sugere mensagens prontas no Whats de quem visitou o imóvel, o corretor ganha agilidade e fecha venda, tornado o SmartBroker essencial (Stickiness elevado).
                    </p>
                  </div>

                  <div>
                    <strong className="text-amber-500 block uppercase text-[10px] font-mono">Estratégia de Crescimento (Flywheel):</strong>
                    <p className="text-[10px] leading-relaxed text-slate-400">
                      O rodapé do Cartão Digital de cada corretor exibe "Quer um cartão inteligente como este? Conheça o SmartBroker AI". Isso gera auto-prospecção orgânica acelerada (aquisição viral gratuita).
                    </p>
                  </div>

                  <div>
                    <strong className="text-amber-500 block uppercase text-[10px] font-mono">Escalabilidade para Milhares de Usuários:</strong>
                    <p className="text-[10px] leading-relaxed text-slate-400">
                      Separação rígida de leitura e escrita (Read-replicas do PostgreSQL) para renderização do cartão dinâmico, aliado à CDN robusta que serve imagens estáticas dos imóveis, mantendo baixa latência.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* MVP vs Commercial Version Roadmap */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl md:col-span-2 text-xs">
                <span className="text-amber-500 tracking-wider font-extrabold uppercase text-[10px] block mb-2 font-mono">Roteiro de Desenvolvimento / Roadmap do Produto</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-850">
                    <h5 className="font-bold text-slate-200 uppercase mb-1 flex items-center gap-1 text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span> Fase 1 - Roadmap MVP Prático (6 semanas)
                    </h5>
                    <ul className="space-y-1 text-[10px] text-slate-400 list-disc pl-4">
                      <li>Modelagem do banco de dados no PostgreSQL local.</li>
                      <li>Cartão digital responsivo integrado ao WhatsApp.</li>
                      <li>Pipeline de Lead Scoring básico no local storage.</li>
                      <li>Autenticação de 2 fatores simulada e testes unitários.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-850">
                    <h5 className="font-bold text-slate-200 uppercase mb-1 flex items-center gap-1 text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Fase 2 - Escopo Comercial Completo (12 semanas)
                    </h5>
                    <ul className="space-y-1 text-[10px] text-slate-400 list-disc pl-4">
                      <li>Acoplamento do motor cognitivo Gemini (modelo Flash).</li>
                      <li>Integração da API de faturamento da Stripe / Boleto e chave Pix dinâmico.</li>
                      <li>Aplicativo móvel wrapper usando React Native / Flutter.</li>
                      <li>Suporte multilíngue e auditoria de logs criptográficos completos.</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* TAB: corretor (Módulo 21 — PERFIL CORRETOR) */}
        {/* ========================================== */}
        {activeTab === "corretor" && (
          <form onSubmit={handleSaveBrokerProfile} className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-3 gap-3">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-slate-100 flex items-center gap-1.5">
                  <UserCircle className="text-amber-500" /> Meu Perfil Profissional & Cartão (Módulo 21)
                </h2>
                <p className="text-xs text-slate-400">Gerencie seus dados pessoais, especialidades e configurações visuais do seu Cartão de Visita Digital.</p>
              </div>

              <button 
                type="submit"
                disabled={savingBroker}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/15"
              >
                {savingBroker ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Salvando...
                  </>
                ) : (
                  "Salvar Alterações Perfil"
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT FRAME: DATA CONFIGS */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Personal & Legal metrics */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-500 font-mono">1. Dados Pessoais & Categoria Legal</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Nome Completo do Corretor:</label>
                      <input 
                        type="text" 
                        value={brokerName}
                        onChange={(e) => setBrokerName(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Unidade de Registro CRECI:</label>
                      <input 
                        type="text" 
                        value={brokerCreci}
                        onChange={(e) => setBrokerCreci(e.target.value)}
                        required
                        placeholder="ex: 12345-F"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:col-span-2 font-mono">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-sans uppercase font-bold">CPF do Titular:</label>
                        <input 
                          type="text" 
                          value={personalCpf}
                          onChange={(e) => setPersonalCpf(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 transition"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-sans uppercase font-bold">RG do Titular:</label>
                        <input 
                          type="text" 
                          value={personalRg}
                          onChange={(e) => setPersonalRg(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                      <div className="space-y-1.5 font-mono">
                        <label className="text-[10px] text-slate-400 font-sans uppercase font-bold">Data de Nascimento:</label>
                        <input 
                          type="date" 
                          value={personalDob}
                          onChange={(e) => setPersonalDob(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 transition"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-bold">Cidade / Atuação Sede:</label>
                        <input 
                          type="text" 
                          value={brokerCity}
                          onChange={(e) => setBrokerCity(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional stats */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-500 font-mono">2. Capacidade Técnica & Biografia Comercial</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Sua Especialidade Principal:</label>
                      <input 
                        type="text" 
                        value={brokerSpecialty}
                        onChange={(e) => setBrokerSpecialty(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Segmento de Foco:</label>
                      <input 
                        type="text" 
                        value={brokerSegment}
                        onChange={(e) => setBrokerSegment(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Anos de Experiência:</label>
                      <input 
                        type="text" 
                        value={brokerExperience}
                        onChange={(e) => setBrokerExperience(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Sua Biografia Curta (Apresentação Profissional):</label>
                      <textarea 
                        rows={3}
                        value={brokerBio}
                        onChange={(e) => setBrokerBio(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-amber-500 transition text-xs font-sans leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5 font-mono">
                      <label className="text-[10px] text-slate-400 font-sans uppercase font-bold">URL da Foto de Perfil:</label>
                      <input 
                        type="text" 
                        value={brokerPhoto}
                        onChange={(e) => setBrokerPhoto(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5 font-mono">
                      <label className="text-[10px] text-slate-400 font-sans uppercase font-bold">URL do Logotipo Pessoal ou Franquia:</label>
                      <input 
                        type="text" 
                        value={brokerPersonalLogo}
                        onChange={(e) => setBrokerPersonalLogo(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Digital Card custom settings */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-500 font-mono">3. Estilo Visual do Cartão Digital</h3>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded font-mono">INTEGRAÇÃO DINÂMICA ATIVA</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Visual Tema - Cor:</label>
                      
                      <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1.5 rounded-lg border border-slate-805">
                        <button 
                          type="button" 
                          onClick={() => setCardBgColor("slate-950")}
                          className={`h-6 rounded cursor-pointer border ${cardBgColor === 'slate-950' ? 'bg-slate-950 border-amber-500' : 'bg-slate-950 border-transparent'}`}
                          title="Slate Carbon"
                        />
                        <button 
                          type="button" 
                          onClick={() => setCardBgColor("zinc-900")}
                          className={`h-6 rounded cursor-pointer border ${cardBgColor === 'zinc-900' ? 'bg-zinc-900 border-amber-500' : 'bg-zinc-900 border-transparent'}`}
                          title="Zinc Gray"
                        />
                        <button 
                          type="button" 
                          onClick={() => setCardBgColor("amber-950")}
                          className={`h-6 rounded cursor-pointer border ${cardBgColor === 'amber-950' ? 'bg-amber-950 border-amber-500' : 'bg-amber-950 border-transparent'}`}
                          title="Sunset Ember"
                        />
                        <button 
                          type="button" 
                          onClick={() => setCardBgColor("sky-950")}
                          className={`h-6 rounded cursor-pointer border ${cardBgColor === 'sky-950' ? 'bg-sky-950 border-amber-500' : 'bg-sky-950 border-transparent'}`}
                          title="Deep Blue Ocean"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Texto de Destaque / Boas-Vindas no Cartão:</label>
                      <input 
                        type="text" 
                        value={cardPresentationText}
                        onChange={(e) => setCardPresentationText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT FRAME: CONTACTS & SOCIALS */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Contact settings */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-500 font-mono">4. Canais Rápidos de Clique</h3>
                  
                  <div className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-semibold">Telefone de Contato (WhatsApp):</label>
                      <input 
                        type="tel" 
                        value={brokerWhatsapp}
                        onChange={(e) => setBrokerWhatsapp(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-105 outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-semibold">E-mail de Cadastro:</label>
                      <input 
                        type="email" 
                        value={brokerEmail}
                        onChange={(e) => setBrokerEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-105 outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1 font-mono">
                      <label className="text-[10px] text-slate-450 font-sans uppercase font-semibold">Website Pessoal:</label>
                      <input 
                        type="url" 
                        value={brokerSite}
                        onChange={(e) => setBrokerSite(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-105 outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Social media connections */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-4 font-mono">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-500 font-sans font-mono">5. Links de Redes Sociais</h3>
                  
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-sans">ID Instagram:</label>
                      <input 
                        type="text" 
                        value={brokerInstagram}
                        onChange={(e) => setBrokerInstagram(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-205 outline-none focus:border-amber-500 transition"
                        placeholder="ex: gabriel.smartbroker"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-sans">URL LinkedIn Perfil:</label>
                      <input 
                        type="text" 
                        value={brokerLinkedin}
                        onChange={(e) => setBrokerLinkedin(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-205 outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-sans font-mono">Facebook Perfil:</label>
                      <input 
                        type="text" 
                        value={brokerFacebook}
                        onChange={(e) => setBrokerFacebook(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-205 outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-sans font-mono">Canal YouTube:</label>
                      <input 
                        type="text" 
                        value={brokerYoutube}
                        onChange={(e) => setBrokerYoutube(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-205 outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </form>
        )}

        {/* ========================================== */}
        {/* TAB: imobiliaria (Módulo 22 — GESTÃO IMOBILIÁRIA COORPORATIVA) */}
        {/* ========================================== */}
        {activeTab === "imobiliaria" && (
          (isEssencial || isPremium) ? (
            <SaaSUpgradeScreen
              currentPlanId={activePlanId}
              requiredFeature="Gestão Imobiliária, Roteamento de Leads e Controle de Corretores Multi-usuários"
              onUpgrade={handleUpgradePlan}
            />
          ) : (
            <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-3 gap-3">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-slate-100 flex items-center gap-1.5">
                  <Building2 className="text-amber-500" /> Gestão da Imobiliária & Equipe Master (Módulo 22)
                </h2>
                <p className="text-xs text-slate-400">Canal administrativo exclusivo para gerir dados empresariais, corretores credenciados, e transferir leads da carteira.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-amber-400/10 border border-amber-400/20 text-amber-400 font-bold px-2.5 py-1 rounded text-[10px] tracking-wide font-mono uppercase">
                  Gestão: {selectedRole}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Side: Business Info & Team List */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Business registration */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 font-mono">1. Cadastro da Pessoa Jurídica & Identidade</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Razão Social Principal:</label>
                      <input 
                        type="text" 
                        value={agencyData.companyName}
                        onChange={(e) => setAgencyData({ ...agencyData, companyName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Nome Fantasia Comercial:</label>
                      <input 
                        type="text" 
                        value={agencyData.fantasyName}
                        onChange={(e) => setAgencyData({ ...agencyData, fantasyName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                      <div className="space-y-1.5 font-mono">
                        <label className="text-[10px] text-slate-400 font-sans uppercase font-bold">CNPJ Matriz:</label>
                        <input 
                          type="text" 
                          value={agencyData.cnpj}
                          onChange={(e) => setAgencyData({ ...agencyData, cnpj: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5 font-mono">
                        <label className="text-[10px] text-slate-400 font-sans uppercase font-bold">CRECI Jurídico Master:</label>
                        <input 
                          type="text" 
                          value={agencyData.creciJuridico}
                          onChange={(e) => setAgencyData({ ...agencyData, creciJuridico: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Endereço Físico Sede:</label>
                      <input 
                        type="text" 
                        value={agencyData.address}
                        onChange={(e) => setAgencyData({ ...agencyData, address: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Team agent table list */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 font-mono">2. Equipe Comercial de Corretores ({team.length})</h3>
                    <span className="text-slate-500 text-[10px] uppercase font-mono">Hierarquia Ativa</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-900 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/60 uppercase font-mono text-[9px] text-slate-400 border-b border-slate-850 font-bold">
                        <tr>
                          <th className="p-3">Corretor</th>
                          <th className="p-3">CRECI</th>
                          <th className="p-3">Cargo / Função</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 bg-slate-950/40">
                        {team.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-900/35 transition">
                            <td className="p-3 flex items-center gap-2">
                              <img src={a.photo} alt={a.name} className="h-7 w-7 rounded-full object-cover border border-slate-800" />
                              <div>
                                <p className="font-extrabold text-slate-200">{a.name}</p>
                                <p className="text-[9px] text-slate-500 font-mono">{a.email}</p>
                              </div>
                            </td>
                            <td className="p-3 font-mono">{a.creci}</td>
                            <td className="p-3">
                              <select 
                                value={a.role}
                                onChange={(e) => handleUpdateAgentRole(a.id, e.target.value)}
                                className="bg-slate-900 border border-slate-850 text-[10px] p-1 rounded text-slate-300 outline-none font-semibold cursor-pointer"
                              >
                                <option value="Supervisor">Supervisor</option>
                                <option value="Corretor Sênior">Corretor Sênior</option>
                                <option value="Corretor Júnior">Corretor Júnior</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide font-mono uppercase font-bold">Ativo</span>
                            </td>
                            <td className="p-3 text-center">
                              <button 
                                type="button"
                                onClick={() => handleRemoveAgent(a.id, a.name)}
                                className="p-1 text-rose-450 hover:bg-rose-500/10 rounded cursor-pointer"
                                title="Desvincular Corretor"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right Side: Add agent & Transfer leads */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Form to add agent */}
                <form onSubmit={handleAddAgent} className="bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 font-mono">3. Incluir Corretor na Franquia</h3>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-bold">Nome Completo:</label>
                      <input 
                        type="text" 
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-800 p-2 text-slate-200 rounded-lg outline-none focus:border-amber-500"
                        placeholder="Nome do Corretor"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase font-bold">E-mail Profissional:</label>
                      <input 
                        type="email" 
                        value={newAgentEmail}
                        onChange={(e) => setNewAgentEmail(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-800 p-2 text-slate-200 rounded-lg outline-none focus:border-amber-500"
                        placeholder="corretor@imobiliaria.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-455">CRECI:</label>
                        <input 
                          type="text" 
                          value={newAgentCreci}
                          onChange={(e) => setNewAgentCreci(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 p-2 text-slate-200 rounded-lg outline-none font-mono"
                          placeholder="Ex: 9010-F"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-455 animate-none">Permissão:</label>
                        <select 
                          value={newAgentRole}
                          onChange={(e) => setNewAgentRole(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 p-2 text-slate-200 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="Corretor Júnior">Corretor Júnior</option>
                          <option value="Corretor Sênior">Corretor Sênior</option>
                          <option value="Supervisor">Supervisor</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2 bg-slate-900 border border-slate-800 hover:text-amber-500 rounded-xl text-xs font-bold uppercase tracking-wider transition text-slate-200 cursor-pointer text-center"
                    >
                      Vincular Corretor Equipe +
                    </button>
                  </div>
                </form>

                {/* Lead transference center */}
                <form onSubmit={handleTransferLeads} className="bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 font-mono">4. Redistribuir Carteira de Leads</h3>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Mova o suporte de custódia e o corretor responsável por determinado cliente de forma automatizada e registrada.</p>
                  </div>

                  <div className="space-y-3.5 text-xs border-t border-slate-900 pt-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block">Selecione o Lead para Transferir:</label>
                      <select 
                        required
                        value={transferLeadId}
                        onChange={(e) => setTransferLeadId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-100 outline-none font-semibold cursor-pointer"
                      >
                        <option value="">-- Escolher Cliente Lead --</option>
                        {leads.map(l => (
                          <option key={l.id} value={l.id}>{l.name} (Ref: {l.responsible})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block">Destinar para o Corretor:</label>
                      <select 
                        required
                        value={transferTargetAgentId}
                        onChange={(e) => setTransferTargetAgentId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-100 outline-none font-semibold cursor-pointer"
                      >
                        <option value="">-- Corretor Credenciado --</option>
                        {team.map(t => (
                          <option key={t.id} value={t.id}>{t.name} [{t.role}]</option>
                        ))}
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs uppercase rounded-xl transition cursor-pointer text-center"
                    >
                      Executar Transferência de Lead
                    </button>
                  </div>
                </form>

              </div>

            </div>

          </div>
          )
        )}

        {/* ========================================== */}
        {/* TAB: signature (Módulo 23 — PLANOS E ASSINATURAS) */}
        {/* ========================================== */}
        {activeTab === "signature" && (
          <div className="space-y-6 animate-fade-in text-xs">
            
            {/* 1. SECTION TITLE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-3 gap-3">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-slate-100 flex items-center gap-2">
                  <CreditCard className="text-amber-500 h-5 w-5" /> Central de Assinatura, Cobrança & Planos
                </h2>
                <p className="text-xs text-slate-400">Gerencie seu plano atual, visualize limites de conversão, configure métodos de pagamento e baixe faturas passadas.</p>
              </div>

              <div className="flex items-center gap-2.5 font-mono text-[10px]">
                <label className="text-slate-400 uppercase font-bold text-[9px]">Simular Estado Financeiro (Sandbox):</label>
                <select 
                  value={subscriptionStatus}
                  onChange={(e: any) => {
                    setSubscriptionStatus(e.target.value);
                    alert(`[SANDBOX] Status da assinatura alterado para [${e.target.value.toUpperCase()}]. Os limites e painéis agora refletem este estado.`);
                  }}
                  className="bg-slate-950 border border-slate-800 text-[10px] p-1 rounded text-amber-500 font-bold outline-none cursor-pointer"
                >
                  <option value="Ativo">🟢 Ativo (Em dia)</option>
                  <option value="Trial">🟡 Trial Experimental</option>
                  <option value="Pendente">🔵 Faturamento Pendente</option>
                  <option value="Suspenso">🔴 Suspenso por Inadimplência</option>
                  <option value="Cancelado">⚪ Cancelado / Expira em breve</option>
                </select>
              </div>
            </div>

            {/* BILLING EXPIRATION ALERT STATUSES */}
            {subscriptionStatus === "Suspenso" && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                <AlertCircle className="text-rose-500 h-6 w-6 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-extrabold text-rose-455 uppercase text-[11px] tracking-wide">ASSINATURA SUSPENSA POR PENDÊNCIA FINANCEIRA</p>
                  <p className="text-xs text-slate-300">Os recursos de exportações de relatórios avançados, geração de contatos p/ WhatsApp e IA do consultor estão temporariamente suspensos. Regularize o faturamento abaixo via PIX ou Cartão de Crédito.</p>
                </div>
              </div>
            )}

            {subscriptionStatus === "Pendente" && (
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl flex items-center gap-3">
                <AlertCircle className="text-blue-550 h-5 w-5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-extrabold text-blue-400 uppercase text-[11px] tracking-wide">AGUARDANDO CONFIRMAÇÃO DE FATURAMENTO</p>
                  <p className="text-xs text-slate-300">Nossa inteligência financeira identificou um boleto pendente de compensação. Se já realizou o Pix, a liberação ocorre em até 10 minutos.</p>
                </div>
              </div>
            )}

            {subscriptionStatus === "Trial" && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-amber-500 h-5 w-5 shrink-0 animate-spin" style={{ animationDuration: "12s" }} />
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-amber-500 uppercase text-[11px] tracking-wide">VOCÊ ESTÁ NO PERÍODO DE TESTE GRATUITO (TRIAL)</p>
                    <p className="text-xs text-slate-350">Seu trial de segurança padrão de <strong className="text-amber-400 font-mono">{trialDurationDays} dias</strong> está ativo. Aproveite todas as ferramentas ilimitadas sem custos.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTrialExpiredSimulation(true);
                    alert("💥 Simulação de Trial Expirado ativada! O portal exibirá agora a tela de conversão bloqueante obrigatória.");
                  }}
                  className="px-3 py-1.5 bg-amber-500 text-black font-extrabold text-[10px] uppercase rounded-xl hover:bg-amber-600 transition tracking-wide cursor-pointer font-mono shadow-md shadow-amber-500/10"
                >
                  Furar Trial (Expirar)
                </button>
              </div>
            )}

            {/* 2. MAIN CURRENT PLAN & LIMITS BOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* CURRENT SUBSCRIBER CARD */}
              <div className="lg:col-span-4 bg-slate-950 p-5 rounded-3xl border border-slate-850 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-widest">Plano Atual</span>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight mt-0.5">
                        {activePlanId === "plan-starter" ? "Corretor Essencial" : activePlanId === "plan-premium" ? "Corretor Premium" : "Imobiliária / Business"}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-full tracking-wider border ${
                      subscriptionStatus === "Ativo" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" :
                      subscriptionStatus === "Trial" ? "bg-amber-400/15 text-amber-400 border-amber-400/20 animate-pulse" :
                      subscriptionStatus === "Suspenso" ? "bg-rose-500/15 text-rose-455 border-rose-500/20" :
                      "bg-blue-500/15 text-blue-400 border-blue-500/20"
                    }`}>
                      ● {subscriptionStatus}
                    </span>
                  </div>

                  <div className="space-y-1 bg-slate-900/60 p-3 rounded-2xl border border-slate-850 font-mono text-[11px] text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span>Ciclo:</span>
                      <strong className="text-slate-100 uppercase">{billingCycle === "monthly" ? "Mensal" : "Anual (Recorrente)"}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span>Mensalidade:</span>
                      <strong className="text-amber-500 text-xs font-bold">
                        R$ {activePlanId === "plan-starter" ? "97,00" : activePlanId === "plan-premium" ? "297,00" : "497,00"}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span>Data de Contratação:</span>
                      <strong className="text-slate-100">01/04/2026</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Próximo Faturamento:</span>
                      <strong className="text-amber-400 font-bold">01/07/2026</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 leading-normal font-sans">
                    Faturado via <strong className="text-indigo-400">Stripe Invoicing Gateway</strong>. Cartão de segurança cadastrado terminando em <span className="font-mono text-white font-bold">{paymentMethod.last4}</span> ({paymentMethod.brand}).
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPaymentCardForm(!showPaymentCardForm)}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 text-[10px] font-bold uppercase rounded-xl transition cursor-pointer"
                    >
                      {showPaymentCardForm ? "Fechar Cartão" : "Alterar Cartão"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Deseja realmente cancelar a renovação da sua assinatura? Seus recursos extras continuarão ativos até o fim do ciclo vigente (01/07/2026).")) {
                          setSubscriptionStatus("Cancelado");
                          alert("A renovação automática de sua assinatura foi desativada no sandbox.");
                        }
                      }}
                      className="py-2 px-3 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/20 text-rose-455 text-[10px] font-bold uppercase rounded-xl transition cursor-pointer"
                    >
                      Cancelar Cobrança
                    </button>
                  </div>
                </div>

              </div>

              {/* RESOURCE CONSUMPTION BAR PLOTS */}
              <div className="lg:col-span-8 bg-slate-950 p-5 rounded-3xl border border-slate-850 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] text-amber-500 font-mono uppercase font-bold tracking-widest block">Dashboard de Utilização</span>
                  <h3 className="font-extrabold text-white text-base">Consumo de Recursos & Limites Operacionais</h3>
                  <p className="text-xs text-slate-400">Verifique os limites vinculados às regras contratuais da contratação ativa.</p>
                </div>

                {/* Progress bars matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* LEADS PROGRESS */}
                  {(() => {
                    const limit = activePlanId === "plan-starter" ? 100 : activePlanId === "plan-premium" ? 5000 : 999999;
                    const used = leads.length;
                    const percentage = Math.min(Math.round((used / limit) * 100), 100);
                    const isNear = used / limit > 0.75 && activePlanId !== "plan-imob";
                    return (
                      <div className={`p-3 rounded-2xl border ${isNear ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-900/60 border-slate-850'} space-y-1.5`}>
                        <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                          <span className="text-slate-350 font-bold uppercase">Leads Ativos</span>
                          <span className={`${isNear ? 'text-amber-400 font-bold' : 'text-slate-450'}`}>
                            {used} de {limit === 999999 ? "∞" : limit} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isNear ? 'bg-amber-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        {isNear && (
                          <span className="text-[9px] text-amber-400 leading-normal block pt-1 font-semibold">
                            ⚠️ Alerta de Limite: Sua conta utilizou {percentage}% dos leads disponíveis no plano Essencial. Faça upgrade para evitar bloqueios de captação.
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* PROPERTIES LIMIT PROGRESS */}
                  {(() => {
                    const limit = activePlanId === "plan-starter" ? 50 : 999999;
                    const used = properties.length;
                    const percentage = limit === 999999 ? 12 : Math.min(Math.round((used / limit) * 100), 100);
                    const isNear = used / limit > 0.75 && limit !== 999999;
                    return (
                      <div className={`p-3 rounded-2xl border ${isNear ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-900/60 border-slate-850'} space-y-1.5`}>
                        <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                          <span className="text-slate-350 font-bold uppercase">Imóveis no Catálogo</span>
                          <span className={`${isNear ? 'text-amber-400 font-bold' : 'text-slate-455'}`}>
                            {used} de {limit === 999999 ? "Ilimitados" : limit} ({limit === 999999 ? "Ativo" : `${percentage}%`})
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                            style={{ width: `${limit === 999999 ? 12 : percentage}%` }}
                          />
                        </div>
                        {isNear && (
                          <span className="text-[9px] text-amber-400 leading-normal block pt-1 font-semibold">
                            ⚠️ Limite de Imóveis: Próximo ao teto permitido de {limit} unidades.
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* USERS / BROKERS SEATS PROGRESS */}
                  {(() => {
                    const limit = activePlanId === "plan-imob" ? 999999 : 1;
                    const used = activePlanId === "plan-imob" ? team.length : 1;
                    const percentage = limit === 999999 ? 35 : Math.min(Math.round((used / limit) * 100), 100);
                    return (
                      <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                          <span className="text-slate-350 font-bold uppercase">Assentos de Corretores</span>
                          <span className="text-slate-450">
                            {used} de {limit === 999999 ? "Ilimitados" : limit} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div 
                            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* STORAGE PROGRESS */}
                  {(() => {
                    const limit = activePlanId === "plan-starter" ? 5 : activePlanId === "plan-premium" ? 10 : 100;
                    const used = activePlanId === "plan-starter" ? 1.9 : activePlanId === "plan-premium" ? 3.8 : 12.4;
                    const percentage = Math.round((used / limit) * 100);
                    return (
                      <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                          <span className="text-slate-350 font-bold uppercase">Armazenamento Ficheiro (Fotos/Mídia)</span>
                          <span className="text-slate-450">
                            {used}GB de {limit}GB ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                </div>

                <div className="bg-slate-900/30 p-2.5 rounded-xl border border-slate-850/60 flex items-center justify-between text-[10px] text-slate-455 font-mono">
                  <span>🚀 Seus dados comerciais estão seguros em nuvem resiliente PostgreSQL com backups em tempo real.</span>
                </div>
              </div>

            </div>

            {/* CARD CHANGE FORM (IF ACTIVE) */}
            {showPaymentCardForm && (
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4 animate-fade-in">
                <div className="border-b border-slate-850 pb-2">
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">💾 Cadastrar Novo Cartão de Crédito (PCI-Compliant Bridge)</h4>
                  <p className="text-slate-400 text-[11px]">Seus dados de pagamento são transmitidos de forma encriptada ponta a ponta sem arquivamento direto no servidor local.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-455 uppercase font-black tracking-wider block">Bandeira:</label>
                    <select
                      value={editCardBrand}
                      onChange={(e) => setEditCardBrand(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-slate-205 cursor-pointer outline-none"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="Elo">Elo</option>
                      <option value="American Express">American Express</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-455 uppercase font-black tracking-wider block">Número do Cartão:</label>
                    <input
                      type="text"
                      value={editCardNum}
                      onChange={(e) => setEditCardNum(e.target.value)}
                      placeholder="4532 9018 7762 9918"
                      className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-slate-205 font-mono outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-455 uppercase font-black tracking-wider block">Titular Proprietário:</label>
                    <input
                      type="text"
                      value={editCardHolder}
                      onChange={(e) => setEditCardHolder(e.target.value.toUpperCase())}
                      placeholder="GABRIEL MENEZES"
                      className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-slate-250 font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-[10px]">
                  <button
                    onClick={() => setShowPaymentCardForm(false)}
                    className="py-1.5 px-4 bg-transparent hover:bg-slate-900 border border-slate-800 text-slate-455 rounded-lg cursor-pointer"
                  >
                    Desistir
                  </button>
                  <button
                    onClick={() => {
                      if (!editCardNum.trim() || !editCardHolder.trim()) {
                        alert("Preencha todos os dados corretamente!");
                        return;
                      }
                      const last4Chars = editCardNum.trim().slice(-4);
                      setPaymentMethod({
                        brand: editCardBrand,
                        last4: last4Chars || "7712",
                        holder: editCardHolder.trim()
                      });
                      setShowPaymentCardForm(false);
                      
                      setActiveMasterLogs(prev => [
                        { id: Date.now(), time: new Date().toLocaleTimeString().slice(0, 5), event: `Cartão de crédito atualizado terminando em [${last4Chars}]`, user: "BROKER GATEWAY" },
                        ...prev
                      ]);
                      alert("🎉 Cartão de crédito atualizado de forma síncrona no sandbox.");
                    }}
                    className="py-1.5 px-4 bg-amber-500 text-black font-extrabold uppercase rounded-lg cursor-pointer shadow-lg hover:bg-amber-600"
                  >
                    Salvar Cartão Sincronizado
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 3. CORE INTERACTIVE CHECKOUT & MIGRATE FLOW PANEL */}
            {/* ======================================================== */}
            {pendingMigratePlanId && (
              <div className="bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-950 p-6 rounded-3xl border border-amber-500/30 space-y-6 relative overflow-hidden animate-fade-in duration-300">
                <div className="absolute top-0 right-0 w-[15%] h-[15%] rounded-full bg-amber-450/10 blur-[60px] pointer-events-none"></div>

                <div className="flex justify-between items-start border-b border-slate-850 pb-3">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-amber-500 text-black font-black uppercase px-2 py-0.5 rounded-full font-mono">Processamento de Faturamento Sandbox</span>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      Finalizar a Migração do Plano para {pendingMigratePlanId === "plan-starter" ? "Corretor Essencial" : pendingMigratePlanId === "plan-premium" ? "Corretor Premium" : "Imobiliária Multi-usuário"}
                    </h3>
                    <p className="text-xs text-slate-400">Verifique os valores calculados, insira cupons de desconto e confirme o método de processamento em sandbox.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setPendingMigratePlanId(null);
                      setCouponCodeInput("");
                      setAppliedCoupon(null);
                    }}
                    className="p-1 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 hover:bg-slate-850 hover:text-white transition cursor-pointer text-[10px]"
                  >
                    Sair Checkout ✕
                  </button>
                </div>

                {/* COMPARISON METRICS / DOWNGRADE WARNING */}
                {(() => {
                  const isDowngrade = (activePlanId === "plan-imob" && pendingMigratePlanId !== "plan-imob") ||
                                      (activePlanId === "plan-premium" && pendingMigratePlanId === "plan-starter");
                  
                  if (isDowngrade) {
                    return (
                      <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl space-y-1 leading-normal text-rose-300">
                        <strong className="text-rose-455 text-xs block uppercase font-mono font-black">⚠️ ALERTA DE DOWNGRADE DE PLANO COBRANÇA</strong>
                        <p className="text-[11px]">Sua conta migrará para recursos reduzidos. Você perderá acesso a módulos de automações ilimitadas, relatórios inteligentes sincronizados e IA integrada comercial.</p>
                        <p className="text-[11px]">Qualquer excesso de limites ativos (como leads acima de 100) bloqueará edições de contatos de forma automatizada até que apague o excedente. O rebaixamento financeiro será agendado para o final do ciclo (01/07/2026).</p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl text-emerald-450 flex items-start gap-2.5">
                        <span className="text-xs">🎉</span>
                        <div className="space-y-0.5">
                          <p className="font-bold text-[11px] uppercase">Excelência em Vendas: Fantástica Escolha!</p>
                          <p className="text-[10px] text-slate-300">O upgrade é processado em tempo real. Seus novos limites são incrementados instantaneamente e você já pode disparar fluxos ilimitados.</p>
                        </div>
                      </div>
                    );
                  }
                })()}

                {/* CHECKOUT PRICING & TRANSACTION MATRIX */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* LEFT: PAYMENT METHOD SANDBOX DETAILS */}
                  <div className="md:col-span-7 space-y-4">
                    <span className="text-[10px] text-amber-500 font-mono uppercase font-bold block">1. Selecione o Gateway Comercial de Pagamentos</span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "credit", label: "Cartão de Crédito", desc: "Compensa na hora", banner: "Stripe" },
                        { id: "pix", label: "Pix Sincronizado", desc: "Confirmação instantânea", banner: "Mercado Pago" },
                        { id: "boleto", label: "Boleto Bancário", desc: "Compensação 1-2 dias", banner: "Asaas" },
                        { id: "debito", label: "Débito Online", desc: "Direto no banco", banner: "Stripe" }
                      ].map((pay) => (
                        <button
                          key={pay.id}
                          onClick={() => setCheckoutPaymentMethod(pay.id as any)}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-20 transition cursor-pointer ${
                            checkoutPaymentMethod === pay.id 
                              ? "bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/20" 
                              : "bg-slate-900/60 border-slate-850 hover:bg-slate-900"
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-bold text-slate-205 block leading-tight">{pay.label}</span>
                            <span className="text-[8px] text-slate-500 block mt-0.5 font-mono">{pay.desc}</span>
                          </div>
                          <span className="text-[8px] bg-slate-950 text-amber-500 font-mono px-1.5 py-0.2 rounded font-extrabold shadow block w-fit">
                            {pay.banner}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* DYNAMIC SCREEN BASED ON SELECTED GATEWAY */}
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-850 animate-fade-in text-[11px] leading-relaxed">
                      
                      {checkoutPaymentMethod === "credit" && (
                        <div className="space-y-3">
                          <p className="text-slate-400 font-sans">Processado com criptografia TLS 1.3 de alto desempenho. O cartão atual ({paymentMethod.brand} terminando em {paymentMethod.last4}) será faturado recorrentemente.</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>💳 Titular: <strong className="text-white">{paymentMethod.holder}</strong></span>
                            <span>•</span>
                            <button 
                              onClick={() => setShowPaymentCardForm(true)} 
                              className="text-amber-400 hover:underline font-bold cursor-pointer"
                            >
                              Trocar Cartão de Cobrança ✎
                            </button>
                          </div>
                        </div>
                      )}

                      {checkoutPaymentMethod === "pix" && (
                        <div className="space-y-3 flex flex-col sm:flex-row items-center gap-4">
                          {/* MOCK GENERATOR FOR PIX QR CODE */}
                          <div className="h-28 w-28 bg-white p-2 rounded-xl border border-slate-800 shrink-0 flex flex-col items-center justify-center relative shadow-md">
                            <span className="absolute top-1 left-1.5 text-[7px] text-indigo-900 font-black font-mono">PIX SANDBOX</span>
                            <QrCode className="h-20 w-20 text-slate-900" />
                            <span className="text-[7px] text-emerald-700 font-semibold font-sans">BR.GOV.BCB.PIX</span>
                          </div>

                          <div className="space-y-2 flex-1 w-full text-left">
                            <h5 className="font-bold text-white text-xs">Copia e Cola Pix Copiar</h5>
                            <p className="text-slate-400 text-[10px] leading-relaxed">Confirmação automática em 2 segundos utilizando automação bancária Sandbox Pix.</p>
                            
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value="00020101021226830014br.gov.bcb.pix5802BR5915SmartBrokerSaaS6009SAOPAULO62290525sb3979e6c4d68e46738fef3a1"
                                readOnly
                                className="bg-slate-950 border border-slate-800 text-[9px] px-2 py-1 rounded text-slate-400 font-mono outline-none flex-1 truncate"
                              />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText("00020101021226830014br.gov.bcb.pix5802BR5915SmartBrokerSaaS6009SAOPAULO62290525sb3979e6c4d68e46738fef3a1");
                                  alert("Chave Pix Copia e Cola copiada!");
                                }}
                                className="px-2 py-1 bg-slate-950 hover:bg-slate-850 text-amber-500 font-bold rounded text-[9px] border border-slate-800 active:scale-95 transition"
                              >
                                Copiar
                              </button>
                            </div>
                            
                            <button
                              onClick={() => {
                                alert("🎉 [SANDBOX APPROVED] Pagamento via Pix recebido com sucesso!");
                                (window as any).handleConfirmSaaSMigration();
                              }}
                              className="w-full mt-2 py-1.5 bg-emerald-500 text-black font-extrabold uppercase rounded-lg hover:bg-emerald-600 transition tracking-wide text-[10px] cursor-pointer text-center"
                            >
                              Simular Confirmação PIX Imediata ⚡
                            </button>
                          </div>
                        </div>
                      )}

                      {checkoutPaymentMethod === "boleto" && (
                        <div className="space-y-3">
                          <p className="text-slate-400">Pague em qualquer agência bancária ou internet banking. O faturamento em sandbox gera um boleto simulado registrado em conformidade com a FEBRABAN.</p>
                          <div className="flex flex-col sm:flex-row gap-2 font-mono text-[10px]">
                            <button
                              onClick={() => alert("Boleto Bancário PDF gerado no sandbox!")}
                              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 font-bold border border-slate-800 rounded flex-1 text-center"
                            >
                              📥 Visualizar PDF do Boleto
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText("34191.79001 01043.513184 91020.150008 3 99180000029700");
                                alert("Código de barras do boleto copiado com sucesso!");
                              }}
                              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-350 border border-slate-800 rounded flex-1 text-center"
                            >
                              📋 Copiar Linha Digitável
                            </button>
                          </div>
                        </div>
                      )}

                      {checkoutPaymentMethod === "debito" && (
                        <div className="space-y-2 text-left">
                          <p className="text-slate-400 mb-2 font-sans">Simule a autorização direta para as bandeiras Itaú, Bradesco ou Banco do Brasil.</p>
                          <div className="grid grid-cols-3 gap-2">
                            {["Itaú Unibanco", "Bradesco", "Banco do Brasil"].map(bank => (
                              <button
                                key={bank}
                                onClick={() => {
                                  alert(`Conexão de sandbox concluída e débito autorizado para ${bank}!`);
                                  (window as any).handleConfirmSaaSMigration();
                                }}
                                className="px-2 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded text-center transition text-[10px]"
                              >
                                {bank} 🏛️
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* RIGHT: BILLING CHECKS SUMMARY & PROMOTIONAL COUPONS */}
                  <div className="md:col-span-5 bg-slate-900/60 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-4 font-sans text-xs">
                    
                    <div className="space-y-3">
                      <span className="text-[10px] text-amber-500 font-mono uppercase font-bold block">2. Resumo de Faturamento Integrado</span>
                      
                      {(() => {
                        const originalPrice = pendingMigratePlanId === "plan-starter" ? 97 : pendingMigratePlanId === "plan-premium" ? 297 : 497;
                        const isYearly = billingCycle === "yearly";
                        const basePrice = isYearly ? originalPrice * 10 : originalPrice;
                        
                        let discountPercent = appliedCoupon ? appliedCoupon.discount : 0;
                        const savingsAmount = basePrice * (discountPercent / 100);
                        const finalPrice = basePrice - savingsAmount;
                        
                        return (
                          <div className="space-y-2.5 text-[11px] font-mono border-b border-slate-800 pb-3">
                            <div className="flex justify-between text-slate-400">
                              <span>Plano Contratado:</span>
                              <span className="text-slate-205 font-bold uppercase">
                                {pendingMigratePlanId === "plan-starter" ? "Essencial" : pendingMigratePlanId === "plan-premium" ? "Premium" : "Imobiliária"}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Período de Ciclo:</span>
                              <span className="text-slate-205 uppercase">{isYearly ? "Anual" : "Mensal"}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Valor Origem:</span>
                              <span className="text-slate-205 font-bold">R$ {basePrice.toFixed(2)}</span>
                            </div>

                            {appliedCoupon && (
                              <div className="flex justify-between text-emerald-450 font-bold leading-none py-1 bg-emerald-500/5 px-2 rounded border border-emerald-500/10">
                                <span>Cupom [{appliedCoupon.code}]:</span>
                                <span>-{appliedCoupon.discount}% OFF (-R$ {savingsAmount.toFixed(2)})</span>
                              </div>
                            )}

                            {isYearly && (
                              <div className="flex justify-between text-amber-500 text-[10px] bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 leading-relaxed font-sans">
                                <span>Savings Anual:</span>
                                <strong>2 MESES GRÁTIS ATIVOS ✓</strong>
                              </div>
                            )}

                            <div className="flex justify-between font-extrabold text-white text-sm border-t border-slate-800 pt-2.5">
                              <span>Total Final:</span>
                              <span className="text-amber-500 font-mono">R$ {finalPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* CONFLICT / OVER-LIMITS SYSTEM BLOCK */}
                      {(() => {
                        const isStarterUpgradeTarget = pendingMigratePlanId === "plan-starter";
                        const leadsExceeded = leads.length > 100;
                        const propertiesExceeded = properties.length > 50;
                        
                        if (isStarterUpgradeTarget && (leadsExceeded || propertiesExceeded)) {
                          return (
                            <div className="bg-red-500/15 border border-red-500/30 p-2.5 rounded-xl space-y-1.5 font-sans leading-relaxed text-slate-300">
                              <p className="text-[10px] text-rose-400 font-extrabold uppercase flex items-center gap-1 leading-none">
                                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" /> CONFLITO DE LIMITES DE DADOS
                              </p>
                              <p className="text-[9px] text-slate-400">
                                Você possui <strong className="text-white">{leads.length} leads</strong> e <strong className="text-white">{properties.length} imóveis</strong> no banco de dados. O plano Essencial aceita apenas <strong className="text-white">100 leads</strong> e <strong className="text-white">50 imóveis</strong>. 
                              </p>
                              <p className="text-[9px] text-amber-400">
                                Dica sandbox: Você pode prosseguir mesmo assim no simulador, mas novos cadastros ficarão suspensos até você deletá-los.
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* PROMOTIONAL COUPON FORM */}
                      <div className="space-y-1.5 font-sans text-left">
                        <label className="text-[9px] text-slate-455 uppercase font-black tracking-wider block">Cupom Promocional (Sandbox):</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={couponCodeInput}
                            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                            placeholder="Ex: BLACKFRIDAY50, MASTER90"
                            className="bg-slate-950 border border-slate-800 text-[10px] p-2 rounded-xl text-slate-100 placeholder-slate-600 outline-none flex-1 font-mono uppercase"
                          />
                          <button
                            onClick={() => {
                              if (!couponCodeInput.trim()) return;
                              const couponCandidate = couponCodeInput.trim().toUpperCase();
                              
                              const staticCoupons = [
                                { code: "MASTER90", discount: 90 },
                                { code: "BLACKFRIDAY50", discount: 50 },
                                { code: "IMOBELITE", discount: 20 }
                              ];
                              
                              const found = adminCoupons.find(c => c.code === couponCandidate) || 
                                            staticCoupons.find(s => s.code === couponCandidate);
                              
                              if (found) {
                                setAppliedCoupon({ code: found.code, discount: found.discount });
                                alert(`🎉 Cupom [${found.code}] validado: ${found.discount}% OFF aplicado.`);
                              } else {
                                alert("❌ Cupom inválido ou expirado!");
                              }
                            }}
                            className="py-1 px-3 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 text-[10px] font-bold rounded-lg font-mono transition cursor-pointer"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 text-[10px] font-sans pt-3 border-t border-slate-800/60">
                      <button
                        onClick={() => {
                          setPendingMigratePlanId(null);
                          setCouponCodeInput("");
                          setAppliedCoupon(null);
                        }}
                        className="flex-1 py-2 bg-transparent hover:bg-slate-900 border border-slate-800 text-slate-455 rounded-xl cursor-pointer"
                      >
                        Desistir
                      </button>
                      <button
                        onClick={() => {
                          (window as any).handleConfirmSaaSMigration();
                        }}
                        className="flex-1 py-1 px-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-600 font-extrabold uppercase rounded-xl tracking-wider cursor-pointer text-center"
                      >
                        Confirmar Migração ✓
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* Helper function to execute and complete plan migration */}
            {(() => {
              (window as any).handleConfirmSaaSMigration = () => {
                const target = pendingMigratePlanId;
                if (!target) return;
                
                handleUpgradePlan(target);
                
                const originalPrice = target === "plan-starter" ? 97 : target === "plan-premium" ? 297 : 497;
                const basePrice = billingCycle === "yearly" ? originalPrice * 10 : originalPrice;
                const discount = appliedCoupon ? appliedCoupon.discount : 0;
                const finalValue = basePrice * (1 - discount / 100);
                
                const newInv = {
                  id: `INV-00${invoices.length + 1}`,
                  date: new Date().toISOString().substring(0, 10),
                  value: finalValue,
                  status: "Pago",
                  url: "#",
                  planName: target === "plan-starter" ? "Corretor Essencial" : target === "plan-premium" ? "Corretor Premium" : "Imobiliária"
                };
                setInvoices([newInv, ...invoices]);
                
                setActiveMasterLogs(prev => [
                  { 
                    id: Date.now(), 
                    time: new Date().toLocaleTimeString().slice(0, 5), 
                    event: `Faturamento aprovado: Plano [${target}] via sandbox [${checkoutPaymentMethod.toUpperCase()}]. Valor: R$ ${finalValue}`, 
                    user: "SYSTEM STRIPE" 
                  },
                  ...prev
                ]);
                
                setPendingMigratePlanId(null);
                setCouponCodeInput("");
                setAppliedCoupon(null);
              };
            })()}


            {/* ======================================================== */}
            {/* 4. VISUALLY HIGHLIGHTED PLAN COMPARISON GRID MATRIX */}
            {/* ======================================================== */}
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-850/80 space-y-4">
              <div className="text-center max-w-xl mx-auto space-y-1 pb-4">
                <span className="text-[9px] text-amber-500 font-mono uppercase font-bold tracking-widest block font-bold">Comparador Completo</span>
                <h3 className="font-extrabold text-white text-lg uppercase tracking-tight">Tabela Geral Comparativa de Recursos Comerciais</h3>
                <p className="text-xs text-slate-400">Escolha o plano sob medida para sua carreira autônoma ou imobiliária.</p>
              </div>

              {/* COMPARATIVE CART CARDS FOR EACH PLAN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* PLAN 1: ESSENCIAL */}
                <div id="plan-essencial-card" className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  activePlanId === "plan-starter" 
                    ? "bg-slate-900/40 border-teal-500/50 shadow-md ring-1 ring-teal-500/15" 
                    : "bg-slate-900/10 border-slate-850 hover:border-slate-800"
                } relative transition-all duration-300`}>
                  {activePlanId === "plan-starter" && (
                    <span className="absolute top-3 right-3 bg-teal-500/10 text-teal-400 text-[8px] font-black uppercase px-2 py-0.5 rounded font-mono border border-teal-500/20">
                      Plano Ativo
                    </span>
                  )}

                  <div className="space-y-4 text-left">
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono uppercase font-black">Plano 1</span>
                      <h4 className="text-base font-black text-slate-100 uppercase tracking-tight">Corretor Essencial</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-1 font-sans">Desenvolvido para corretores autônomos que estão dando os primeiros passos no funil digital.</p>
                    </div>

                    <div className="border-t border-slate-850/60 pt-3 text-left">
                      <p className="text-[10px] text-slate-400">Ciclo Mensal</p>
                      <p className="text-2xl font-black font-mono text-white">R$ 97<span className="text-[10px] text-slate-500 font-sans font-normal">/mês</span></p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">Ou R$ 970 faturado anualmente</p>
                    </div>

                    {/* Limits list */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 space-y-1 font-mono text-[9px] text-slate-400 text-left">
                      <div>👥 Usuário: <strong className="text-slate-205">1 Corretor</strong></div>
                      <div>📍 Leads Máximos: <strong className="text-slate-205">100 Leads Ativos</strong></div>
                      <div>🏢 Cadastro de Imóveis: <strong className="text-slate-205">Até 50 Unidades</strong></div>
                      <div>📁 Armazenamento: <strong className="text-slate-205">5 GB Seguros</strong></div>
                    </div>

                    {/* Features list */}
                    <ul className="text-[10px] space-y-2 border-t border-slate-900 pt-4 text-slate-350 text-left">
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Cartão Digital Premium</li>
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> QR Code Estático Simples</li>
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> CRM Imobiliário Básico</li>
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Exportação Básica PDF/CSV</li>
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> WhatsApp convencional integrado</li>
                      <li className="flex items-center gap-1.5 text-slate-500"><span className="text-rose-500">✕</span> Analytics Avançado</li>
                      <li className="flex items-center gap-1.5 text-slate-500"><span className="text-rose-500">✕</span> Inteligência Artificial (Gemini)</li>
                      <li className="flex items-center gap-1.5 text-slate-500"><span className="text-rose-500">✕</span> Automação de Workflows</li>
                    </ul>
                  </div>

                  <div className="space-y-2 mt-6">
                    <button
                      onClick={() => setPendingMigratePlanId("plan-starter")}
                      disabled={activePlanId === "plan-starter"}
                      className={`w-full py-2.5 text-[10px] font-black uppercase rounded-xl transition cursor-pointer text-center ${
                        activePlanId === "plan-starter"
                          ? "bg-slate-950/40 text-slate-600 tracking-wide border border-transparent cursor-not-allowed"
                          : "bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850 hover:text-white"
                      }`}
                    >
                      {activePlanId === "plan-starter" ? "Seu Plano Ativo" : "Migrar para Essencial"}
                    </button>
                    <button 
                      onClick={() => document.getElementById("full-features-table")?.scrollIntoView({ behavior: "smooth" })}
                      className="w-full text-center text-[9px] text-slate-500 hover:text-slate-300 transition block font-bold py-1 uppercase"
                    >
                      Comparar Recursos ↓
                    </button>
                  </div>
                </div>

                {/* PLAN 2: PREMIUM (GOLDE BRANDED - MOST POPULAR) */}
                <div id="plan-premium-card" className={`p-5 rounded-2xl border-2 flex flex-col justify-between ${
                  activePlanId === "plan-premium" 
                    ? "bg-slate-900/60 border-amber-500/80 shadow-2xl shadow-amber-500/5 ring-1 ring-amber-500/25" 
                    : "bg-slate-900/10 border-amber-505/25 hover:border-amber-550 hover:bg-slate-900/20"
                } relative transition-all duration-300 scale-[1.01]`}>
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black font-mono px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    ⭐ RECOMENDADO / MAIS POPULAR ⭐
                  </div>
                  
                  {activePlanId === "plan-premium" && (
                    <span className="absolute top-3 right-3 bg-amber-500/10 text-amber-400 text-[8px] font-black uppercase px-2 py-0.5 rounded font-mono border border-amber-500/20">
                      Plano Ativo
                    </span>
                  )}

                  <div className="space-y-4 pt-1 text-left">
                    <div>
                      <span className="text-[9px] text-amber-550 font-mono uppercase font-black font-bold">Plano 2</span>
                      <h4 className="text-base font-black text-amber-400 uppercase tracking-tight flex items-center gap-1.5 font-bold">
                        Corretor Premium <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-amber-400" />
                      </h4>
                      <p className="text-[10px] text-slate-300 leading-relaxed mt-1 font-sans">A engrenagem perfeita p/ impulsionar prospecções, utilizando insights cognitivos de IA e rastreamento.</p>
                    </div>

                    <div className="border-t border-slate-850/60 pt-3 text-left">
                      <p className="text-[10px] text-slate-400 font-sans">Ciclo Mensal</p>
                      <p className="text-2xl font-black font-mono text-amber-400">R$ 297<span className="text-[10px] text-slate-550 font-sans font-normal">/mês</span></p>
                      <p className="text-[9px] text-amber-600 font-mono mt-0.5">Ou R$ 2.970 faturado anualmente</p>
                    </div>

                    {/* Limits list */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 shadow space-y-1 font-mono text-[9px] text-amber-400/80 text-left">
                      <div>👥 Usuário: <strong className="text-slate-100">1 Corretor Dedicado</strong></div>
                      <div>📍 Leads Máximos: <strong className="text-slate-100">5.000 Leads Ativos</strong></div>
                      <div>🏢 Cadastro de Imóveis: <strong className="text-orange-400 font-black">IMÓVEIS ILIMITADOS ✓</strong></div>
                      <div>📁 Armazenamento: <strong className="text-slate-100">10 GB Seguros</strong></div>
                    </div>

                    {/* Features list */}
                    <ul className="text-[10px] space-y-2 border-t border-slate-900 pt-4 text-slate-350 text-left">
                      <li className="flex items-center gap-1.5"><span className="text-amber-500 font-extrabold font-mono">✓</span> Tudo do plano Essencial</li>
                      <li className="flex items-center gap-1.5"><span className="text-amber-500 font-extrabold font-mono">✓</span> Analytics Avançado (Cliques/Whats)</li>
                      <li className="flex items-center gap-1.5"><span className="text-amber-500 font-extrabold font-mono">✓</span> Consultor Gemini IA Integrado</li>
                      <li className="flex items-center gap-1.5"><span className="text-amber-500 font-extrabold font-mono">✓</span> Rastreamento Comportamental</li>
                      <li className="flex items-center gap-1.5"><span className="text-amber-500 font-extrabold font-mono">✓</span> Lead Scoring automatizado</li>
                      <li className="flex items-center gap-1.5"><span className="text-amber-500 font-extrabold font-mono">✓</span> Automações de Lead ilimitadas</li>
                      <li className="flex items-center gap-1.5"><span className="text-amber-500 font-extrabold font-mono">✓</span> RD Station & Google Sheets Sync</li>
                      <li className="flex items-center gap-1.5 text-slate-500"><span className="text-rose-500">✕</span> Gestão Gerencial de Equipes</li>
                    </ul>
                  </div>

                  <div className="space-y-2 mt-6">
                    <button
                      onClick={() => setPendingMigratePlanId("plan-premium")}
                      disabled={activePlanId === "plan-premium"}
                      className={`w-full py-2.5 text-[10px] font-black uppercase rounded-xl transition cursor-pointer text-center ${
                        activePlanId === "plan-premium"
                          ? "bg-slate-950/40 text-slate-650 tracking-wide border border-transparent cursor-not-allowed"
                          : "bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black hover:from-amber-600 shadow-md hover:shadow-amber-500/10"
                      }`}
                    >
                      {activePlanId === "plan-premium" ? "Seu Plano Ativo" : "Adquirir Premium"}
                    </button>
                    <button 
                      onClick={() => document.getElementById("full-features-table")?.scrollIntoView({ behavior: "smooth" })}
                      className="w-full text-center text-[9px] text-slate-500 hover:text-slate-300 transition block font-bold py-1 uppercase font-sans"
                    >
                      Comparar Recursos ↓
                    </button>
                  </div>
                </div>

                {/* PLAN 3: IMOBILIÁRIA (CORPORATE DEDICATED) */}
                <div id="plan-imob-card" className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  activePlanId === "plan-imob" 
                    ? "bg-slate-900/40 text-slate-100 border-teal-500/50 shadow-md ring-1 ring-teal-500/15" 
                    : "bg-slate-900/10 border-slate-850 hover:border-slate-800"
                } relative transition-all duration-300`}>
                  {activePlanId === "plan-imob" && (
                    <span className="absolute top-3 right-3 bg-teal-500/10 text-teal-400 text-[8px] font-black uppercase px-2 py-0.5 rounded font-mono border border-teal-500/20">
                      Plano Ativo
                    </span>
                  )}

                  <div className="space-y-4 text-left">
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono uppercase font-black">Plano 3</span>
                      <h4 className="text-base font-black text-slate-100 uppercase tracking-tight flex items-center gap-1 font-bold">
                        Imobiliária / Equipe <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-1 font-sans">Solução unificada sob medida para imobiliárias, incorporadoras e redes de corretores.</p>
                    </div>

                    <div className="border-t border-slate-850/60 pt-3 text-left">
                      <p className="text-[10px] text-slate-400">Ciclo Mensal</p>
                      <p className="text-2xl font-black font-mono text-white">R$ 497<span className="text-[10px] text-slate-550 font-sans font-normal">/mês</span></p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">Ou R$ 4.970 faturado anualmente</p>
                    </div>

                    {/* Limits list */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 space-y-1 font-mono text-[9px] text-slate-400 text-left">
                      <div>👥 Corretores: <strong className="text-emerald-450 font-black">ILIMITADOS ✓</strong></div>
                      <div>📍 Leads Máximos: <strong className="text-emerald-450 font-black">ILIMITADOS ✓</strong></div>
                      <div>🏢 Imóveis: <strong className="text-emerald-450 font-black">ILIMITADOS ✓</strong></div>
                      <div>📁 Armazenamento: <strong className="text-slate-100">100 GB Dedicados</strong></div>
                    </div>

                    {/* Features list */}
                    <ul className="text-[10px] space-y-2 border-t border-slate-900 pt-4 text-slate-350 text-left">
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold font-mono">✓</span> Tudo do plano Corretor Premium</li>
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold font-mono">✓</span> Gestão de Equipe & Gerentes</li>
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold font-mono">✓</span> Distribuição Automática de Leads</li>
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold font-mono">✓</span> Regras de Roteamento Custom</li>
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold font-mono">✓</span> Metas & Ranking Comercial</li>
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold font-mono">✓</span> Dashboard Gerencial Corporativo</li>
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold font-mono">✓</span> Comparação Multi-equipe</li>
                      <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold font-mono">✓</span> Controle Fino de Permissões</li>
                    </ul>
                  </div>

                  <div className="space-y-2 mt-6">
                    <button
                      onClick={() => setPendingMigratePlanId("plan-imob")}
                      disabled={activePlanId === "plan-imob"}
                      className={`w-full py-2.5 text-[10px] font-black uppercase rounded-xl transition cursor-pointer text-center ${
                        activePlanId === "plan-imob"
                          ? "bg-slate-950/40 text-slate-655 tracking-wide border border-transparent cursor-not-allowed"
                          : "bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850 hover:text-white"
                      }`}
                    >
                      {activePlanId === "plan-imob" ? "Seu Plano Ativo" : "Assinar Imobiliária"}
                    </button>
                    <button 
                      onClick={() => {
                        alert("Fale direto com a gerência corporativa via WhatsApp (91) 98011-2090 para planos acima de 50 corretores.");
                      }}
                      className="w-full text-center text-[9px] text-amber-500 hover:text-amber-400 transition font-bold block py-1 uppercase flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Falar com Consultor 🗣️
                    </button>
                  </div>
                </div>

              </div>

              {/* 5. GENERAL COMPREHENSIVE FEATURES MATRIX */}
              <div id="full-features-table" className="pt-6 border-t border-slate-900 overflow-x-auto text-left">
                <table className="w-full text-[10px] text-left text-slate-350 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-100 font-mono text-[9px] uppercase tracking-wider bg-slate-900/30">
                      <th className="p-3 text-left">Recurso / Módulo</th>
                      <th className="p-3 text-left">Essencial (R$ 97)</th>
                      <th className="p-3 text-left text-amber-450 bg-amber-500/5">Premium Gold (R$ 297)</th>
                      <th className="p-3 text-left">Imobiliária Business (R$ 497)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-200">Cartão de Visita Digital</td>
                      <td className="p-2.5">Simples</td>
                      <td className="p-2.5 text-amber-500 bg-amber-500/5 font-bold">Personalizado Premium</td>
                      <td className="p-2.5">Personalizado Premium</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-200">Rastreamento de Leads</td>
                      <td className="p-2.5 text-slate-500">✕ Bloqueado</td>
                      <td className="p-2.5 text-amber-500 bg-amber-500/5 font-bold">✓ Cliques & WhatsApp</td>
                      <td className="p-2.5">✓ Cliques, WhatsApp & Tour</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-200">Consultor Inteligente IA</td>
                      <td className="p-2.5 text-slate-500">✕ Bloqueado</td>
                      <td className="p-2.5 text-emerald-400 bg-amber-500/5 font-bold">✓ Gemini API Insights</td>
                      <td className="p-2.5">✓ Gemini API Insights</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-200">Automações Comerciais</td>
                      <td className="p-2.5 text-slate-500">✕ Bloqueado</td>
                      <td className="p-2.5 text-amber-500 bg-amber-500/5 font-bold">✓ Ilimitado</td>
                      <td className="p-2.5">✓ Ilimitado</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-205">Roteamento de Contatos</td>
                      <td className="p-2.5 text-slate-500">✕ Bloqueado</td>
                      <td className="p-2.5 text-slate-500 bg-amber-500/5">✕ Bloqueado</td>
                      <td className="p-2.5 text-emerald-400 font-bold">✓ Fila de Corretores</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-205">Equipes & Supervisores</td>
                      <td className="p-2.5 text-slate-500">✕ Bloqueado</td>
                      <td className="p-2.5 text-slate-500 bg-amber-500/5">✕ Bloqueado</td>
                      <td className="p-2.5 text-emerald-400 font-bold">✓ Corretores ilimitados</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-205">Exportações & Relatórios</td>
                      <td className="p-2.5">PDF/CSV Básicas</td>
                      <td className="p-2.5 text-amber-500 bg-amber-500/5 font-bold">XLSX, PDF, Google Sheets</td>
                      <td className="p-2.5">Automáticos e Corporativos</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>


            {/* ======================================================== */}
            {/* 6. REVERIFIABLE FINANCIAL INVOICING RECORDS TABLE */}
            {/* ======================================================== */}
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-850 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
                <div>
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider text-left">🧾 Histórico de Faturamento & Recibos (Stripe Engine)</h4>
                  <p className="text-[11px] text-slate-400">Verifique todas as transações realizadas e baixe as Notas Fiscais Eletrônicas simuladas do sandbox.</p>
                </div>
                <button
                  onClick={() => {
                    alert("A lista de notas fiscais foi sincronizada com a API Stripe no sandbox.");
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded-lg transition cursor-pointer font-sans"
                >
                  Sincronizar Recibos
                </button>
              </div>

              {/* Invoice lines table */}
              <div className="space-y-2 text-left">
                {invoices.map((inv) => (
                  <div key={inv.id} className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-slate-950 rounded-lg flex items-center justify-center font-mono font-bold text-amber-500 border border-slate-850">
                        {inv.id.substring(4)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 flex items-center gap-1.5">
                          Fatura {inv.id} <span className="text-[9px] bg-slate-950 px-1.5 py-0.2 rounded text-slate-400 font-mono">{inv.planName || "Corretor Premium"}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Emitido em {inv.date} via {paymentMethod.brand} - Master sandbox payment</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-850/60 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="font-black font-mono text-amber-400">R$ {parseFloat(inv.value).toFixed(2)}</p>
                        <span className="text-[9px] text-emerald-400 font-bold font-mono">● Pago e Homologado</span>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            alert(`📄 NF-e SIMULADA CONCODANTE COM PARÂMETROS FISCAIS:\n` +
                                  `---------------------------------------------------------\n` +
                                  `RPS Nº: ${inv.id} | Código de Autenticidade: SB-837E-901B-77A2\n` +
                                  `Prestador: SmartBroker SaaS Serviços de Tecnologia LTDA\n` +
                                  `Tomador: Gabriel Menezes ME | CRECI: GO-22183\n` +
                                  `Valor Declarado: R$ ${parseFloat(inv.value).toFixed(2)}\n` +
                                  `ISSQN retido na fonte. Nota Fiscal Homologada pelo webservice fiscal.`);
                          }}
                          className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-305 hover:text-white rounded-lg text-[10px] uppercase font-bold cursor-pointer"
                        >
                          Visualizar NF-e
                        </button>
                        <button
                          onClick={() => {
                            alert(`💾 [SANDBOX DOWNLOAD] Comprovante PDF baixado com sucesso!\nO arquivo comprovante_faturamento_${inv.id}.pdf de R$ ${inv.value} foi salvo.`);
                          }}
                          className="p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded text-[10px] cursor-pointer font-sans"
                          title="Fazer Download do Recibo de Pagamento"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* TAB: export_center (Módulo 24 — EXPORTAÇÃO E COMPARTILHAMENTO) */}
        {/* ========================================== */}
        {activeTab === "export_center" && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-3 gap-3">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-slate-100 flex items-center gap-1.5">
                  <Download className="text-blue-400" /> Central de Exportação, Relatórios & Agendamento (Módulo 24)
                </h2>
                <p className="text-xs text-slate-400">Exporte planilhas completas de leads do CRM, consolide tráfego e configure disparos automáticos para gestores comerciais.</p>
              </div>

              {/* Selector for export format */}
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-850/80 flex items-center gap-1.5 text-xs">
                <span className="text-slate-450 font-mono text-[9px] uppercase font-bold px-2">Formato Padrão:</span>
                <select 
                  value={exportFormat}
                  onChange={(e: any) => setExportFormat(e.target.value)}
                  className="bg-slate-900 text-slate-200 border border-slate-850 p-1 rounded text-[10px] outline-none font-bold cursor-pointer"
                >
                  <option value="CSV">CSV Spreadsheet</option>
                  <option value="XLSX">Excel (XLSX)</option>
                  <option value="PDF">PDF Report</option>
                  <option value="Google Sheets">Google Sheets Sync</option>
                </select>
              </div>
            </div>

            {/* DOWNLOAD EXPORT FILES CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: Leads Database */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-amber-500 font-mono uppercase font-black tracking-wider block">CRM DATA</span>
                  <p className="font-extrabold text-sm text-slate-250">Base de Leads Sincronizada</p>
                  <p className="text-xs text-slate-450 leading-relaxed font-sans mt-1">
                    Exporta a listagem inteira com telefones, e-mails, score de qualificação comportamental, de forma instantânea para importação em outros CRM.
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    handleDownloadCrmData("leads");
                    alert(`📥 Baixando arquivo CSV de leads do SmartBroker...\nContém os ${leads.length} leads ativos da sua carteira comercial em conformidade com as diretivas LGPD.`);
                  }}
                  className="w-full mt-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center"
                >
                  Exportar Base Leads
                </button>
              </div>

              {/* Card 2: Catalog Products */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-amber-500 font-mono uppercase font-black tracking-wider block">CATALOG DATA</span>
                  <p className="font-extrabold text-sm text-slate-250">Catálogo Geral de Imóveis</p>
                  <p className="text-xs text-slate-450 leading-relaxed font-sans mt-1">
                    Gera planilha de imóveis com dados estruturais (id, título, preço de mercado, área construída e as respectivas suítes e banheiros cadastrados).
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    handleDownloadCrmData("properties");
                    alert(`📥 Baixando catálogo estrutural imobiliário...\nContém as especificações detalhadas de suites, bairro e valores de comercialização.`);
                  }}
                  className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:text-amber-500 text-slate-250 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center"
                >
                  Exportar Catálogo
                </button>
              </div>

              {/* Card 3: Traffic & conversions analytics */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-amber-500 font-mono uppercase font-black tracking-wider block">ANALYTICS REPORT</span>
                  <p className="font-extrabold text-sm text-slate-250">CTR Cliques, Score & Conversões</p>
                  <p className="text-xs text-slate-450 leading-relaxed font-sans mt-1">
                    Gera um demonstrativo de tráfego, compilando cliques no WhatsApp do Cartão, cliques para salvar contato, e a taxa consolidada de conversão.
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    handleDownloadCrmData("analytics");
                    alert(`📥 Compilando arquivo de tráfego imobiliário...\nContém métricas consolidadas de interações com o cartão digital e taxas medias.`);
                  }}
                  className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:text-amber-500 text-slate-250 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center"
                >
                  Exportar Relatórios
                </button>
              </div>

            </div>

            {/* SYNC GOOGLE SHEETS & AUTOMATION REPORT SCHEDULER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Google Workspace Sync integration */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-4 text-xs">
                <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-450 font-mono flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-blue-400 animate-pulse animate-none" /> Sincronização Google Workspace
                  </h3>
                  <span className="text-[8px] bg-slate-905 text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded">OAUTH 2.0 CLOUD API</span>
                </div>

                <p className="text-slate-400 leading-relaxed">
                  Conecte seu SmartBroker diretamente ao Google Sheets para enviar leads qualificados automaticamente para suas planilhas em tempo real, sem necessidade de transferências manuais de arquivos CSV.
                </p>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-205 font-mono text-[10px]">Google Sheets Sync Real-time:</span>
                    <p className="text-[9px] text-amber-500 font-bold uppercase font-sans">STATUS: CONEXÃO AUTORIZADA REAL-TIME CLOUD</p>
                  </div>

                  <button 
                    type="button"
                    onClick={() => {
                      alert("🔗 Iniciando fluxo de consentimento OAuth do Google Workspace...\nAutenticando escopo de Planilhas e Drive para sincronização.");
                    }}
                    className="px-3 py-1 bg-slate-950 border border-slate-800 rounded font-black text-[9px] uppercase tracking-wider text-slate-105 cursor-pointer"
                  >
                    Ativar Sheets Sync
                  </button>
                </div>
              </div>

              {/* REPORT SCHEDULER DISPATCH RULES */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 font-mono">Agendamento de Relatórios Periódicos (E-mail / WhatsApp)</h3>
                
                <div className="space-y-4 text-xs">
                  <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl">
                    <legend className="text-[8.5px] uppercase font-mono tracking-widest text-slate-500 font-bold px-1">Novo Agendador de CRM:</legend>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 block uppercase font-bold">Frequência:</label>
                      <select 
                        value={reportSchedulerType}
                        onChange={(e: any) => setReportSchedulerType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-200 outline-none font-semibold cursor-pointer text-[10px]"
                      >
                        <option value="diario">Diário (Auto)</option>
                        <option value="semanal">Semanal (Segas)</option>
                        <option value="mensal">Mensal (Dia 1)</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[9px] text-slate-400 block uppercase font-bold">E-mail do Destinatário GESTOR:</label>
                      <input 
                        type="email"
                        value={scheduleEmailDestination}
                        onChange={(e) => setScheduleEmailDestination(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-100 outline-none"
                        placeholder="diretoria@smartbroker.com"
                      />
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        if (!scheduleEmailDestination) return;
                        setActiveSchedules(prev => [
                          ...prev,
                          {
                            id: `sched-${Date.now()}`,
                            type: reportSchedulerType,
                            destination: scheduleEmailDestination,
                            active: true,
                            format: exportFormat
                          }
                        ]);
                        alert(`📅 Agendamento automatizado criado!\nO SmartBroker SaaS enviará relatórios periódicos em formato [${exportFormat}] de forma [${reportSchedulerType.toUpperCase()}] para ${scheduleEmailDestination}.`);
                      }}
                      className="sm:col-span-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-[10px] uppercase rounded-lg text-center cursor-pointer"
                    >
                      Cadastrar Agendamento Automático
                    </button>
                  </fieldset>

                  {/* Active rule lists */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] text-slate-500 uppercase font-mono font-bold block">Regras de Disparo Ativas:</span>
                    
                    {activeSchedules.map(sc => (
                      <div key={sc.id} className="p-2.5 bg-slate-900/60 border border-slate-850 rounded flex justify-between items-center text-[10px] font-mono">
                        <div>
                          <p className="font-extrabold text-slate-250 uppercase">[Relatório {sc.type}] → {sc.destination}</p>
                          <p className="text-[9px] text-slate-500">Formato anexo: {sc.format} • Próximo envio: Automático via CRON</p>
                        </div>

                        <div className="flex gap-2 font-sans">
                          <button 
                            type="button"
                            onClick={() => {
                              setActiveSchedules(prev => prev.map(p => p.id === sc.id ? { ...p, active: !p.active } : p));
                            }}
                            className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold cursor-pointer ${sc.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-500 border border-slate-805'}`}
                          >
                            {sc.active ? 'ATIVO' : 'MUTADO'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setActiveSchedules(prev => prev.filter(p => p.id !== sc.id));
                            }}
                            className="text-rose-455 font-bold px-1.5 py-0.5 hover:bg-rose-500/10 rounded cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* Dynamic bottom system indicators */}
        <div className="border-t border-slate-850 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono gap-2">
          <p>SaaS CRM • {broker.companyId} • Conexão Encriptada TLS 1.3</p>
          <p className="flex items-center gap-2">
            Status: <span className="text-emerald-500 font-bold">✔ ONLINE</span> 
            • Permissão: <span className="text-amber-500 font-bold">{selectedRole}</span>
          </p>
        </div>

      </div>

      {/* ============================================================== */}
      {/* SECURE MASTER ADMIN AUTHENTICATION DIALOG (Módulo 25 / 26)     */}
      {/* ============================================================== */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div id="master_admin_login_card" className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
            
            {/* Reset/Close Modal */}
            <button 
              onClick={() => {
                setShowAdminLoginModal(false);
                setAdminLoginState("login");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Fechar Painel de Autenticação"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl mb-1">
                <Lock className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-black uppercase font-mono tracking-wider text-slate-100 flex items-center justify-center gap-1.5">
                🛡️ Autenticação Master Admin
              </h3>
              <p className="text-[11px] text-slate-400">
                Acesso comercial restrito. Forneça credenciais administrativas com proteção criptográfica MFA.
              </p>
            </div>

            {/* BRUTE-FORCE LOCKOUT WARNING ALERT */}
            {loginLockoutUntil && Date.now() < loginLockoutUntil ? (
              <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-2 animate-pulse">
                <AlertTriangle className="text-rose-500 h-8 w-8" />
                <div>
                  <p className="font-extrabold text-rose-450 uppercase text-[10px] tracking-wide">ACESSO BLOQUEADO TEMPORARIAMENTE</p>
                  <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed font-sans">
                    Múltiplas tentativas de login incorretas detectadas (Proteção de Força Bruta).
                  </p>
                  <p className="text-xs font-mono font-black text-amber-500 mt-2">
                    Aguarde: {lockoutRemainingSeconds} segundos...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* DEMO SANDBOX CREDENTIALS QUICKFILL PANEL */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-1.5 text-left">
                  <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 animate-spin" /> Chaves de Acesso de Teste (Sandbox)
                  </p>
                  <div className="text-[10px] text-slate-400 leading-normal space-y-1">
                    <p className="font-sans text-[10px]">Para fins de avaliação dos módulos RBAC (Módulo 25) e auditoria técnica:</p>
                    <div className="bg-slate-905 border border-slate-800/80 p-2 rounded-lg space-y-0.5 font-mono text-[9px] text-slate-200">
                      <p>📧 Admin E-mail: <span className="text-amber-400 font-extrabold select-all">admin@smartbroker.com.br</span></p>
                      <p>🔑 Senha Master: <span className="text-amber-400 font-extrabold select-all">admin123</span></p>
                      <p>🔑 Código MFA (TOTP): <span className="text-emerald-400 font-extrabold">123456</span></p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminEmailInput("admin@smartbroker.com.br");
                        setAdminPasswordInput("admin123");
                        alert("💡 Credenciais preenchidas automaticamente!");
                      }}
                      className="w-full mt-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-[9px] text-slate-300 font-bold uppercase transition cursor-pointer"
                    >
                      Preencher Credenciais Automaticamente 🪄
                    </button>
                  </div>
                </div>

                {/* PHASE 1: EMAIL & PASSWORD LOGIN */}
                {adminLoginState === "login" && (
                  <form onSubmit={handleAdminLoginSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-black block">E-mail Administrativo:</label>
                      <div className="relative">
                        <input 
                          type="email"
                          required
                          value={adminEmailInput}
                          onChange={(e) => setAdminEmailInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-slate-200 rounded-xl outline-none focus:border-amber-500 font-medium pl-8"
                          placeholder="Ex: admin@smartbroker.com.br"
                        />
                        <Mail className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-500" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-black block">Senha / Chave de API:</label>
                      <div className="relative">
                        <input 
                          type="password"
                          required
                          value={adminPasswordInput}
                          onChange={(e) => setAdminPasswordInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-slate-200 rounded-xl outline-none focus:border-amber-500 font-mono pl-8"
                          placeholder="Sua senha secreta de admin"
                        />
                        <Lock className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-500" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-amber-550 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      Validar Credenciais <CheckCircle className="h-4 w-4" />
                    </button>
                  </form>
                )}

                {/* PHASE 2: MFA DYNAMIC TOKEN INPUT */}
                {adminLoginState === "mfa" && (
                  <form onSubmit={handleAdminMfaSubmit} className="space-y-3 animate-fade-in">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/80 flex items-center gap-3">
                      <Smartphone className="text-emerald-500 h-6 w-6 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-200 text-[10px] uppercase font-mono text-emerald-400">Google Authenticator Sincronizado</p>
                        <p className="text-[9px] text-slate-400 leading-tight font-sans">Abra o app ou utilize o token rotativo da simulação.</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-center">
                      <label className="text-[9px] text-slate-400 uppercase font-black block">Código de Autenticação MFA (6 dígitos):</label>
                      <input 
                        type="text"
                        maxLength={6}
                        required
                        value={adminMfaInput}
                        onChange={(e) => setAdminMfaInput(e.target.value.replace(/\D/g, ""))}
                        className="w-40 text-center bg-slate-950 border border-slate-850 p-2 text-lg font-mono font-black text-amber-500 rounded-xl outline-none focus:border-amber-500 mx-auto tracking-widest block"
                        placeholder="000000"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAdminLoginState("login")}
                        className="w-1/3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-bold text-[10px] uppercase rounded-xl transition cursor-pointer font-sans"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 py-2 bg-gradient-to-r from-emerald-550 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer text-center font-sans"
                      >
                        Confirmar Token (2FA) →
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            <div className="text-center font-mono text-[8px] text-slate-600 border-t border-slate-850 pt-2.5">
              Segurança Ativa • Token JWT Exp: 15m • SSL Encriptado TLS
            </div>

          </div>
        </div>
      )}

    </div>
  </div>
  );
}
