import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Adoly1234@';

const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const STORE_PATH = path.join(DATA_DIR, 'cms-store.json');

interface MediaItem {
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

interface HeroAppearance {
  tone: 'light' | 'dark';
  overlayOpacity: number;
  brightness: number;
}

interface ServiceOffering {
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

interface PricingTier {
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

interface TeamMember {
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

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

interface CustomSection {
  id: string;
  pageId: 'home' | 'services' | 'pricing' | 'about' | 'team' | 'faq' | 'contact';
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

const DEFAULT_HERO_APPEARANCE: HeroAppearance = {
  tone: 'light',
  overlayOpacity: 75,
  brightness: 100,
};

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'adole-emmanuel',
    name: 'Adole Emmanuel (BossAdoly)',
    role: 'Founder & Meta & TikTok Ads Specialist',
    specialty: 'Meta & TikTok Ads Specialist',
    bio: 'With 3+ years of hands-on experience and intensive business training in Lagos, Adole specializes in building profitable Meta & TikTok ad campaigns for ambitious brands.',
    image: 'https://i.ibb.co/r9hW0VN/igo.jpg',
  },
  {
    id: 'ai-ugc-unit',
    name: 'AI UGC & Creative Direction Desk',
    role: 'Short-Form Video & Visual Production',
    specialty: 'AI UGC Reels · Fashion Hooks · Ad Creatives',
    bio: 'Focused on producing thumb-stopping fashion lookbook videos, product demos, and creator-style hooks calibrated for TikTok and Instagram attention spans.',
    image: '/src/assets/images/service_ai_ugc_fashion_1794824741395.jpg',
  },
  {
    id: 'web-conversion-unit',
    name: 'Web & Conversion Architecture Desk',
    role: 'Landing Pages, Opt-In & E-Commerce Websites',
    specialty: 'Landing Pages · Opt-In Funnels · E-Commerce Stores',
    bio: 'Designs all website types—from focused opt-in and landing pages to complete e-commerce stores where customers can browse, order, and connect seamlessly on WhatsApp.',
    image: '/src/assets/images/service_web_ads_showcase_1794824741921.jpg',
  },
];

const DEFAULT_SERVICES: ServiceOffering[] = [
  {
    number: '01',
    id: 'ads',
    title: 'Meta & TikTok Ads Management',
    subtitle: 'Full Funnel Setup or Standalone Campaign Launch',
    description:
      'We handle your complete ad setup from Business Manager verification and Pixel tracking to high-converting creative testing and daily budget optimization.',
    deliverables: [
      'Complete Meta & TikTok Ad Account + Pixel Setup',
      'Audience Research for Nigerian & Diaspora Buyers',
      'Direct-Response Ad Copy & Hook Testing',
      'Weekly ROI Reporting & Scaling Strategy',
    ],
    modeLabel: 'Single Service or Full Setup',
    whatsappIntent: 'Meta & TikTok Ads Service',
    image: '/src/assets/images/hero_nigerian_fashion_studio_1794824741729.jpg',
  },
  {
    number: '02',
    id: 'ugc',
    title: 'AI UGC Video Creation',
    subtitle: 'Scroll-Stopping Creator Reels Built to Sell',
    description:
      'Modern fashion and product brands win on video. We produce realistic, persuasive AI UGC videos and short-form ad creatives designed for TikTok, Instagram Reels, and Facebook.',
    deliverables: [
      'Conversion-Tested Hooks & Scriptwriting',
      'AI-Powered Studio & Lifestyle Product Videos',
      'Captions, Pacing & Fashion-Forward Grading',
      'Ready-to-Run 9:16 Ad Variations for Testing',
    ],
    modeLabel: 'Single Service or Ad Bundle',
    whatsappIntent: 'AI UGC Video Creation',
    image: '/src/assets/images/service_ai_ugc_fashion_1794824741395.jpg',
  },
  {
    number: '03',
    id: 'web',
    title: 'Website & Landing Page Design',
    subtitle: 'Landing Pages, Opt-In Pages, E-Commerce & All Business Websites',
    description:
      'We design all types of websites—high-converting landing pages, lead-capture opt-in pages, full e-commerce online stores, fashion brands, and corporate websites built to turn visitors into buyers.',
    deliverables: [
      'Custom Landing Pages & High-Converting Opt-In Pages',
      'Full E-Commerce Websites & Online Storefronts',
      'Direct WhatsApp Checkout & Payment Integration',
      'Mobile-First Speed, Clean UI & SEO Setup',
    ],
    modeLabel: 'Single Service or Full Suite',
    whatsappIntent: 'Website Design (Landing Page / Opt-In / E-Commerce)',
    image: '/src/assets/images/service_web_ads_showcase_1794824741921.jpg',
  },
];

const DEFAULT_PRICING_TIERS: PricingTier[] = [
  {
    id: 'single-ugc',
    name: 'AI UGC Video Pack',
    tag: 'Single Service',
    priceDisplay: 'Custom Quote',
    billingNote: 'Per Batch · Fast Turnaround',
    summary:
      'Ideal for fashion labels and online stores needing fresh, high-converting video ads without studio delays.',
    features: [
      'Scriptwriting & Hook Structuring',
      'AI UGC Video Production (9:16 Vertical)',
      'Subtitles & Call-to-Action Framing',
      'Ad-Ready Exports for Meta & TikTok',
    ],
    whatsappService: 'AI UGC Video Pack (Single Service)',
  },
  {
    id: 'full-growth',
    name: 'Full Digital Growth Suite',
    tag: 'Most Popular · All-In-One',
    priceDisplay: 'Tailored Retainer',
    billingNote: 'Complete Setup · Ads + Video + Web',
    summary:
      'We handle everything end-to-end: your website or landing page, your AI UGC creatives, and your complete Meta & TikTok ads execution.',
    features: [
      'Complete Meta & TikTok Ad Setup & Management',
      'Dedicated AI UGC Video Creatives Each Cycle',
      'High-Converting Landing Page / Website Design',
      'Direct WhatsApp Funnel & Conversion Tracking',
    ],
    featured: true,
    whatsappService: 'Full Digital Growth Suite (Ads + AI UGC + Website)',
  },
  {
    id: 'single-web-ads',
    name: 'Website or Ads Setup',
    tag: 'Single Service',
    priceDisplay: 'Flexible Scope',
    billingNote: 'One-Time or Monthly',
    summary:
      'Hire BossAdoly strictly for any website build (landing page, opt-in page, or e-commerce store) OR standalone Meta & TikTok campaign architecture.',
    features: [
      'Landing Page, Opt-In Page, or E-Commerce Website',
      'OR Complete Meta & TikTok Ads Launch',
      'Copywriting & Offer Positioning Included',
      'Direct Support via WhatsApp',
    ],
    whatsappService:
      'Standalone Website Design (Landing / Opt-In / E-Commerce) or Meta & TikTok Ads',
  },
];

const DEFAULT_FAQS: FaqEntry[] = [
  {
    id: 'faq-1',
    question: 'Can I hire BossAdoly Digital Hub for just one single service?',
    answer:
      'Yes. You can book only Meta & TikTok Ads management, only AI UGC video creation, or only website design—or combine all three into a complete full-service growth setup.',
  },
  {
    id: 'faq-2',
    question: 'Do you handle the complete Meta and TikTok ads setup from scratch?',
    answer:
      'Yes. We handle everything from account structure, Pixel and conversion setup, audience targeting, ad copywriting, and creative deployment to ongoing performance optimization.',
  },
  {
    id: 'faq-3',
    question: 'How does the pricing inquiry form work?',
    answer:
      'Simply enter your name, the service you want, how long you need it, your budget, and your goal on the Pricing page. When you submit, your brief drops directly into our WhatsApp (+234 8077780074) so we can reply right away.',
  },
  {
    id: 'faq-4',
    question: 'What types of websites and businesses do you design for?',
    answer:
      'We design all types of websites—including high-converting landing pages, lead-generating opt-in pages, full e-commerce websites, fashion labels, service businesses, and growing startups across Nigeria, Africa, and globally.',
  },
  {
    id: 'faq-5',
    question: 'How fast can my website or AI UGC campaign go live?',
    answer:
      'AI UGC video batches and Meta/TikTok ad setups typically launch within 3 to 5 business days. Landing pages, opt-in pages, and full e-commerce websites take 5 to 10 business days depending on scope.',
  },
  {
    id: 'faq-6',
    question: 'How do I communicate with you after hiring?',
    answer:
      'Every project includes direct, clear communication via WhatsApp (+234 8077780074) and email (info@bossadoly.com.ng), with regular progress updates and measurable milestones.',
  },
];

interface CmsStore {
  adminPassword: string;
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

function cloneDefaultStore(): CmsStore {
  return {
    adminPassword: DEFAULT_ADMIN_PASSWORD,
    logoUrl: null,
    items: [],
    siteText: {},
    siteImages: {},
    heroAppearance: { ...DEFAULT_HERO_APPEARANCE },
    teamMembers: DEFAULT_TEAM_MEMBERS.map((m) => ({ ...m })),
    services: DEFAULT_SERVICES.map((s) => ({ ...s, deliverables: [...s.deliverables] })),
    pricingTiers: DEFAULT_PRICING_TIERS.map((p) => ({ ...p, features: [...p.features] })),
    faqs: DEFAULT_FAQS.map((f) => ({ ...f })),
    customSections: [],
    hiddenSections: [],
  };
}

function computeToken(password: string): string {
  return crypto.createHash('sha256').update(`bossadoly:${password}`).digest('hex');
}

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(cloneDefaultStore(), null, 2), 'utf-8');
  }
}

function normalizeHeroAppearance(raw: unknown): HeroAppearance {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_HERO_APPEARANCE };
  }
  const obj = raw as Record<string, unknown>;
  const tone = obj.tone === 'dark' ? 'dark' : 'light';
  const overlayOpacity =
    typeof obj.overlayOpacity === 'number' && Number.isFinite(obj.overlayOpacity)
      ? Math.min(95, Math.max(0, Math.round(obj.overlayOpacity)))
      : DEFAULT_HERO_APPEARANCE.overlayOpacity;
  const brightness =
    typeof obj.brightness === 'number' && Number.isFinite(obj.brightness)
      ? Math.min(160, Math.max(40, Math.round(obj.brightness)))
      : DEFAULT_HERO_APPEARANCE.brightness;
  return { tone, overlayOpacity, brightness };
}

