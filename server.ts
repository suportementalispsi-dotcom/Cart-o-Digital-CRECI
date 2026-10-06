import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Database for SaaS demo
interface LeadAction {
  id: string;
  type: "access" | "whatsapp" | "email" | "share" | "save_contact" | "view_property" | "schedule_visit" | "qrcode_scan" | "property_favorite";
  propertyId?: string;
  propertyName?: string;
  timestamp: string;
  details?: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  origin: string; // "Cartão Digital", "QR Code", "Instagram", "Meta Ads"
  responsible: string; // "João Silva" (Admin), "Mariana Costa" (Corretora), "Carlos Lima" (Corretor)
  status: "new" | "contact_made" | "interested" | "visit_scheduled" | "proposal" | "negotiation" | "won" | "lost";
  score: number;
  tags: string[];
  interestProfile: {
    neighborhoods: string[];
    types: string[];
    priceRange: { min: number; max: number };
    bedrooms: number;
  };
  timeline: LeadAction[];
  notes?: string;
}

interface Property {
  id: string;
  title: string;
  price: number;
  neighborhood: string;
  city: string;
  bedrooms: number;
  suites: number;
  area: number;
  condoPrice: number;
  description: string;
  imageUrl: string;
  features: string[];
}

// Initial properties seed
let properties: Property[] = [
  {
    id: "prop-1",
    title: "Cobertura Duplex Duos Nazaré",
    price: 2400000,
    neighborhood: "Nazaré",
    city: "Belém",
    bedrooms: 4,
    suites: 4,
    area: 320,
    condoPrice: 1500,
    description: "Cobertura duplex de alto luxo com piscina privativa, terraço gourmet e vista panorâmica para a Baía do Guajará. Acabamento primoroso em mármore travertino.",
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    features: ["Piscina Privativa", "Churrasqueira", "4 Vagas", "DCE completa", "Automação"]
  },
  {
    id: "prop-2",
    title: "Apartamento Premium Batista Campos",
    price: 1250000,
    neighborhood: "Batista Campos",
    city: "Belém",
    bedrooms: 3,
    suites: 3,
    area: 142,
    condoPrice: 850,
    description: "Excelente apartamento em frente à Praça Batista Campos. Ampla sacada gourmet integrada à cozinha, andar alto e modulados de alta qualidade.",
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    features: ["Sacada Gourmet", "3 Vagas", "Frente Praça", "Gerador Total", "Nascente"]
  },
  {
    id: "prop-3",
    title: "Mansão Suspensa Umarizal Luxury",
    price: 3450000,
    neighborhood: "Umarizal",
    city: "Belém",
    bedrooms: 4,
    suites: 4,
    area: 410,
    condoPrice: 2200,
    description: "Um apartamento por andar, pé direito duplo na sala de estar, automação de iluminação e ar condicionado. Lazer tipo resort completo.",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    features: ["1 por Andar", "Pé Direito Duplo", "Elevador Privativo", "Wellness Spa", "Infinity Pool"]
  },
  {
    id: "prop-4",
    title: "Studio Design Reduto Smart",
    price: 480000,
    neighborhood: "Reduto",
    city: "Belém",
    bedrooms: 1,
    suites: 1,
    area: 48,
    condoPrice: 420,
    description: "Ideal para investidores ou jovens profissionais. Conceito aberto, fechadura digital biométrica, rooftop compartilhado com piscina de borda infinita e lavanderia OMO.",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    features: ["Fechadura Digital", "Rooftop Pool", "Coworking", "Mini Market In-house", "Lavanderia"]
  },
  {
    id: "prop-5",
    title: "Mansão Condomínio Água Cristal",
    price: 5200000,
    neighborhood: "Souza",
    city: "Belém",
    bedrooms: 5,
    suites: 5,
    area: 630,
    condoPrice: 1800,
    description: "Projeto arquitetônico contemporâneo exuberante. Área de lazer impecável com piscina integrada, sauna úmida, espaço gourmet climatizado com chopeira.",
    imageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
    features: ["Condomínio Fechado", "Sauna Privativa", "Lago Exclusivo", "Segurança Armada", "Espaço Zen"]
  }
];

