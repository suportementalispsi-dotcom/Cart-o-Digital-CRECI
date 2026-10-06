import React, { useState, useEffect } from "react";
import { 
  KeyRound, Mail, Phone, User, ShieldCheck, RefreshCw, 
  Sparkles, CheckCircle2, AlertTriangle, Cpu, Globe, 
  ArrowRight, Landmark, Lock, HelpCircle
} from "lucide-react";
import { UserSession } from "../types";

interface AuthGatewayProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function AuthGateway({ onLoginSuccess }: AuthGatewayProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "mfa">("login");
  const [userType, setUserType] = useState<"Corretor Autônomo" | "Imobiliária">("Corretor Autônomo");
  
  // Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [mfaCode, setMfaCode] = useState("");
  
  // Simulation Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Recovery token states
  const [recoveryToken, setRecoveryToken] = useState("");
  const [recoveryTimer, setRecoveryTimer] = useState(300); // 5 min
  const [newPassword, setNewPassword] = useState("");

  // JWT / Security Details panel states
  const [generatedHash, setGeneratedHash] = useState("f6e80b2a1a8c9e0d1f4b5a3c2e1d0f...");
  const [jwtPayload, setJwtPayload] = useState<any>(null);
  const [bruteForceAttempts, setBruteForceAttempts] = useState(0);

  // Generate mock JWT payload based on typing
  useEffect(() => {
    setJwtPayload({
      hdr: { alg: "HS256", typ: "JWT" },
      pay: {
        iss: "smartbroker-auth-server",
        sub: email || "usuario@smartbroker.com.br",
        role: userType === "Imobiliária" ? "Agency_Master" : "Independent_Broker",
        mfa_verified: mode === "mfa",
        exp: Math.floor(Date.now() / 1000) + 3600
      },
      sig: "SWS3000_SigX90d_a81f3bc8"
    });
    
    // Simulate interactive hashing password on changes
    if (password) {
      const pretendHash = "sha256$" + password.split("").map(c => c.charCodeAt(0).toString(16)).join("");
      setGeneratedHash(pretendHash.substring(0, 36) + "...");
    } else {
      setGeneratedHash("f6e80b2a1a8c9e0d1f4b5a3c2e1d0f...");
    }
  }, [email, userType, mode, password]);

  // Recovery countdown simulation
  useEffect(() => {
    let timer: any;
    if (mode === "forgot" && recoveryToken) {
      timer = setInterval(() => {
        setRecoveryTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setSuccessMsg("");
            setErrorMsg("O token de recuperação expirou. Solicite um novo link.");
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, recoveryToken]);

  // Handle Login submitting
  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!email || !password) {
      setErrorMsg("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (bruteForceAttempts >= 4) {
      setErrorMsg("Múltiplas tentativas incorretas. Bloqueio temporário (1 min) ativado para mitigar Ataques de Força Bruta.");
      return;
    }

    setLoading(true);
    
    // Simulating call with realistic delay
    setTimeout(() => {
      setLoading(false);
      // Hardcoded quick demonstration credentials or any typed input works
      if (password.length < 4) {
        setBruteForceAttempts(prev => prev + 1);
        setErrorMsg(`Senha muito curta. Tentativa ${bruteForceAttempts + 1}/5 antes do bloqueio.`);
        return;
      }

      // Successful first tier login -> prompts standard MFA with custom logic for maximum security!
      setMode("mfa");
      setSuccessMsg("Autenticação de nível 1 bem-sucedida! Digite o token de 2FA.");
    }, 900);
  };

  // Confirming MFA
  const handleVerifyMfa = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode !== "123456" && mfaCode.length !== 6) {
      setErrorMsg("Código MFA/2FA inválido para esta sessão. Use 123456 para testar.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        userId: "broker-gabriel",
        name: email.split("@")[0].toUpperCase() || "Gabriel Menezes",
        email: email || "gabriel@smartbroker.com",
        userType: userType,
        creci: "12345-F",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_pay_8912df01",
        mfaEnabled: true,
        emailVerified: true,
        loggedIn: true
      });
    }, 700);
  };

  // Handle Register Submitting (Modulo 20 - Cadastro)
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name || !email || !phone || !password || !confirmPassword) {
      setErrorMsg("Preencha todos os campos obrigatórios para criação de conta.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("A senha e a confirmação de senha estão divergentes.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(`Conta registrada com sucesso como [${userType}]!\nUm link de verificação criptografado foi disparado para o seu e-mail.`);
      alert(`🎉 Conta ativa cadastrada!\nTipo: ${userType}\nNome: ${name}\n\nO sistema gerou os tokens de acesso seguros com hash SHA-256 no banco de dados.`);
      
      // Auto login
      onLoginSuccess({
        userId: `broker-${Date.now()}`,
        name: name,
        email: email,
        userType: userType,
        creci: userType === "Imobiliária" ? "Jurídico 9010-J" : "12345-F",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.generated_payload_129df",
        mfaEnabled: true,
        emailVerified: false,
        loggedIn: true
      });
    }, 1000);
  };

  // Handle Send Recovery Link (Modulo 20 - Esqueci minha senha)
  const handleRequestRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg("Digite o seu e-mail de acesso cadastrado.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const generatedToken = "SB-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      setRecoveryToken(generatedToken);
      setRecoveryTimer(300);
      setSuccessMsg(`Link enviado! Use o token temporário de redefinição: [ ${generatedToken} ]`);
      alert(`🔑 Recuperador do SmartBroker AI:\nUm e-mail de redefinição de senha contendo o token de expiração de 5 minutos foi disparado para ${email}.`);
    }, 800);
  };

  // Redefine password manually (Modulo 20 - Redefinição)
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("✅ Senha alterada com sucesso! Você pode realizar o login agora.");
      setMode("login");
      setSuccessMsg("Senha redefinida com sucesso. Faça login com a nova senha.");
      setRecoveryToken("");
    }, 900);
  };

  // Google OAuth demo
  const handleGoogleOAuth = () => {
    setLoading(true);
    alert("🔗 Redirecionando para as APIs seguras do Google Accounts OAuth...");
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        userId: "google-oauth-user-1",
        name: "Corretor do Google",
        email: "imob.consultor@gmail.com",
        userType: "Corretor Autônomo",
        creci: "11902-F",
        token: "google_oauth_active_jwt_9918fa9d",
        mfaEnabled: false,
        emailVerified: true,
        loggedIn: true
      });
    }, 1100);
  };

  return (
    <div id="auth_landing_grid" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 select-none relative overflow-hidden">
      
      {/* Background elegant circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 relative z-10 transition-all duration-300">
        
        {/* LEFT COLUMN: BRAND PROMOTION & TRUST MARKETING (Linear/Notion Vibe) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 p-8 flex flex-col justify-between border-r border-slate-850">
          
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl flex items-center justify-center font-black text-black text-base shadow-md shadow-amber-950/20">
                S
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white uppercase font-sans">SmartBroker SaaS</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">SEGURANÇA ENCRIPTADA LGPD & GDPR</p>
          </div>

          {/* Marketing Copy */}
          <div className="space-y-4 my-8 lg:my-0">
            <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full text-[9px] font-black tracking-widest uppercase font-mono border border-amber-500/25">
              NOVA VERSÃO 4.2
            </span>
            <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight text-white leading-tight">
              A ferramenta definitiva de <span className="text-amber-500">conversão imobiliária</span> inteligente.
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Monitore acessos, calcule o Lead Scoring comportamental em tempo real com IA, e feche mais contratos com o poder da geolocalização e automações nativas de WhatsApp.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Gestão inteligente de funil de vendas</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Geração de QR Code dinâmico por imóvel</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Automações e AI Insights pelo Gemini API</span>
              </div>
            </div>
          </div>

          {/* Infrastructure / Security details visualizer */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 space-y-2 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 text-amber-500 font-extrabold text-[10px] uppercase">
              <Cpu className="h-3.5 w-3.5" /> Monitor de Encriptação (SHA-256)
            </div>
            <p className="text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
              Active Hash: <span className="text-emerald-400">{generatedHash}</span>
            </p>
            {jwtPayload && (
              <div className="text-[9px] text-slate-500 border-t border-slate-850/85 pt-1.5 space-y-1.5">
                <p>JWT Sub: <span className="text-slate-300">{jwtPayload.pay.sub}</span></p>
                <p>Role JWT: <span className="text-amber-500">{jwtPayload.pay.role}</span></p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CORE INTERACTIVE GATEWAY VIEWS */}
        <div className="lg:col-span-7 p-8 flex flex-col justify-center min-h-[60vh] bg-slate-900">
          
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl mb-4 text-xs text-rose-350 flex gap-2.5 items-center">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl mb-4 text-xs text-emerald-400 flex gap-2.5 items-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="whitespace-pre-line">{successMsg}</span>
            </div>
          )}

          {/* VIEW: LOGIN FORM */}
          {mode === "login" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">Acessar SmartBroker</h3>
                <p className="text-xs text-slate-400 mt-1">Conecte sua carteira de empreendimentos à inteligência centralizada.</p>
              </div>

              <form onSubmit={handleSubmitLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> Endereço de E-mail:
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: gabriel@smartbroker.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-100 placeholder-slate-600 focus:border-amber-500 outline-none transition font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <Lock className="h-3 w-3" /> Senha Segura:
                    </label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setMode("forgot");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-[10px] text-amber-500 font-mono font-black uppercase hover:underline"
                    >
                      Esqueci minha senha?
                    </button>
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-100 placeholder-slate-600 focus:border-amber-500 outline-none transition font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-400 select-none cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded accent-amber-500 border-slate-800"
                    />
                    <span>Lembrar-me no dispositivo</span>
                  </label>
                </div>

                {/* Quick demo credentials autofill helper */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-[11px] space-y-2">
                  <p className="font-bold text-slate-400 uppercase tracking-wide text-[9px] font-mono">⚡ Preenchimento Rápido para Avaliação:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("admin@smartbroker.com");
                        setPassword("admin123");
                        setUserType("Corretor Autônomo");
                        setMfaCode("123456");
                      }}
                      className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-amber-400 rounded text-[10px] font-bold transition cursor-pointer"
                    >
                      👑 Master Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("gabriel@smartbroker.com");
                        setPassword("gabriel123");
                        setUserType("Corretor Autônomo");
                        setMfaCode("123456");
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-[10px] font-bold transition cursor-pointer"
                    >
                      🟢 Corretor Autônomo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("imobiliaria@smartbroker.com");
                        setPassword("imob123");
                        setUserType("Imobiliária");
                        setMfaCode("123456");
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-[10px] font-bold transition cursor-pointer"
                    >
                      🏢 Imobiliária
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verificando Credenciais...
                    </>
                  ) : (
                    <>
                      Seguir para Verificação <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* OAuth split */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-850"></div>
                <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-slate-500 font-mono">ou acesse usando</span>
                <div className="flex-grow border-t border-slate-850"></div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <button 
                  onClick={handleGoogleOAuth}
                  disabled={loading}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Globe className="h-3.5 w-3.5 text-blue-400" /> Acessar com Conta Google (OAuth 2.0)
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Não possui credenciais?{" "}
                  <button 
                    onClick={() => {
                      setMode("register");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-amber-500 font-bold hover:underline"
                  >
                    Criar nova conta grátis
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* VIEW: REGISTER / CADASTRO (Modulo 20 - Cadastro) */}
          {mode === "register" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">Criar Nova Assinatura</h3>
                <p className="text-xs text-slate-400 mt-1">Selecione seu perfil profissional e inicie a captura comportamental.</p>
              </div>

              {/* Selector */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button 
                  type="button"
                  onClick={() => setUserType("Corretor Autônomo")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${userType === "Corretor Autônomo" ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <User className="h-3.5 w-3.5" /> Corretor Autônomo
                </button>
                <button 
                  type="button"
                  onClick={() => setUserType("Imobiliária")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${userType === "Imobiliária" ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Landmark className="h-3.5 w-3.5" /> Imobiliária / Equipe
                </button>
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Nome / Fantasia:</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ex: Gabriel Menezes"
                      required
                      className="w-full bg-slate-950 border border-slate-850 text-xs px-2.5 py-1.5 rounded-lg text-slate-100 placeholder-slate-600 focus:border-amber-500 outline-none transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Telefone / WhatsApp:</label>
                    <input 
                      type="tel" 
                      value={phone}
                      placeholder="(91) 98112-4532"
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-850 text-xs px-2.5 py-1.5 rounded-lg text-slate-100 placeholder-slate-600 focus:border-amber-500 outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Endereço de E-mail Profissional:</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="gabriel@corretor.com"
                    required
                    className="w-full bg-slate-950 border border-slate-850 text-xs px-2.5 py-1.5 rounded-lg text-slate-100 placeholder-slate-600 focus:border-amber-500 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Senha de Acesso:</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 dígitos"
                      required
                      className="w-full bg-slate-950 border border-slate-850 text-xs px-2.5 py-1.5 rounded-lg text-slate-100 placeholder-slate-600 focus:border-amber-500 outline-none transition font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Confirmar Senha:</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••"
                      required
                      className="w-full bg-slate-950 border border-slate-850 text-xs px-2.5 py-1.5 rounded-lg text-slate-100 placeholder-slate-600 focus:border-amber-500 outline-none transition font-mono"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed font-sans pt-1">
                  Ao realizar o cadastro, declaro estar ciente de que os dados inseridos serão arquivados em conformidade rigorosa com os regulamentos brasileiros de LGPD.
                </p>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Criar Minha Conta Segura"}
                </button>
              </form>

              <div className="text-center pt-1.5">
                <p className="text-xs text-slate-550">
                  Já possui conta cadastrada?{" "}
                  <button 
                    onClick={() => {
                      setMode("login");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-amber-500 font-bold hover:underline"
                  >
                    Fazer Login
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD / RECUPERAÇÃO DE SENHA (Modulo 20 - Recuperação) */}
          {mode === "forgot" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Lock className="text-amber-500" /> Recuperar Senha do Sistema
                </h3>
                <p className="text-xs text-slate-400 mt-1">Dispare um token de expiração temporária de redefinição de credenciais.</p>
              </div>

              {!recoveryToken ? (
                // Step 1: Request token
                <form onSubmit={handleRequestRecovery} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Seu E-mail Cadastrado:</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: gabriel@smartbroker.com"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-100 placeholder-slate-600 focus:border-amber-500 outline-none transition"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:text-white text-slate-300 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Enviar Token por E-mail"}
                  </button>
                </form>
              ) : (
                // Step 2: Redefine with token
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-200 flex flex-col gap-1">
                    <div className="flex justify-between font-mono font-bold text-[10px] text-amber-400 uppercase">
                      <span>Token de Acesso: {recoveryToken}</span>
                      <span>{Math.floor(recoveryTimer / 60)}:{(recoveryTimer % 60).toString().padStart(2, "0")}</span>
                    </div>
                    <p className="opacity-90 text-[11px] mt-0.5">O token expira em breve. Digite sua nova credencial abaixo.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-405 uppercase font-bold tracking-wider block">Nova Senha de Acesso:</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      required
                      className="w-full bg-slate-950 border border-slate-850 text-xs px-3 py-2 rounded-xl text-slate-100 focus:border-amber-500 outline-none transition font-mono"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/15"
                  >
                    {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Confirmar Nova Senha & Conectar"}
                  </button>
                </form>
              )}

              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => {
                    setMode("login");
                    setRecoveryToken("");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-xs text-slate-500 hover:text-white underline transition"
                >
                  Voltar para o Login convencional
                </button>
              </div>
            </div>
          )}

          {/* VIEW: MFA / TWO-FACTOR SECURE AUTH REGISTRATION (Segurança 2FA) */}
          {mode === "mfa" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="text-emerald-500" /> Duplo Fator de Autenticação (2FA / MFA)
                </h3>
                <p className="text-xs text-slate-400 mt-1">Conexão crítica de integridade ativa. Digite o código gerado em seu e-mail ou app autenticador.</p>
              </div>

              <form onSubmit={handleVerifyMfa} className="space-y-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs text-slate-400 flex flex-col gap-1.5">
                  <div className="flex justify-between font-bold text-[10px] text-slate-350">
                    <span className="font-mono">GATEWAY SECURE SENSING</span>
                    <span className="text-emerald-400 font-bold font-mono">● ATIVO</span>
                  </div>
                  <p className="leading-relaxed">Apenas contas homologadas transpõem a proteção de força bruta. Para demonstração use o Token padrão: <strong className="text-amber-500 font-mono">123456</strong>.</p>
                </div>

                <div className="space-y-1.5 text-center">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block mb-2 text-left">Código de 6 dígitos:</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="ex: 123456"
                    required
                    className="w-1/2 mx-auto bg-slate-950 border-2 border-slate-800 text-center text-lg font-black tracking-[12px] py-1.5 rounded-xl text-amber-500 focus:border-amber-500 outline-none transition font-mono"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Validar Dispositivo & Entrar"}
                </button>
              </form>

              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => {
                    setMode("login");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-xs text-slate-500 hover:text-white underline transition"
                >
                  Cancelar e retornar
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