function normalizeTeamMembers(raw: unknown): TeamMember[] {
  if (!Array.isArray(raw)) return DEFAULT_TEAM_MEMBERS.map((m) => ({ ...m }));
  return raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry, idx) => {
      const m = entry as Record<string, unknown>;
      return {
        id:
          typeof m.id === 'string' && m.id.trim()
            ? m.id.trim()
            : `member-${Date.now()}-${idx}`,
        name: typeof m.name === 'string' && m.name.trim() ? m.name.trim() : 'Team Member',
        role: typeof m.role === 'string' ? m.role.trim() : 'Digital Specialist',
        specialty: typeof m.specialty === 'string' ? m.specialty.trim() : '',
        bio: typeof m.bio === 'string' ? m.bio.trim() : '',
        image: typeof m.image === 'string' ? m.image.trim() : '',
        imageStyle: typeof m.imageStyle === 'string' ? m.imageStyle.trim() : '',
        ctaLabel: typeof m.ctaLabel === 'string' ? m.ctaLabel.trim() : '',
        ctaUrl: typeof m.ctaUrl === 'string' ? m.ctaUrl.trim() : '',
      };
    });
}

function normalizeServices(raw: unknown): ServiceOffering[] {
  if (!Array.isArray(raw)) {
    return DEFAULT_SERVICES.map((s) => ({ ...s, deliverables: [...s.deliverables] }));
  }
  return raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry, idx) => {
      const s = entry as Record<string, unknown>;
      const deliverables = Array.isArray(s.deliverables)
        ? s.deliverables.map((d) => String(d).trim()).filter(Boolean)
        : [];
      const title = typeof s.title === 'string' && s.title.trim() ? s.title.trim() : 'New Service';
      return {
        id:
          typeof s.id === 'string' && s.id.trim()
            ? s.id.trim()
            : `service-${Date.now()}-${idx}`,
        number: String(idx + 1).padStart(2, '0'),
        title,
        subtitle: typeof s.subtitle === 'string' ? s.subtitle.trim() : '',
        description: typeof s.description === 'string' ? s.description.trim() : '',
        deliverables,
        modeLabel:
          typeof s.modeLabel === 'string' && s.modeLabel.trim()
            ? s.modeLabel.trim()
            : 'Single Service or Full Setup',
        whatsappIntent:
          typeof s.whatsappIntent === 'string' && s.whatsappIntent.trim()
            ? s.whatsappIntent.trim()
            : title,
        image: typeof s.image === 'string' ? s.image.trim() : '',
        imageStyle: typeof s.imageStyle === 'string' ? s.imageStyle.trim() : '',
        ctaLabel: typeof s.ctaLabel === 'string' ? s.ctaLabel.trim() : '',
        ctaUrl: typeof s.ctaUrl === 'string' ? s.ctaUrl.trim() : '',
        secondaryCtaLabel:
          typeof s.secondaryCtaLabel === 'string' ? s.secondaryCtaLabel.trim() : '',
        secondaryCtaUrl: typeof s.secondaryCtaUrl === 'string' ? s.secondaryCtaUrl.trim() : '',
      };
    });
}

