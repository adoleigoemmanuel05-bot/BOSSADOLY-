import type { FaqEntry, PageId, PricingTier, ServiceOffering, TeamMember } from '../types/content';

export const BRAND_ASSETS = {
  heroStudio: '/src/assets/images/hero_nigerian_fashion_studio_1794824741729.jpg',
  aiUgcStudio: '/src/assets/images/service_ai_ugc_fashion_1794824741395.jpg',
  webShowcase: '/src/assets/images/service_web_ads_showcase_1794824741921.jpg',
  founderPortrait: '/src/assets/images/founder_bossadoly_portrait_1794824742158.jpg',
};

export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/profile.php?id=61583502360586',
  instagram: 'https://www.instagram.com/bossadoly_consult',
  whatsapp: 'https://wa.me/2348077780074',
  linkedin: 'https://www.linkedin.com/in/adole-emmanuel-86b3922b9',
  x: 'https://x.com/emmanuel35885',
};

export const CONTACT_INFO = {
  email: 'info@bossadoly.com.ng',
  whatsappDisplay: '+234 8077780074',
  serviceArea: 'Remote across Lagos, Nigeria & Global Markets',
};

export const SERVICES_DATA: ServiceOffering[] = [
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
    image: BRAND_ASSETS.heroStudio,
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
    image: BRAND_ASSETS.aiUgcStudio,
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
    image: BRAND_ASSETS.webShowcase,
  },
];

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'single-ugc',
    name: 'AI UGC Video Pack',
    tag: 'Single Service',
    priceDisplay: 'Custom Quote',
    billingNote: 'Per Batch · Fast Turnaround',
    summary: 'Ideal for fashion labels and online stores needing fresh, high-converting video ads without studio delays.',
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
    summary: 'We handle everything end-to-end: your website or landing page, your AI UGC creatives, and your complete Meta & TikTok ads execution.',
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
    whatsappService: 'Standalone Website Design (Landing / Opt-In / E-Commerce) or Meta & TikTok Ads',
  },
];

export const ABOUT_COPY = {
  headline: 'The Driving Force Behind Your Digital Success',
  journeyTitle: 'My Journey',
  journeyText:
    'In 2024, I discovered copywriting and realized how words could sell. That sparked a hunger for digital knowledge. I completed multiple business programs in Lagos and mastered Meta & TikTok advertising. Now, I design landing pages and opt-in pages that convert prospects into customers.',
  experienceTitle: 'Experience',
  experienceText:
    "3+ years of professional expertise helping businesses reach their right audience and convert them into paying customers. From small startups to growing businesses, I've helped transform online presence and generate measurable results.",
  missionTitle: 'My Mission',
  missions: [
    'Be the driving force behind every business reaching their right audience online.',
    'Equip individuals around Nigeria and Africa with knowledge of the online space through demanding, high-value skills training.',
  ],
};

export const TEAM_DATA: TeamMember[] = [
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
    image: BRAND_ASSETS.aiUgcStudio,
  },
  {
    id: 'web-conversion-unit',
    name: 'Web & Conversion Architecture Desk',
    role: 'Landing Pages, Opt-In & E-Commerce Websites',
    specialty: 'Landing Pages · Opt-In Funnels · E-Commerce Stores',
    bio: 'Designs all website types—from focused opt-in and landing pages to complete e-commerce stores where customers can browse, order, and connect seamlessly on WhatsApp.',
    image: BRAND_ASSETS.webShowcase,
  },
];

export const FAQ_DATA: FaqEntry[] = [
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

export interface BuiltInSectionMeta {
  id: string;
  pageId: Exclude<PageId, 'admin'>;
  pageLabel: string;
  sectionName: string;
}

export const BUILT_IN_SECTIONS: BuiltInSectionMeta[] = [
  { id: 'home.hero', pageId: 'home', pageLabel: 'Home Page', sectionName: 'Hero Carousel & Intro' },
  { id: 'home.stats', pageId: 'home', pageLabel: 'Home Page', sectionName: '4-Column Proof Strip' },
  { id: 'home.services', pageId: 'home', pageLabel: 'Home Page', sectionName: 'Core Capabilities Bento' },
  { id: 'home.showcase', pageId: 'home', pageLabel: 'Home Page', sectionName: 'Reels & Gallery Showcase' },
  { id: 'home.banner', pageId: 'home', pageLabel: 'Home Page', sectionName: 'Bottom WhatsApp Banner' },
  { id: 'services.list', pageId: 'services', pageLabel: 'Services Page', sectionName: 'Service Offerings List' },
  { id: 'services.showcase', pageId: 'services', pageLabel: 'Services Page', sectionName: 'Services Media Showcase' },
  { id: 'pricing.tiers', pageId: 'pricing', pageLabel: 'Pricing Page', sectionName: 'Pricing Packages Cards' },
  { id: 'pricing.form', pageId: 'pricing', pageLabel: 'Pricing Page', sectionName: 'WhatsApp Project Brief Form' },
  { id: 'about.story', pageId: 'about', pageLabel: 'About Us Page', sectionName: 'Founder Story & Mission' },
  { id: 'team.members', pageId: 'team', pageLabel: 'Meet Our Team Page', sectionName: 'Team Members Grid' },
  { id: 'team.highlights', pageId: 'team', pageLabel: 'Meet Our Team Page', sectionName: 'Studio Highlights Gallery' },
  { id: 'faq.list', pageId: 'faq', pageLabel: 'FAQ Page', sectionName: 'FAQ Questions List' },
  { id: 'faq.cta', pageId: 'faq', pageLabel: 'FAQ Page', sectionName: 'FAQ Bottom CTA Banner' },
  { id: 'contact.details', pageId: 'contact', pageLabel: 'Contact Page', sectionName: 'WhatsApp Card & Quick Form' },
];