// Initial mock leads seed
let leads: Lead[] = [
  {
    id: "lead-1",
    name: "Ana Beatriz Montenegro",
    phone: "(91) 98112-4532",
    email: "anabeatriz@gmail.com",
    city: "Belém",
    origin: "Cartão Digital",
    responsible: "Gabriel Menezes",
    status: "interested",
    score: 65,
    tags: ["Alto Padrão", "Nazaré", "Investidor"],
    interestProfile: {
      neighborhoods: ["Nazaré", "Batista Campos"],
      types: ["Cobertura", "Apartamento"],
      priceRange: { min: 1200000, max: 2800000 },
      bedrooms: 3
    },
    timeline: [
      { id: "act-1", type: "access", timestamp: "2026-06-11T09:00:00Z", details: "Acessou o Cartão Digital (/gabriel-menezes)" },
      { id: "act-2", type: "view_property", propertyId: "prop-1", propertyName: "Cobertura Duplex Duos Nazaré", timestamp: "2026-06-11T09:02:00Z", details: "Visualizou detalhes da Cobertura Duplex" },
      { id: "act-3", type: "property_favorite", propertyId: "prop-1", propertyName: "Cobertura Duplex Duos Nazaré", timestamp: "2026-06-11T09:04:00Z", details: "Favoritou a Cobertura Duplex" },
      { id: "act-4", type: "save_contact", timestamp: "2026-06-11T09:05:00Z", details: "Salvou o contato de Gabriel Menezes no celular" },
      { id: "act-5", type: "whatsapp", timestamp: "2026-06-11T09:08:00Z", details: "Iniciou contato via WhatsApp perguntando por visitas" }
    ],
    notes: "Demonstrou extremo interesse em morar próximo à Praça da República. Tem recurso próprio, sem necessidade de alienação bancária."
  },
  {
    id: "lead-2",
    name: "Roberto Fontes",
    phone: "(91) 99123-8877",
    email: "roberto@fontesadv.com",
    city: "Belém",
    origin: "QR Code Placa",
    responsible: "Mariana Costa",
    status: "new",
    score: 35,
    tags: ["Umarizal", "Morno"],
    interestProfile: {
      neighborhoods: ["Umarizal"],
      types: ["Apartamento"],
      priceRange: { min: 3000000, max: 5000000 },
      bedrooms: 4
    },
    timeline: [
      { id: "act-6", type: "qrcode_scan", timestamp: "2026-06-11T11:15:00Z", details: "Escaneou QR Code físico na placa do Umarizal Luxury" },
      { id: "act-7", type: "view_property", propertyId: "prop-3", propertyName: "Mansão Suspensa Umarizal Luxury", timestamp: "2026-06-11T11:16:00Z", details: "Visualizou detalhes do Umarizal Luxury" },
      { id: "act-8", type: "share", propertyId: "prop-3", propertyName: "Mansão Suspensa Umarizal Luxury", timestamp: "2026-06-11T11:18:00Z", details: "Compartilhou link do imóvel via e-mail ou redes" }
    ],
    notes: "Escaneou o QR code da placa do Umarizal. Advogado bem sucedido, busca apartamento grande."
  }
];

// Broker Profile settings
let brokerProfile = {
  id: "gabriel-menezes",
  name: "Gabriel Menezes",
  photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
  creci: "12345-F 15ª Região",
  bio: "Especialista em imóveis de alto luxo em Belém. Mais de 10 anos realizando sonhos, oferecendo atendimento exclusivo, ético e focado em alto desempenho financeiro e familiar.",
  city: "Belém, PA",
  whatsapp: "+5591981124532",
  email: "gabriel@smartbroker.com.br",
  site: "www.smartbroker.com.br",
  instagram: "@gabrielmenezes.corretor",
  linkedin: "linkedin.com/in/gabriel-menezes",
  facebook: "fb.com/gabrielmenezes.imob",
  youtube: "youtube.com/c/gabrielmenezesimoveis",
  companyId: "imobiliaria-premium-1",
  qrcodes: [
    { id: "qr-1", title: "Cartão Virtual Principal", scans: 147, lastScan: "2026-06-11" },
    { id: "qr-2", title: "Placa Cobertura Nazaré", scans: 64, lastScan: "2026-06-10" },
    { id: "qr-3", title: "Anúncio Revista Viver", scans: 23, lastScan: "2026-06-11" }
  ]
};