function normalizePricingTiers(raw: unknown): PricingTier[] {
  if (!Array.isArray(raw)) {
    return DEFAULT_PRICING_TIERS.map((p) => ({ ...p, features: [...p.features] }));
  }
  return raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry, idx) => {
      const p = entry as Record<string, unknown>;
      const features = Array.isArray(p.features)
        ? p.features.map((f) => String(f).trim()).filter(Boolean)
        : [];
      const name = typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'Custom Package';
      return {
        id:
          typeof p.id === 'string' && p.id.trim()
            ? p.id.trim()
            : `tier-${Date.now()}-${idx}`,
        name,
        tag: typeof p.tag === 'string' && p.tag.trim() ? p.tag.trim() : 'Package',
        priceDisplay:
          typeof p.priceDisplay === 'string' && p.priceDisplay.trim()
            ? p.priceDisplay.trim()
            : 'Custom Quote',
        billingNote: typeof p.billingNote === 'string' ? p.billingNote.trim() : '',
        summary: typeof p.summary === 'string' ? p.summary.trim() : '',
        features,
        featured: Boolean(p.featured),
        whatsappService:
          typeof p.whatsappService === 'string' && p.whatsappService.trim()
            ? p.whatsappService.trim()
            : name,
        ctaLabel: typeof p.ctaLabel === 'string' ? p.ctaLabel.trim() : '',
        ctaUrl: typeof p.ctaUrl === 'string' ? p.ctaUrl.trim() : '',
      };
    });
}

