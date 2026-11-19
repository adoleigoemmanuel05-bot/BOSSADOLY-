export type PageId =
  | 'home'
  | 'services'
  | 'pricing'
  | 'about'
  | 'team'
  | 'faq'
  | 'contact'
  | 'admin';

export interface MediaItem {
  id: string;
  type: 'video' | 'image';
  title: string;
  category: string;
  url: string;
  embedUrl?: string;
  source: 'youtube' | 'gdrive' | 'gallery';
  placement: 'showcase' | 'hero' | 'team';
  visible: boolean;
  createdAt: string;
}

export interface HeroAppearance {
  tone: 'light' | 'dark';
  overlayOpacity: number;
  brightness: number;
}

export interface ServiceOffering {
  number: string;
  id: string;
  title: string;
  subtitle: string;
  description: string;
  deliverables: string[];
  modeLabel: string;
  whatsappIntent: string;
  image?: string;
  imageStyle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
}

export interface PricingTier {
  id: string;
  name: string;
  tag: string;
  priceDisplay: string;
  billingNote: string;
  summary: string;
  features: string[];
  featured?: boolean;
  whatsappService: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  image?: string;
  imageStyle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export interface CustomSection {
  id: string;
  pageId: Exclude<PageId, 'admin'>;
  kicker?: string;
  title: string;
  description: string;
  bullets: string[];
  image?: string;
  imageStyle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  tone?: 'white' | 'light' | 'accent';
}

export interface CmsContent {
  logoUrl: string | null;
  items: MediaItem[];
  siteText: Record<string, string>;
  siteImages: Record<string, string>;
  heroAppearance: HeroAppearance;
  teamMembers: TeamMember[];
  services: ServiceOffering[];
  pricingTiers: PricingTier[];
  faqs: FaqEntry[];
  customSections: CustomSection[];
  hiddenSections: string[];
}