// Automations configurations
let automationsList = [
  { id: "auto-1", title: "Abordagem WhatsApp no Alto Padrão", trigger: "Imóvel visualizado 3+ vezes", action: "Notificar corretor via Telegram/Whats e disponibilizar botão de contato rápido", active: true },
  { id: "auto-2", title: "Reengajamento de Lead Frio", trigger: "Retorno após 30+ dias de inatividade", action: "Enviar sugestão de novos imóveis selecionados baseados no perfil", active: true },
  { id: "auto-3", title: "Score Elevado de Visita", trigger: "Solicitar agendamento de visita", action: "Mudar status para 'Visita Agendada', somar +50 pontos e enviar notificação Push", active: true },
  { id: "auto-4", title: "Novo Lead no QR Code", trigger: "Escaneamento por QR Code físico", action: "Atribuir tag da localização do QR e enviar mensagem de boas-vindas", active: false }
];

// Subscriptions & SaaS Config
let billingPlans = [
  { id: "plan-starter", name: "Starter", price: 97, leadsLimit: 100, features: ["1 corretor", "Até 100 leads", "QR Code estático", "Cartão digital premium", "Suporte e-mail"] },
  { id: "plan-pro", name: "Pro", price: 197, leadsLimit: 1000, features: ["Até 10 corretores", "Até 1.000 leads", "QR Code dinâmico/rastreável", "Lead Scoring básico", "Suporte WhatsApp"] },
  { id: "plan-premium", name: "Premium (Mais Popular)", price: 297, leadsLimit: 999999, features: ["Corretores ilimitados", "Leads ilimitados", "IA de recomendação e insights", "Automações ilimitadas", "Relatórios executivos completos"] },
  { id: "plan-imob", name: "Imobiliária", price: 597, leadsLimit: 9999999, features: ["Múltiplas equipes", "Divisão automática de leads", "Controle de permissões master", "API de integrações nativa", "Gerente de conta exclusivo"] }
];

// Simulated CRM statistics
function getStats() {
  const totalLeads = leads.length;
  const avgScore = leads.length ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) : 0;
  const pipelineStats = {
    new: leads.filter(l => l.status === 'new').length,
    contact_made: leads.filter(l => l.status === 'contact_made').length,
    interested: leads.filter(l => l.status === 'interested').length,
    visit_scheduled: leads.filter(l => l.status === 'visit_scheduled').length,
    proposal: leads.filter(l => l.status === 'proposal').length,
    negotiation: leads.filter(l => l.status === 'negotiation').length,
    won: leads.filter(l => l.status === 'won').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };
  
  // Property interest views summation
  const propertyInterests: { [key: string]: number } = {};
  leads.forEach(l => {
    l.timeline.forEach(a => {
      if (a.type === 'view_property' && a.propertyName) {
        propertyInterests[a.propertyName] = (propertyInterests[a.propertyName] || 0) + 1;
      }
    });
  });

  return {
    totalLeads,
    avgScore,
    pipeline: pipelineStats,
    propertyViews: propertyInterests,
    clicks: {
      whatsapp: 412,
      saved_contact: 184,
      visits_scheduled: 28,
      shares: 94
    },
    ctr: "18.5%",
    conversions: 14,
    vendasTotais: "R$ 8.900.000"
  };
}

// ----------------------------------------------------------------------------
// EXPRESS API ROUTING
// ----------------------------------------------------------------------------

// REST Api endpoints
app.get("/api/properties", (req, res) => {
  res.json(properties);
});

app.post("/api/properties", (req, res) => {
  const newProperty: Property = {
    id: `prop-${Date.now()}`,
    ...req.body
  };
  properties.push(newProperty);
  res.status(201).json(newProperty);
});

app.get("/api/leads", (req, res) => {
  res.json(leads);
});