function normalizeFaqs(raw: unknown): FaqEntry[] {
  if (!Array.isArray(raw)) return DEFAULT_FAQS.map((f) => ({ ...f }));
  return raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry, idx) => {
      const f = entry as Record<string, unknown>;
      return {
        id:
          typeof f.id === 'string' && f.id.trim() ? f.id.trim() : `faq-${Date.now()}-${idx}`,
        question: typeof f.question === 'string' ? f.question.trim() : '',
        answer: typeof f.answer === 'string' ? f.answer.trim() : '',
      };
    })
    .filter((f) => f.question.length > 0);
}

const VALID_CUSTOM_PAGES = new Set(['home', 'services', 'pricing', 'about', 'team', 'faq', 'contact']);

function normalizeCustomSections(raw: unknown): CustomSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry, idx) => {
      const c = entry as Record<string, unknown>;
      const pageIdRaw = typeof c.pageId === 'string' ? c.pageId : 'home';
      const pageId = (VALID_CUSTOM_PAGES.has(pageIdRaw)
        ? pageIdRaw
        : 'home') as CustomSection['pageId'];
      const toneRaw = typeof c.tone === 'string' ? c.tone : 'white';
      const tone = (toneRaw === 'light' || toneRaw === 'accent' ? toneRaw : 'white') as
        | 'white'
        | 'light'
        | 'accent';
      const bullets = Array.isArray(c.bullets)
        ? c.bullets.map((b) => String(b).trim()).filter(Boolean)
        : [];
      return {
        id:
          typeof c.id === 'string' && c.id.trim() ? c.id.trim() : `section-${Date.now()}-${idx}`,
        pageId,
        kicker: typeof c.kicker === 'string' ? c.kicker.trim() : '',
        title: typeof c.title === 'string' && c.title.trim() ? c.title.trim() : 'New Section',
        description: typeof c.description === 'string' ? c.description.trim() : '',
        bullets,
        image: typeof c.image === 'string' ? c.image.trim() : '',
        imageStyle: typeof c.imageStyle === 'string' ? c.imageStyle.trim() : '',
        ctaLabel: typeof c.ctaLabel === 'string' ? c.ctaLabel.trim() : '',
        ctaUrl: typeof c.ctaUrl === 'string' ? c.ctaUrl.trim() : '',
        tone,
      };
    });
}

