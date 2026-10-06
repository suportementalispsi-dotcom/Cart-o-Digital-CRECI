export interface LeadAction {
  id: string;
  type: "access" | "whatsapp" | "email" | "share" | "save_contact" | "view_property" | "schedule_visit" | "qrcode_scan" | "property_favorite";
  propertyId?: string;
  propertyName?: string;
  timestamp: string;
  details?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  origin: string;
  responsible: string;
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

export interface Property {
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

export interface BrokerProfile {
  id: string;
  name: string;
  photo: string;
  creci: string;
  bio: string;
  city: string;
  whatsapp: string;
  email: string;
  site: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  youtube: string;
  companyId: string;
  qrcodes: { id: string; title: string; scans: number; lastScan: string }[];
}

export interface AppStats {
  totalLeads: number;
  avgScore: number;
  pipeline: {
    new: number;
    contact_made: number;
    interested: number;
    visit_scheduled: number;
    proposal: number;
    negotiation: number;
    won: number;
    lost: number;
  };
  propertyViews: { [key: string]: number };
  clicks: {
    whatsapp: number;
    saved_contact: number;
    visits_scheduled: number;
    shares: number;
  };
  ctr: string;
  conversions: number;
  vendasTotais: string;
}

export interface AutomationRule {
  id: string;
  title: string;
  trigger: string;
  action: string;
  active: boolean;
}

export interface SaaSPlan {
  id: string;
  name: string;
  price: number;
  leadsLimit: number;
  features: string[];
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  creci: string;
  role: string;
  photo: string;
  status: "active" | "inactive";
}

export interface AgencyProfile {
  companyName: string;
  fantasyName: string;
  cnpj: string;
  creciJuridico: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  logo: string;
  cover: string;
  primaryColor: string;
  team: Agent[];
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  userType: "Corretor Autônomo" | "Imobiliária";
  creci?: string;
  token?: string;
  mfaEnabled: boolean;
  emailVerified: boolean;
  loggedIn: boolean;
}

export interface SubscriptionInfo {
  planId: string;
  planName: string;
  price: number;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  paymentMethod: { brand: string; last4: string; holder: string };
  invoices: { id: string; date: string; value: number; status: string; url: string }[];
}