// Create or update visitor tracking action (simulating Visitor B interacting)
app.post("/api/leads/track", (req, res) => {
  const { leadEmail, leadName, leadPhone, actionType, propertyId, propertyName, details } = req.body;
  
  if (!leadEmail) {
    return res.status(400).json({ error: "E-mail do lead é obrigatório para rastreamento" });
  }

  let lead = leads.find(l => l.email === leadEmail);
  const actionScoreDelta: { [key: string]: number } = {
    access: 5,
    view_property: 10,
    property_favorite: 10,
    share: 15,
    save_contact: 25,
    whatsapp: 30,
    email: 15,
    schedule_visit: 50,
    qrcode_scan: 10
  };

  const delta = actionScoreDelta[actionType] || 5;

  const currentTimestamp = new Date().toISOString();
  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const newAction: LeadAction = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    type: actionType,
    propertyId,
    propertyName,
    timestamp: currentTimestamp,
    details: details || `${actionType.toUpperCase()} - Interação registrada`
  };

  if (!lead) {
    // Generate new Lead automatically if it does not exist
    lead = {
      id: `lead-${Date.now()}`,
      name: leadName || leadEmail.split('@')[0],
      phone: leadPhone || "(91) 99999-0000",
      email: leadEmail,
      city: "Belém",
      origin: actionType === "qrcode_scan" ? "QR Code Placa" : "Cartão Digital",
      responsible: "Gabriel Menezes",
      status: "new",
      score: delta,
      tags: ["Rastreado"],
      interestProfile: {
        neighborhoods: propertyId ? [properties.find(p => p.id === propertyId)?.neighborhood || "Nazaré"] : ["Nazaré"],
        types: ["Apartamento"],
        priceRange: { min: 450000, max: 2000000 },
        bedrooms: 3
      },
      timeline: [newAction],
      notes: "Lead capturado automaticamente e monitorado através de cartão digital inteligente."
    };
    leads.push(lead);
  } else {
    // Lead exists, append action and update score & dynamic interest profile
    lead.timeline.unshift(newAction); // Newer actions first
    lead.score = Math.min(lead.score + delta, 100);
    
    // Update interests based on property viewed
    if (propertyId) {
      const prop = properties.find(p => p.id === propertyId);
      if (prop) {
        if (!lead.interestProfile.neighborhoods.includes(prop.neighborhood)) {
          lead.interestProfile.neighborhoods.push(prop.neighborhood);
        }
        lead.interestProfile.priceRange.max = Math.max(lead.interestProfile.priceRange.max, prop.price);
        lead.interestProfile.priceRange.min = Math.min(lead.interestProfile.priceRange.min, prop.price);
      }
    }
    
    // Dynamic status upgrade based on score / key actions
    if (actionType === "schedule_visit") {
      lead.status = "visit_scheduled";
    } else if (actionType === "whatsapp" && lead.status === "new") {
      lead.status = "contact_made";
    }
  }

  res.status(200).json({ success: true, lead, addedAction: newAction, currentScore: lead.score });
});

// Update lead details in CRM
app.patch("/api/leads/:id", (req, res) => {
  const leadId = req.params.id;
  const index = leads.findIndex(l => l.id === leadId);
  if (index === -1) {
    return res.status(404).json({ error: "Lead não encontrado" });
  }

  leads[index] = { ...leads[index], ...req.body };
  res.json(leads[index]);
});

// Delete lead
app.delete("/api/leads/:id", (req, res) => {
  leads = leads.filter(l => l.id !== req.params.id);
  res.json({ success: true });
});

// Reset database to initial state (handy for testing)
app.post("/api/reset", (req, res) => {
  // Re-seed
  leads = [
    {
      id: "lead-1",
      name: "Ana Beatriz Montenegro",
      phone: "(91) 98112-4532",
      email: "anabeatriz@gmail.com",
      city: "Belém",
      origin: "Cartão Digital",
      responsible: "Gabriel Menezes",
      status: "interested",
      score: 65,
      tags: ["Alto Padrão", "Nazaré", "Investidor"],
      interestProfile: {
        neighborhoods: ["Nazaré", "Batista Campos"],
        types: ["Cobertura", "Apartamento"],
        priceRange: { min: 1200000, max: 2800000 },
        bedrooms: 3
      },
      timeline: [
        { id: "act-1", type: "access", timestamp: "2026-06-11T09:00:00Z", details: "Acessou o Cartão Digital (/gabriel-menezes)" },
        { id: "act-2", type: "view_property", propertyId: "prop-1", propertyName: "Cobertura Duplex Duos Nazaré", timestamp: "2026-06-11T09:02:00Z", details: "Visualizou detalhes da Cobertura Duplex" },
        { id: "act-3", type: "property_favorite", propertyId: "prop-1", propertyName: "Cobertura Duplex Duos Nazaré", timestamp: "2026-06-11T09:04:00Z", details: "Favoritou a Cobertura Duplex" },
        { id: "act-4", type: "save_contact", timestamp: "2026-06-11T09:05:00Z", details: "Salvou o contato de Gabriel Menezes no celular" },
        { id: "act-5", type: "whatsapp", timestamp: "2026-06-11T09:08:00Z", details: "Iniciou contato via WhatsApp perguntando por visitas" }
      ],
      notes: "Demonstrou extremo interesse em morar próximo à Praça da República. Tem recurso próprio, sem necessidade de alienação bancária."
    },
    {
      id: "lead-2",
      name: "Roberto Fontes",
      phone: "(91) 99123-8877",
      email: "roberto@fontesadv.com",
      city: "Belém",
      origin: "QR Code Placa",
      responsible: "Mariana Costa",
      status: "new",
      score: 35,
      tags: ["Umarizal", "Morno"],
      interestProfile: {
        neighborhoods: ["Umarizal"],
        types: ["Apartamento"],
        priceRange: { min: 3000000, max: 5000000 },
        bedrooms: 4
      },
      timeline: [
        { id: "act-6", type: "qrcode_scan", timestamp: "2026-06-11T11:15:00Z", details: "Escaneou QR Code físico na placa do Umarizal Luxury" },
        { id: "act-7", type: "view_property", propertyId: "prop-3", propertyName: "Mansão Suspensa Umarizal Luxury", timestamp: "2026-06-11T11:16:00Z", details: "Visualizou detalhes do Umarizal Luxury" },
        { id: "act-8", type: "share", propertyId: "prop-3", propertyName: "Mansão Suspensa Umarizal Luxury", timestamp: "2026-06-11T11:18:00Z", details: "Compartilhou link do imóvel via e-mail ou redes" }
      ],
      notes: "Escaneou o QR code da placa do Umarizal. Advogado bem sucedido, busca apartamento grande."
    }
  ];
  res.json({ success: true });
});