function readStore(): CmsStore {
  ensureStorage();
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<CmsStore>;
    return {
      adminPassword:
        typeof parsed.adminPassword === 'string' && parsed.adminPassword.length > 0
          ? parsed.adminPassword
          : DEFAULT_ADMIN_PASSWORD,
      logoUrl: typeof parsed.logoUrl === 'string' ? parsed.logoUrl : null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      siteText:
        parsed.siteText && typeof parsed.siteText === 'object' && !Array.isArray(parsed.siteText)
          ? (parsed.siteText as Record<string, string>)
          : {},
      siteImages:
        parsed.siteImages &&
        typeof parsed.siteImages === 'object' &&
        !Array.isArray(parsed.siteImages)
          ? (parsed.siteImages as Record<string, string>)
          : {},
      heroAppearance: normalizeHeroAppearance(parsed.heroAppearance),
      teamMembers: normalizeTeamMembers(parsed.teamMembers),
      services: normalizeServices(parsed.services),
      pricingTiers: normalizePricingTiers(parsed.pricingTiers),
      faqs: normalizeFaqs(parsed.faqs),
      customSections: normalizeCustomSections(parsed.customSections),
      hiddenSections: Array.isArray(parsed.hiddenSections)
        ? parsed.hiddenSections.map((s) => String(s)).filter(Boolean)
        : [],
    };
  } catch {
    return cloneDefaultStore();
  }
}

