import React, { useState } from "react";
import { 
  Phone, Mail, Globe, Instagram, Linkedin, Facebook, Youtube, 
  UserCheck, Share2, Calendar, MapPin, Building2, Check, Sparkles, 
  X, Heart, ArrowRight, Smartphone, Eye, Award
} from "lucide-react";
import { Property, BrokerProfile } from "../types";

interface DigitalCardProps {
  broker: BrokerProfile;
  properties: Property[];
  onTrackAction: (actionType: string, propertyId?: string, propertyName?: string, details?: string) => void;
  visitorEmail: string;
  setVisitorEmail: (email: string) => void;
  visitorName: string;
  setVisitorName: (name: string) => void;
  visitorPhone: string;
  setVisitorPhone: (phone: string) => void;
}

export default function DigitalCard({
  broker,
  properties,
  onTrackAction,
  visitorEmail,
  setVisitorEmail,
  visitorName,
  setVisitorName,
  visitorPhone,
  setVisitorPhone
}: DigitalCardProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({ date: "2026-06-15", time: "14:00", notes: "" });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showVcfSuccess, setShowVcfSuccess] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterNeighborhood, setFilterNeighborhood] = useState<string>("all");

  const handleAction = (type: any, propId?: string, propName?: string, customDetails?: string) => {
    onTrackAction(type, propId, propName, customDetails);
  };

  const toggleFavorite = (prop: Property) => {
    const isFav = favorites.includes(prop.id);
    if (isFav) {
      setFavorites(favorites.filter(id => id !== prop.id));
    } else {
      setFavorites([...favorites, prop.id]);
      handleAction("property_favorite", prop.id, prop.title, `Favoritou o imóvel: ${prop.title}`);
    }
  };

  const handleSaveContact = () => {
    setShowVcfSuccess(true);
    handleAction("save_contact", undefined, undefined, "Salvou o contato (VCF) do corretor no smartphone");
    setTimeout(() => {
      setShowVcfSuccess(false);
      // Simulate VCF Download
      const vcfData = `BEGIN:VCARD\nVERSION:3.0\nN:${broker.name}\nFN:${broker.name}\nTEL;TYPE=CELL:${broker.whatsapp}\nEMAIL:${broker.email}\nURL:${broker.site}\nEND:VCARD`;
      const blob = new Blob([vcfData], { type: "text/vcard" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${broker.name.replace(/\s+/g, "_")}.vcf`;
      a.click();
    }, 2000);
  };

  const handleShare = () => {
    setShowShareSuccess(true);
    handleAction("share", undefined, undefined, `Compartilhou o perfil do corretor ${broker.name}`);
    setTimeout(() => setShowShareSuccess(false), 2000);
    // Copy fake URL to clipboard
    navigator.clipboard.writeText(`${window.location.origin}/card/${broker.id}`);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAction(
      "schedule_visit", 
      selectedProperty?.id, 
      selectedProperty?.title, 
      `Agendou visita para ${selectedProperty?.title || 'Imóvel Geral'} em ${scheduleData.date} às ${scheduleData.time}. Notas: ${scheduleData.notes}`
    );
    setScheduleModalOpen(false);
    alert(`📅 Visita solicitada com sucesso para ${selectedProperty?.title || "Imóvel Geral"} em ${scheduleData.date} às ${scheduleData.time}! O corretor foi notificado.`);
  };

  // Filter properties
  const filteredProperties = properties.filter(prop => {
    const matchesType = filterType === "all" || prop.title.toLowerCase().includes(filterType.toLowerCase());
    const matchesNeighborhood = filterNeighborhood === "all" || prop.neighborhood === filterNeighborhood;
    return matchesType && matchesNeighborhood;
  });

  const uniqueNeighborhoods = Array.from(new Set(properties.map(p => p.neighborhood)));

  return (
    <div id="digital_visitor_view" className="w-full bg-slate-950 text-white min-h-screen font-sans border-x border-slate-850 shadow-2xl relative">
      
      {/* Simulation Identity header */}
      <div className="bg-slate-900 border-b border-amber-500/20 px-4 py-3 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
          <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold font-mono">Modo Simulador de Visitante (B2C)</p>
        </div>
        
        <p className="text-xs text-slate-400 mb-2">
          Insira dados fictícios abaixo para simular como um cliente real e veja as interações retroalimentando o CRM instantaneamente!
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-slate-400 block uppercase">E-mail para Rastrear</label>
            <input 
              type="email" 
              value={visitorEmail} 
              onChange={(e) => setVisitorEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-amber-200 focus:outline-none focus:border-amber-550"
              placeholder="seu-email@teste.com"
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-400 block uppercase">Nome para Exibir</label>
            <input 
              type="text" 
              value={visitorName} 
              onChange={(e) => setVisitorName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-amber-550"
              placeholder="Lucas Silva"
            />
          </div>
        </div>
      </div>

      {/* Hero / Cover */}
      <div className="h-32 bg-gradient-to-r from-amber-950/20 via-slate-900 to-amber-900/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,26,0.15),transparent)]"></div>
        <div className="absolute bottom-2 right-4 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-full px-2 py-0.5 text-[10px] text-amber-400 font-mono">
          {broker.creci}
        </div>
      </div>

      {/* Profile Info - Glassmorphism Card */}
      <div className="px-4 -mt-12 relative pb-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <img 
              src={broker.photo} 
              alt={broker.name} 
              className="w-20 h-20 rounded-full border-2 border-amber-500/50 object-cover shadow-lg"
            />
            <div className="flex-1 min-w-0">
              <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-500/20">
                Corretor Credenciado
              </span>
              <h2 className="text-xl font-bold mt-2 text-slate-100 flex items-center justify-center sm:justify-start gap-1">
                {broker.name} 
                <Award className="h-4 w-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1 mt-1 font-mono">
                <MapPin className="h-3 w-3 text-amber-500" /> {broker.city}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mt-4 border-t border-white/5 pt-3 text-justify">
            {broker.bio}
          </p>

          {/* Social Icons Stack */}
          <div className="flex justify-center gap-3 mt-4 border-t border-white/5 pt-3">
            <a 
              href={`https://instagram.com`} 
              target="_blank" 
              onClick={() => handleAction("share", undefined, undefined, "Acessou Instagram do corretor")}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-750 transition border border-white/5 text-amber-400"
              title="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a 
              href={`https://linkedin.com`} 
              target="_blank" 
              onClick={() => handleAction("share", undefined, undefined, "Acessou LinkedIn do corretor")}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-750 transition border border-white/5 text-amber-400"
              title="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a 
              href={`https://facebook.com`} 
              target="_blank" 
              onClick={() => handleAction("share", undefined, undefined, "Acessou Facebook do corretor")}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-750 transition border border-white/5 text-slate-300"
              title="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a 
              href={`https://youtube.com`} 
              target="_blank" 
              onClick={() => handleAction("share", undefined, undefined, "Acessou Canal do YouTube")}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-750 transition border border-white/5 text-rose-500"
              title="YouTube"
            >
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Primary Interaction Buttons */}
      <div className="px-4 grid grid-cols-2 gap-2 mb-6">
        <button 
          onClick={() => {
            handleAction("whatsapp", undefined, undefined, "Clicou no botão WhatsApp primordial no cartão digital");
            window.open(`https://wa.me/${broker.whatsapp.replace(/\+/g, '')}?text=Olá! Estive no seu Cartão Digital e gostaria de falar sobre as oportunidades imobiliárias de Belém.`, "_blank");
          }}
          className="col-span-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-550 hover:to-teal-650 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer text-white"
        >
          <Phone className="h-4 w-4" /> Falar no WhatsApp
        </button>

        <button 
          onClick={handleSaveContact}
          className="py-3 bg-slate-900 hover:bg-slate-850 rounded-xl font-semibold text-xs border border-white/5 flex items-center justify-center gap-2 transition active:scale-95 relative cursor-pointer"
        >
          {showVcfSuccess ? (
            <>
              <Check className="h-4 w-4 text-emerald-400 animate-bounce" />
              <span className="text-emerald-400">Contato Salvo!</span>
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 text-amber-500" /> Salvar Contato
            </>
          )}
        </button>

        <button 
          onClick={handleShare}
          className="py-3 bg-slate-900 hover:bg-slate-850 rounded-xl font-semibold text-xs border border-white/5 flex items-center justify-center gap-2 transition active:scale-95 relative cursor-pointer"
        >
          {showShareSuccess ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400">Link Copiado!</span>
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4 text-amber-400" /> Compartilhar
            </>
          )}
        </button>

        <button 
          onClick={() => {
            setSelectedProperty(null);
            setScheduleModalOpen(true);
          }}
          className="col-span-2 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-550 hover:to-amber-650 rounded-xl font-semibold text-xs shadow-md shadow-amber-950/30 flex items-center justify-center gap-2 transition cursor-pointer text-white"
        >
          <Calendar className="h-4 w-4" /> Solicitar Agendamento de Visita
        </button>
      </div>

      {/* Interactive Catalog Section */}
      <div className="px-4 pb-12">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
          <h3 className="font-bold text-sm uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Oportunidades em Destaque
          </h3>
          <span className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded font-mono">
            {filteredProperties.length} imóveis
          </span>
        </div>

        {/* Dynamic Catalog filters */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none"
            >
              <option value="all">Todos os Tipos</option>
              <option value="duplex">Coberturas</option>
              <option value="premium">Apartamentos</option>
              <option value="mansão">Mansões</option>
              <option value="studio">Studios</option>
            </select>
          </div>
          <div>
            <select 
              value={filterNeighborhood} 
              onChange={(e) => setFilterNeighborhood(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-300 focus:outline-none"
            >
              <option value="all">Todas localizações</option>
              {uniqueNeighborhoods.map(nb => (
                <option key={nb} value={nb}>{nb}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Properties Cards List */}
        <div className="space-y-4">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-8 bg-slate-900/40 rounded-xl border border-white/5">
              <p className="text-xs text-slate-400">Nenhum imóvel corresponde aos filtros selecionados.</p>
            </div>
          ) : (
            filteredProperties.map(prop => {
              const isFav = favorites.includes(prop.id);
              return (
                <div 
                  key={prop.id} 
                  id={`visitor_property_card_${prop.id}`}
                  className="bg-slate-900/80 rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/30 transition shadow-lg relative group"
                >
                  {/* Property Cover Image */}
                  <div className="h-44 overflow-hidden relative cursor-pointer" onClick={() => {
                    setSelectedProperty(prop);
                    handleAction("view_property", prop.id, prop.title, `Visualizou detalhes do imóvel: ${prop.title}`);
                  }}>
                    <img 
                      src={prop.imageUrl} 
                      alt={prop.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(prop);
                        }}
                        className="p-1.5 rounded-full bg-slate-950/80 backdrop-blur border border-white/10 text-white hover:text-rose-500 transition cursor-pointer"
                        title="Favoritar"
                      >
                        <Heart className={`h-4 w-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}`} />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-3">
                      <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                        {prop.neighborhood}
                      </span>
                    </div>
                  </div>

                  {/* Property Brief */}
                  <div className="p-4" onClick={() => {
                    setSelectedProperty(prop);
                    handleAction("view_property", prop.id, prop.title, `Visualizou detalhes do imóvel: ${prop.title}`);
                  }}>
                    <h4 className="font-bold text-sm text-slate-100 hover:text-amber-400 transition cursor-pointer">
                      {prop.title}
                    </h4>
                    <p className="text-xs font-semibold text-amber-400 mt-1 font-mono">
                      R$ {prop.price.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                      {prop.description}
                    </p>

                    {/* Stats Icons */}
                    <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 font-mono border-t border-white/5 pt-2">
                      <span>📐 {prop.area} m²</span>
                      <span>🛏️ {prop.bedrooms} Qrt</span>
                      <span>🚿 {prop.suites} Suítes</span>
                    </div>

                    {/* Interaction Trigger */}
                    <div className="flex items-center justify-between mt-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProperty(prop);
                          setScheduleModalOpen(true);
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white px-3 py-1.5 rounded-md border border-white/5 transition flex items-center gap-1 cursor-pointer"
                      >
                        📂 Agendar Visita
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedProperty(prop);
                          handleAction("view_property", prop.id, prop.title, `Visualizou detalhes do imóvel: ${prop.title}`);
                        }}
                        className="text-xs text-amber-450 hover:text-amber-400 font-bold flex items-center gap-1 transition pr-1"
                      >
                        Ver Detalhes <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="bg-slate-900 border-t border-slate-850 px-4 py-8 text-center text-xs text-slate-500">
        <p className="font-semibold text-amber-500/85">SmartBroker Digital Card Premium</p>
        <p className="text-[10px] mt-1 font-mono">Conectando inteligência à busca pelo lar ideal.</p>
        <p className="text-[9px] text-slate-600 mt-4">Termos de Uso • Protegido conforme a LGPD brasileira.</p>
      </div>

      {/* MODAL 1: PROPERTY DETAILS */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto border border-slate-800 text-white relative">
            <button 
              onClick={() => setSelectedProperty(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-slate-400 hover:text-white z-10 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="h-48 relative">
              <img src={selectedProperty.imageUrl} alt={selectedProperty.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
              <div className="absolute bottom-3 left-4">
                <span className="bg-amber-500 text-black text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                  {selectedProperty.neighborhood}
                </span>
                <h3 className="font-bold text-base text-slate-100 mt-1">{selectedProperty.title}</h3>
              </div>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg mb-4">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase">Preço Estimado</p>
                  <p className="text-sm font-bold text-amber-400 font-mono">R$ {selectedProperty.price.toLocaleString("pt-BR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 uppercase">Condomínio</p>
                  <p className="text-xs font-mono text-slate-300">R$ {selectedProperty.condoPrice}/mês</p>
                </div>
              </div>

              <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Descrição do Imóvel</h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4 text-justify">
                {selectedProperty.description}
              </p>

              <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">Comodidades & Características</h4>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {selectedProperty.features.map((ft, i) => (
                  <span key={i} className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-amber-300">
                    ✨ {ft}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-4">
                <button 
                  onClick={() => {
                    handleAction("whatsapp", selectedProperty.id, selectedProperty.title, `Iniciou contato via WhatsApp perguntando do imóvel: ${selectedProperty.title}`);
                    window.open(`https://wa.me/${broker.whatsapp.replace(/\+/g, '')}?text=Olá! Gostaria de consultar os detalhes de compra da cobertura/apartamento ${selectedProperty.title}.`, "_blank");
                  }}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Phone className="h-3.5 w-3.5" /> Chamar Whats
                </button>
                <button 
                  onClick={() => {
                    setScheduleModalOpen(true);
                  }}
                  className="py-2.5 bg-amber-600 hover:bg-amber-550 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5" /> Agendar Visita
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SCHEDULE VISIT FORM */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleScheduleSubmit}
            className="bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-800 text-white relative"
          >
            <button 
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-bold text-sm uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
              <Calendar className="h-4 w-4" /> Solicitar Visita Presencial
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Agende uma visita exclusiva em {selectedProperty ? selectedProperty.title : "Imóvel Selecionado"}. O corretor analisará sua agenda e retornará o convite oficial.
            </p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="text-slate-400 mb-1 block">Sua Identificação (Rastreável)</label>
                <input 
                  type="text" 
                  disabled
                  value={`${visitorName} (${visitorEmail})`}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 opacity-70"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 mb-1 block">Data Pretendida</label>
                  <input 
                    type="date" 
                    value={scheduleData.date}
                    onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">Horário Sugerido</label>
                  <input 
                    type="time" 
                    value={scheduleData.time}
                    onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Observações ou Preferências de Abordagem</label>
                <textarea 
                  rows={3}
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  placeholder="Ex: Tenho preferência por ligações após às 18h..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none placeholder-slate-650"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-550 rounded-xl font-bold text-xs tracking-wider uppercase transition cursor-pointer text-white"
            >
              Confirmar Solicitação de Visita
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