app.get("/api/stats", (req, res) => {
  res.json(getStats());
});

app.get("/api/broker", (req, res) => {
  res.json(brokerProfile);
});

app.put("/api/broker", (req, res) => {
  brokerProfile = { ...brokerProfile, ...req.body };
  res.json(brokerProfile);
});

app.get("/api/automations", (req, res) => {
  res.json(automationsList);
});

app.patch("/api/automations/:id", (req, res) => {
  const autoId = req.params.id;
  const index = automationsList.findIndex(a => a.id === autoId);
  if (index !== -1) {
    automationsList[index] = { ...automationsList[index], ...req.body };
    res.json(automationsList[index]);
  } else {
    res.status(404).json({ error: "Automação não encontrada" });
  }
});

// ----------------------------------------------------------------------------
// SERVER SIDE GEMINI API INTEGRATION
// Includes a fully functional rule-based Portuguese real estate fallback
// in case GEMINI_API_KEY is not defined in the secrets panel of AI Studio,
// ensuring the application never crashes and behaves with maximum intelligence!
// ----------------------------------------------------------------------------
app.post("/api/gemini/insight", async (req, res) => {
  const { leadId } = req.body;
  const lead = leads.find(l => l.id === leadId);

  if (!lead) {
    return res.status(404).json({ error: "Lead não encontrado para geração de insights pela IA." });
  }

  const timelineFormatted = lead.timeline
    .map(a => `- Action: ${a.type.toUpperCase()} on ${a.timestamp}. Details: ${a.details || ""}`)
    .join("\n");

  const interestInfo = `Vizinhanças: ${lead.interestProfile.neighborhoods.join(", ")}. Tipos: ${lead.interestProfile.types.join(", ")}. Faixa de Preço: R$ ${lead.interestProfile.priceRange.min.toLocaleString()} a R$ ${lead.interestProfile.priceRange.max.toLocaleString()}. Quartos: ${lead.interestProfile.bedrooms}`;

  const prompt = `Analise o seguinte Lead imobiliário no SmartBroker CRM e forneça recomendações comerciais fundamentadas:
- Nome: ${lead.name}
- Email: ${lead.email}
- Telefone: ${lead.phone}
- Score de Comportamento Atual: ${lead.score}/100
- Status do Pipeline: ${lead.status}
- Perfil de Interesse Estimado: ${interestInfo}
- Notas do Corretor: ${lead.notes || "Nenhum comentário manual."}

Cronologia de ações do Lead nos canais digitais do corretor (mais recentes primeiro):
${timelineFormatted}

Por favor, como um consultor comercial de vendas de imóveis de luxo e especialista em psicologia de conversão, forneça em Português do Brasil de forma concisa e elegante estruturada em JSON obedecendo à seguinte interface:
{
  "intentClassification": "Frio" | "Morno" | "Quente" | "Muito Quente",
  "purchaseProbability": number (de 0 a 100),
  "interestProfileSummary": "Resumo estilizado do que ele realmente busca",
  "psychologicalInsight": "Análise da postura e intenção comportamental do cliente baseado no tempo gasto e botões clicados",
  "directActionScript": "Uma mensagem de abordagem WhatsApp ou roteiro de ligação direta que o corretor deve copiar e enviar agora para converter",
  "recommendedPropertiesIds": string[] (indique de 1 a 3 IDs das seguintes propriedades cadastradas que fazem perfeito sentido para ele: "prop-1", "prop-2", "prop-3", "prop-4", "prop-5")
}`;

  const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";

  if (hasApiKey) {
    try {
      // Correct modern SDK client init with user-agent
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      // Use correct model gemini-3.5-flash for basic text tasks
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      if (response && response.text) {
        const cleanedText = response.text.trim();
        const jsonResponse = JSON.parse(cleanedText);
        return res.json(jsonResponse);
      } else {
        throw new Error("Resposta de conteúdo geradora vazia.");
      }
    } catch (e: any) {
      console.error("Erro na chamada ao Gemini API, ativando inteligência híbrida reserva:", e.message);
      // Fallback gracefully below
    }
  }

  // --- RECONSTRUCT EXCELLENT BEHAVIORAL RULE-BASED ANALYTICAL PORTUGUESE FALLBACK ---
  // If API key is placeholder or connection fails, we compute a highly customized analysis!
  const purchaseProbability = Math.round(Math.min(lead.score + (lead.timeline.length * 3) + (lead.timeline.some(a => a.type === 'whatsapp') ? 15 : 0), 96));
  
  let intentClassification = "Morno";
  if (purchaseProbability < 40) intentClassification = "Frio";
  else if (purchaseProbability >= 40 && purchaseProbability < 70) intentClassification = "Morno";
  else if (purchaseProbability >= 70 && purchaseProbability < 88) intentClassification = "Quente";
  else intentClassification = "Muito Quente";

  let psychologicalInsight = "O lead está avaliando o catálogo ativamente. ";
  if (lead.timeline.some(a => a.type === 'whatsapp')) {
    psychologicalInsight += "Mostra urgência ao iniciar conversação direta pelo WhatsApp após salvar o contato.";
  } else if (lead.timeline.some(a => a.type === 'save_contact')) {
    psychologicalInsight += "Possui forte intenção de reter o contato do corretor para consultas a médio prazo.";
  } else if (lead.timeline.length > 3) {
    psychologicalInsight += "Mostra interesse constante ao examinar múltiplos imóveis. Provável fase de pesquisa ativa.";
  } else {
    psychologicalInsight += "Visitante inicial sondando opções. A abordagem deve ser consultiva e pouco intrusiva.";
  }

  let summary = `Busca residencial de alto padrão, focado em imóveis em ${lead.interestProfile.neighborhoods.join(" ou ")}.`;
  
  let script = "";
  if (lead.timeline.some(a => a.type === 'whatsapp')) {
    script = `Olá ${lead.name}, aqui é o ${brokerProfile.name}! Notei que você gostou da nossa Cobertura em Nazaré e salvou meus contatos. Gostaria que eu lhe enviasse o vídeo tour completo do imóvel ou prefere agendar uma visita presencial rápida esta semana para sentir a energia do local?`;
  } else {
    script = `Olá ${lead.name}, tudo bem? Sou o ${brokerProfile.name}, corretor especialista de imóveis premium. Vi que esteve navegando pelas nossas oportunidades do catálogo e gostaria de me colocar à sua disposição para entender o que é primordial para a qualidade de vida da sua família hoje!`;
  }

  // Recommend properties logic
  const recommendedPropertiesIds: string[] = ["prop-1"];
  if (lead.interestProfile.priceRange.max > 2500000) {
    recommendedPropertiesIds.push("prop-3");
    recommendedPropertiesIds.push("prop-5");
  } else {
    recommendedPropertiesIds.push("prop-2");
    recommendedPropertiesIds.push("prop-4");
  }

  const simulatedResponse = {
    intentClassification,
    purchaseProbability,
    interestProfileSummary: summary,
    psychologicalInsight,
    directActionScript: script,
    recommendedPropertiesIds: recommendedPropertiesIds.filter((v, i, a) => a.indexOf(v) === i) // unique
  };

  res.json(simulatedResponse);
});

// ----------------------------------------------------------------------------
// FULL-STACK VITE INTEGRATION MIDDLEWARE
// ----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartBroker CRM server running on http://localhost:${PORT}`);
  });
}

startServer();