function writeStore(store: CmsStore): void {
  ensureStorage();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function deleteLocalUploadIfUnused(urlToDelete: string | undefined, store: CmsStore): void {
  if (!urlToDelete || !urlToDelete.startsWith('/uploads/')) return;
  const stillUsed =
    store.logoUrl === urlToDelete ||
    store.items.some((item) => item.url === urlToDelete) ||
    Object.values(store.siteImages).includes(urlToDelete) ||
    store.teamMembers.some((m) => m.image === urlToDelete) ||
    store.services.some((s) => s.image === urlToDelete) ||
    store.customSections.some((c) => c.image === urlToDelete);
  if (stillUsed) return;

  const filePath = path.join(UPLOADS_DIR, path.basename(urlToDelete));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function saveBase64Image(dataUrl: string): { publicUrl?: string; error?: string } {
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return { error: 'Invalid image format. Upload a PNG, JPG, WEBP, or SVG image.' };
  }

  const ext = match[1] === 'svg+xml' ? 'svg' : match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.byteLength > 8 * 1024 * 1024) {
    return { error: 'Image size must be 8MB or smaller.' };
  }

  ensureStorage();
  const filename = `media_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return { publicUrl: `/uploads/${filename}` };
}

function parseVideoEmbedUrl(rawUrl: string): {
  source: 'youtube' | 'gdrive';
  embedUrl: string;
} | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let videoId = '';
      if (host.includes('youtu.be')) {
        videoId = parsed.pathname.replace(/^\//, '').split('/')[0] || '';
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || '';
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0] || '';
      } else {
        videoId = parsed.searchParams.get('v') || '';
      }

      if (videoId && /^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
        return {
          source: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        };
      }
    }

    if (host.includes('drive.google.com')) {
      let fileId = '';
      const match = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        fileId = match[1];
      } else {
        fileId = parsed.searchParams.get('id') || '';
      }
      if (fileId && /^[a-zA-Z0-9_-]{10,120}$/.test(fileId)) {
        return {
          source: 'gdrive',
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const store = readStore();
  const expectedToken = computeToken(store.adminPassword);
  const authHeader = req.headers['x-admin-token'];
  if (typeof authHeader !== 'string' || authHeader !== expectedToken) {
    res.status(401).json({ error: 'Unauthorized. Valid admin session required.' });
    return;
  }
  next();
}

async function startServer(): Promise<void> {
  ensureStorage();

  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/content', (req: Request, res: Response) => {
    const store = readStore();
    const expectedToken = computeToken(store.adminPassword);
    const isAdmin = req.headers['x-admin-token'] === expectedToken;
    res.json({
      logoUrl: store.logoUrl,
      items: isAdmin ? store.items : store.items.filter((item) => item.visible),
      siteText: store.siteText,
      siteImages: store.siteImages,
      heroAppearance: store.heroAppearance,
      teamMembers: store.teamMembers,
      services: store.services,
      pricingTiers: store.pricingTiers,
      faqs: store.faqs,
      customSections: store.customSections,
      hiddenSections: store.hiddenSections,
    });
  });

  app.put('/api/admin/hero-appearance', requireAdmin, (req: Request, res: Response) => {
    const store = readStore();
    store.heroAppearance = normalizeHeroAppearance(req.body);
    writeStore(store);
    res.json({ heroAppearance: store.heroAppearance });
  });

  app.put('/api/admin/team', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as { teamMembers?: unknown };
    if (!Array.isArray(body.teamMembers)) {
      res.status(400).json({ error: 'Invalid team members list.' });
      return;
    }
    const store = readStore();
    store.teamMembers = normalizeTeamMembers(body.teamMembers);
    writeStore(store);
    res.json({ teamMembers: store.teamMembers });
  });

  app.put('/api/admin/services', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as { services?: unknown };
    if (!Array.isArray(body.services)) {
      res.status(400).json({ error: 'Invalid services list.' });
      return;
    }
    const store = readStore();
    store.services = normalizeServices(body.services);
    writeStore(store);
    res.json({ services: store.services });
  });

  app.put('/api/admin/pricing', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as { pricingTiers?: unknown };
    if (!Array.isArray(body.pricingTiers)) {
      res.status(400).json({ error: 'Invalid pricing packages list.' });
      return;
    }
    const store = readStore();
    store.pricingTiers = normalizePricingTiers(body.pricingTiers);
    writeStore(store);
    res.json({ pricingTiers: store.pricingTiers });
  });

  app.put('/api/admin/faqs', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as { faqs?: unknown };
    if (!Array.isArray(body.faqs)) {
      res.status(400).json({ error: 'Invalid FAQ list.' });
      return;
    }
    const store = readStore();
    store.faqs = normalizeFaqs(body.faqs);
    writeStore(store);
    res.json({ faqs: store.faqs });
  });

  app.put('/api/admin/custom-sections', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as { customSections?: unknown };
    if (!Array.isArray(body.customSections)) {
      res.status(400).json({ error: 'Invalid custom sections list.' });
      return;
    }
    const store = readStore();
    store.customSections = normalizeCustomSections(body.customSections);
    writeStore(store);
    res.json({ customSections: store.customSections });
  });

  app.put('/api/admin/hidden-sections', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as { hiddenSections?: unknown };
    if (!Array.isArray(body.hiddenSections)) {
      res.status(400).json({ error: 'Invalid hidden sections list.' });
      return;
    }
    const store = readStore();
    store.hiddenSections = body.hiddenSections.map((s) => String(s)).filter(Boolean);
    writeStore(store);
    res.json({ hiddenSections: store.hiddenSections });
  });

  app.post('/api/admin/verify', (req: Request, res: Response) => {
    const store = readStore();
    const body = req.body as { password?: unknown };
    const password = typeof body.password === 'string' ? body.password : '';
    if (password !== store.adminPassword) {
      res.status(401).json({ error: 'Incorrect password. Please try again.' });
      return;
    }
    res.json({ ok: true, token: computeToken(store.adminPassword) });
  });

  app.post('/api/admin/change-password', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as { currentPassword?: unknown; newPassword?: unknown };
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';

    const store = readStore();
    if (currentPassword !== store.adminPassword) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    store.adminPassword = newPassword;
    writeStore(store);
    res.json({ ok: true, token: computeToken(newPassword) });
  });

  app.put('/api/admin/site-text', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as { updates?: unknown };
    if (!body.updates || typeof body.updates !== 'object' || Array.isArray(body.updates)) {
      res.status(400).json({ error: 'Invalid text updates payload.' });
      return;
    }

    const store = readStore();
    const entries = Object.entries(body.updates as Record<string, unknown>);
    for (const [key, val] of entries) {
      if (typeof key !== 'string' || !key.trim()) continue;
      if (val === null || val === '') {
        delete store.siteText[key];
      } else if (typeof val === 'string') {
        store.siteText[key] = val;
      }
    }
    writeStore(store);
    res.json({ siteText: store.siteText });
  });

  app.post('/api/admin/replace-image', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as {
      slotKey?: unknown;
      dataUrl?: unknown;
      imageUrl?: unknown;
      reset?: unknown;
    };

    const slotKey = typeof body.slotKey === 'string' ? body.slotKey.trim() : '';
    if (!slotKey) {
      res.status(400).json({ error: 'Missing image slot key.' });
      return;
    }

    const store = readStore();
    const previousUrl = store.siteImages[slotKey];

    if (body.reset === true) {
      delete store.siteImages[slotKey];
      writeStore(store);
      deleteLocalUploadIfUnused(previousUrl, store);
      res.json({ siteImages: store.siteImages });
      return;
    }

    if (typeof body.dataUrl === 'string' && body.dataUrl.startsWith('data:image/')) {
      if (!/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(body.dataUrl)) {
        res.status(400).json({ error: 'Invalid image format. Upload a PNG, JPG, WEBP, or SVG image.' });
        return;
      }
      store.siteImages[slotKey] = body.dataUrl;
      writeStore(store);
      deleteLocalUploadIfUnused(previousUrl, store);
      res.json({ siteImages: store.siteImages, url: body.dataUrl });
      return;
    }

    if (typeof body.imageUrl === 'string' && body.imageUrl.trim()) {
      const cleaned = body.imageUrl.trim();
      store.siteImages[slotKey] = cleaned;
      writeStore(store);
      deleteLocalUploadIfUnused(previousUrl, store);
      res.json({ siteImages: store.siteImages, url: cleaned });
      return;
    }

    res.status(400).json({ error: 'Provide an uploaded image file or a valid image URL.' });
  });

  app.put('/api/admin/restore-snapshot', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as Partial<CmsStore>;
    const store = readStore();
    if (body.logoUrl !== undefined) {
      store.logoUrl = typeof body.logoUrl === 'string' && body.logoUrl ? body.logoUrl : null;
    }
    if (Array.isArray(body.items)) {
      store.items = body.items;
    }
    if (body.siteText && typeof body.siteText === 'object' && !Array.isArray(body.siteText)) {
      store.siteText = body.siteText as Record<string, string>;
    }
    if (body.siteImages && typeof body.siteImages === 'object' && !Array.isArray(body.siteImages)) {
      store.siteImages = body.siteImages as Record<string, string>;
    }
    if (body.heroAppearance) {
      store.heroAppearance = normalizeHeroAppearance(body.heroAppearance);
    }
    if (Array.isArray(body.teamMembers)) {
      store.teamMembers = normalizeTeamMembers(body.teamMembers);
    }
    if (Array.isArray(body.services)) {
      store.services = normalizeServices(body.services);
    }
    if (Array.isArray(body.pricingTiers)) {
      store.pricingTiers = normalizePricingTiers(body.pricingTiers);
    }
    if (Array.isArray(body.faqs)) {
      store.faqs = normalizeFaqs(body.faqs);
    }
    if (Array.isArray(body.customSections)) {
      store.customSections = normalizeCustomSections(body.customSections);
    }
    if (Array.isArray(body.hiddenSections)) {
      store.hiddenSections = body.hiddenSections.map((s) => String(s)).filter(Boolean);
    }
    writeStore(store);
    res.json({ ok: true });
  });

  app.post('/api/admin/video', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as {
      title?: unknown;
      category?: unknown;
      url?: unknown;
      placement?: unknown;
    };

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const category =
      typeof body.category === 'string' && body.category.trim()
        ? body.category.trim()
        : 'AI UGC Video';
    const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
    const placement =
      body.placement === 'hero' || body.placement === 'team' ? body.placement : 'showcase';

    if (!title) {
      res.status(400).json({ error: 'Please provide a video title.' });
      return;
    }

    const parsed = parseVideoEmbedUrl(rawUrl);
    if (!parsed) {
      res.status(400).json({
        error: 'Please enter a valid YouTube or Google Drive video URL.',
      });
      return;
    }

    const store = readStore();
    const newItem: MediaItem = {
      id: crypto.randomUUID(),
      type: 'video',
      title,
      category,
      url: rawUrl,
      embedUrl: parsed.embedUrl,
      source: parsed.source,
      placement,
      visible: true,
      createdAt: new Date().toISOString(),
    };

    store.items.unshift(newItem);
    writeStore(store);
    res.status(201).json({ item: newItem });
  });

  app.post('/api/admin/upload-image', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as {
      dataUrl?: unknown;
      title?: unknown;
      category?: unknown;
      placement?: unknown;
    };

    const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : '';
    const title = typeof body.title === 'string' ? body.title.trim() : 'Studio Upload';
    const category =
      typeof body.category === 'string' && body.category.trim()
        ? body.category.trim()
        : 'Website Design';
    const placementRaw = typeof body.placement === 'string' ? body.placement : 'showcase';
    const store = readStore();

    if (placementRaw === 'logo') {
      if (!/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) {
        res.status(400).json({ error: 'Invalid logo image format.' });
        return;
      }
      const oldLogo = store.logoUrl || undefined;
      store.logoUrl = dataUrl;
      writeStore(store);
      deleteLocalUploadIfUnused(oldLogo, store);
      res.status(201).json({ logoUrl: dataUrl });
      return;
    }

    if (!/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) {
      res.status(400).json({ error: 'Invalid image format. Upload a PNG, JPG, WEBP, or SVG image.' });
      return;
    }

    const placement: 'showcase' | 'hero' | 'team' =
      placementRaw === 'hero' || placementRaw === 'team' ? placementRaw : 'showcase';

    const newItem: MediaItem = {
      id: crypto.randomUUID(),
      type: 'image',
      title: title || 'Studio Visual',
      category,
      url: dataUrl,
      source: 'gallery',
      placement,
      visible: true,
      createdAt: new Date().toISOString(),
    };

    store.items.unshift(newItem);
    writeStore(store);
    res.status(201).json({ item: newItem });
  });

  app.patch('/api/admin/item/:id', requireAdmin, (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const body = req.body as { visible?: unknown; title?: unknown; category?: unknown };
    const store = readStore();
    const idx = store.items.findIndex((item) => item.id === id);

    if (idx === -1) {
      res.status(404).json({ error: 'Media item not found.' });
      return;
    }

    const existing = store.items[idx];
    if (typeof body.visible === 'boolean') {
      existing.visible = body.visible;
    }
    if (typeof body.title === 'string' && body.title.trim()) {
      existing.title = body.title.trim();
    }
    if (typeof body.category === 'string' && body.category.trim()) {
      existing.category = body.category.trim();
    }

    store.items[idx] = existing;
    writeStore(store);
    res.json({ item: existing });
  });

  app.delete('/api/admin/item/:id', requireAdmin, (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const store = readStore();
    const target = store.items.find((item) => item.id === id);
    if (!target) {
      res.status(404).json({ error: 'Media item not found.' });
      return;
    }

    store.items = store.items.filter((item) => item.id !== id);
    writeStore(store);
    deleteLocalUploadIfUnused(target.url, store);
    res.json({ ok: true });
  });

  app.delete('/api/admin/logo', requireAdmin, (_req: Request, res: Response) => {
    const store = readStore();
    const oldLogo = store.logoUrl || undefined;
    store.logoUrl = null;
    writeStore(store);
    deleteLocalUploadIfUnused(oldLogo, store);
    res.json({ logoUrl: null });
  });

  if (process.env.NODE_ENV !== 'production') {
    const viteReady = (async () => {
      const { createServer: createViteServer } = await import('vite');
      return createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
        },
        appType: 'spa',
      });
    })();
    viteReady.catch((err) => {
      console.error('Vite middleware initialization failed:', err);
    });
    app.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        const vite = await viteReady;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BossAdoly Digital Hub server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
