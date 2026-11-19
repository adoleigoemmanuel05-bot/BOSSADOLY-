import {
  ABOUT_COPY,
  BRAND_ASSETS,
  CONTACT_INFO,
  FAQ_DATA,
  PRICING_TIERS,
  SERVICES_DATA,
  TEAM_DATA,
} from './siteData';

export interface EditableTextField {
  key: string;
  label: string;
  defaultValue: string;
  multiline?: boolean;
}

export interface EditablePageTextGroup {
  pageId: string;
  pageLabel: string;
  fields: EditableTextField[];
}

export interface EditableImageSlot {
  slotKey: string;
  pageLabel: string;
  label: string;
  defaultUrl: string;
}

export function getTextOverride(
  siteText: Record<string, string>,
  key: string,
  fallback: string
): string {
  const val = siteText[key];
  return typeof val === 'string' && val.length > 0 ? val : fallback;
}

export function getTextColorStyle(
  siteText: Record<string, string>,
  key: string
): { color: string } | undefined {
  const val = siteText[`${key}.color`];
  if (typeof val === 'string' && val.trim().length > 0) {
    return { color: val.trim() };
  }
  return undefined;
}

export function getImageOverride(
  siteImages: Record<string, string>,
  slotKey: string,
  fallback: string
): string {
  const val = siteImages[slotKey];
  return typeof val === 'string' && val.length > 0 ? val : fallback;
}

export const EDITABLE_TEXT_GROUPS: EditablePageTextGroup[] = [
  {
    pageId: 'home',
    pageLabel: 'Home Page',
    fields: [
      {
        key: 'home.hero.eyebrow',
        label: 'Hero Top Line',
        defaultValue:
          'Meta & TikTok Ads · AI UGC Videos · Landing Pages, Opt-In & E-Commerce Websites',
      },
      {
        key: 'home.hero.title',
        label: 'Hero Main Headline',
        defaultValue: 'Turn Attention Into Paying Customers With Confidence',
      },
      {
        key: 'home.hero.description',
        label: 'Hero Description',
        defaultValue:
          'BossAdoly Digital Hub designs all types of websites—landing pages, opt-in pages, and e-commerce stores—produces scroll-stopping AI UGC videos, and runs complete Meta & TikTok ad setups. Hire us for one focused service or the full growth engine.',
        multiline: true,
      },
      {
        key: 'home.hero.ctaPrimary',
        label: 'Hero Primary Button Text',
        defaultValue: 'Hire Me on WhatsApp',
      },
      {
        key: 'home.hero.ctaSecondary',
        label: 'Hero Secondary Button Text',
        defaultValue: 'Build Custom Quote',
      },
      { key: 'home.stats.1.value', label: 'Proof Metric 1 Value', defaultValue: '3+ Years' },
      {
        key: 'home.stats.1.label',
        label: 'Proof Metric 1 Label',
        defaultValue: 'Digital & Lagos Program Mastery',
      },
      { key: 'home.stats.2.value', label: 'Proof Metric 2 Value', defaultValue: 'Meta & TikTok' },
      {
        key: 'home.stats.2.label',
        label: 'Proof Metric 2 Label',
        defaultValue: 'Complete Ad Funnel Execution',
      },
      { key: 'home.stats.3.value', label: 'Proof Metric 3 Value', defaultValue: 'AI UGC Video' },
      {
        key: 'home.stats.3.label',
        label: 'Proof Metric 3 Label',
        defaultValue: 'Creator-Style Ad Reels That Sell',
      },
      { key: 'home.stats.4.value', label: 'Proof Metric 4 Value', defaultValue: 'Single / Full' },
      {
        key: 'home.stats.4.label',
        label: 'Proof Metric 4 Label',
        defaultValue: 'Book One Service or Everything',
      },
      { key: 'home.services.kicker', label: 'Services Section Kicker', defaultValue: 'What We Deliver' },
      {
        key: 'home.services.title',
        label: 'Services Section Heading',
        defaultValue: 'Choose One Service or the Full Growth Setup',
      },
      {
        key: 'home.bento.left.title',
        label: 'Featured Ads & Web Card Title',
        defaultValue: 'Meta & TikTok Ads + Landing, Opt-In & E-Commerce Websites',
      },
      {
        key: 'home.bento.left.description',
        label: 'Featured Ads & Web Card Description',
        defaultValue:
          'From lead-capture opt-in pages and sleek landing pages to full e-commerce storefronts and Pixel-tracked ad campaigns—we connect every click straight to your WhatsApp or checkout.',
        multiline: true,
      },
      {
        key: 'home.bento.left.cta',
        label: 'Featured Ads & Web Button Text',
        defaultValue: 'Hire for Ads or Web',
      },
      {
        key: 'home.bento.right.title',
        label: 'Featured AI UGC Card Title',
        defaultValue: SERVICES_DATA[1].title,
      },
      {
        key: 'home.bento.right.description',
        label: 'Featured AI UGC Card Description',
        defaultValue: SERVICES_DATA[1].description,
        multiline: true,
      },
      {
        key: 'home.bento.right.cta',
        label: 'Featured AI UGC Button Text',
        defaultValue: 'Book AI UGC Videos',
      },
      {
        key: 'home.banner.kicker',
        label: 'Bottom Banner Kicker',
        defaultValue: 'Ready When You Are',
      },
      {
        key: 'home.banner.title',
        label: 'Bottom Banner Heading',
        defaultValue: 'Need Ads, AI UGC Videos, or a Modern Website This Week?',
      },
      {
        key: 'home.banner.description',
        label: 'Bottom Banner Description',
        defaultValue:
          'Send your goals and budget on our Pricing page or message BossAdoly directly on WhatsApp for a fast response.',
        multiline: true,
      },
      {
        key: 'home.banner.ctaPrimary',
        label: 'Bottom Banner Button 1',
        defaultValue: 'Fill Project Brief',
      },
      {
        key: 'home.banner.ctaSecondary',
        label: 'Bottom Banner Button 2',
        defaultValue: 'Chat on WhatsApp',
      },
    ],
  },
  {
    pageId: 'services',
    pageLabel: 'Services Page',
    fields: [
      {
        key: 'services.header.kicker',
        label: 'Page Kicker',
        defaultValue: 'Services · Full Suite or Single Option',
      },
      {
        key: 'services.header.title',
        label: 'Page Heading',
        defaultValue: 'Complete Digital Execution or One Targeted Service',
      },
      {
        key: 'services.header.description',
        label: 'Page Intro',
        defaultValue:
          'Whether you want us to handle your entire Meta & TikTok ads pipeline, create AI UGC video reels, or design any website—landing pages, opt-in pages, or e-commerce stores—you choose the exact scope your business needs.',
        multiline: true,
      },
      ...SERVICES_DATA.flatMap((srv) => [
        {
          key: `services.${srv.id}.modeLabel`,
          label: `${srv.number} Mode Label`,
          defaultValue: srv.modeLabel,
        },
        {
          key: `services.${srv.id}.title`,
          label: `${srv.number} Service Title`,
          defaultValue: srv.title,
        },
        {
          key: `services.${srv.id}.subtitle`,
          label: `${srv.number} Subtitle`,
          defaultValue: srv.subtitle,
        },
        {
          key: `services.${srv.id}.description`,
          label: `${srv.number} Description`,
          defaultValue: srv.description,
          multiline: true,
        },
        {
          key: `services.${srv.id}.deliverables`,
          label: `${srv.number} Deliverables (one per line)`,
          defaultValue: srv.deliverables.join('\n'),
          multiline: true,
        },
      ]),
    ],
  },
  {
    pageId: 'pricing',
    pageLabel: 'Pricing Page',
    fields: [
      {
        key: 'pricing.header.kicker',
        label: 'Page Kicker',
        defaultValue: 'Pricing & Custom Brief',
      },
      {
        key: 'pricing.header.title',
        label: 'Page Heading',
        defaultValue: 'Flexible Packages Built Around Your Goal & Budget',
      },
      {
        key: 'pricing.header.description',
        label: 'Page Intro',
        defaultValue:
          'Book a single service or hire BossAdoly Digital Hub for complete end-to-end execution. Fill out the project form below and your details will drop directly on our WhatsApp.',
        multiline: true,
      },
      ...PRICING_TIERS.flatMap((tier, idx) => [
        { key: `pricing.${tier.id}.tag`, label: `Tier ${idx + 1} Tag`, defaultValue: tier.tag },
        { key: `pricing.${tier.id}.name`, label: `Tier ${idx + 1} Name`, defaultValue: tier.name },
        {
          key: `pricing.${tier.id}.priceDisplay`,
          label: `Tier ${idx + 1} Price Label`,
          defaultValue: tier.priceDisplay,
        },
        {
          key: `pricing.${tier.id}.billingNote`,
          label: `Tier ${idx + 1} Billing Note`,
          defaultValue: tier.billingNote,
        },
        {
          key: `pricing.${tier.id}.summary`,
          label: `Tier ${idx + 1} Summary`,
          defaultValue: tier.summary,
          multiline: true,
        },
        {
          key: `pricing.${tier.id}.features`,
          label: `Tier ${idx + 1} Features (one per line)`,
          defaultValue: tier.features.join('\n'),
          multiline: true,
        },
      ]),
      {
        key: 'pricing.form.kicker',
        label: 'Form Kicker',
        defaultValue: 'Instant WhatsApp Brief',
      },
      {
        key: 'pricing.form.title',
        label: 'Form Heading',
        defaultValue: 'Tell Us What You Need — Drops Straight on WhatsApp',
      },
      {
        key: 'pricing.form.submitLabel',
        label: 'Form Submit Button Text',
        defaultValue: 'Submit & Send to WhatsApp',
      },
    ],
  },
  {
    pageId: 'about',
    pageLabel: 'About Us Page',
    fields: [
      {
        key: 'about.header.kicker',
        label: 'Page Kicker',
        defaultValue: 'About BossAdoly Digital Hub',
      },
      { key: 'about.header.title', label: 'Page Heading', defaultValue: ABOUT_COPY.headline },
      { key: 'about.journeyTitle', label: 'Journey Heading', defaultValue: ABOUT_COPY.journeyTitle },
      {
        key: 'about.journeyText',
        label: 'Journey Story',
        defaultValue: ABOUT_COPY.journeyText,
        multiline: true,
      },
      {
        key: 'about.experienceTitle',
        label: 'Experience Heading',
        defaultValue: ABOUT_COPY.experienceTitle,
      },
      {
        key: 'about.experienceText',
        label: 'Experience Text',
        defaultValue: ABOUT_COPY.experienceText,
        multiline: true,
      },
      { key: 'about.missionTitle', label: 'Mission Heading', defaultValue: ABOUT_COPY.missionTitle },
      {
        key: 'about.mission1',
        label: 'Mission Card 1',
        defaultValue: ABOUT_COPY.missions[0],
        multiline: true,
      },
      {
        key: 'about.mission2',
        label: 'Mission Card 2',
        defaultValue: ABOUT_COPY.missions[1],
        multiline: true,
      },
    ],
  },
  {
    pageId: 'team',
    pageLabel: 'Meet Our Team Page',
    fields: [
      { key: 'team.header.kicker', label: 'Page Kicker', defaultValue: 'Meet Our Team' },
      {
        key: 'team.header.title',
        label: 'Page Heading',
        defaultValue: 'Focused Talent Behind Every Ad, Reel, and Website',
      },
      {
        key: 'team.header.description',
        label: 'Page Intro',
        defaultValue:
          'Led by Adole Emmanuel (BossAdoly), our studio combines Meta & TikTok media buying, AI UGC production, and modern web design.',
        multiline: true,
      },
      ...TEAM_DATA.flatMap((member, idx) => [
        { key: `team.${member.id}.name`, label: `Member ${idx + 1} Name`, defaultValue: member.name },
        { key: `team.${member.id}.role`, label: `Member ${idx + 1} Role`, defaultValue: member.role },
        {
          key: `team.${member.id}.specialty`,
          label: `Member ${idx + 1} Specialty`,
          defaultValue: member.specialty,
        },
        {
          key: `team.${member.id}.bio`,
          label: `Member ${idx + 1} Bio`,
          defaultValue: member.bio,
          multiline: true,
        },
      ]),
    ],
  },
  {
    pageId: 'faq',
    pageLabel: 'FAQ Page',
    fields: [
      {
        key: 'faq.header.kicker',
        label: 'Page Kicker',
        defaultValue: 'Frequently Asked Questions',
      },
      {
        key: 'faq.header.title',
        label: 'Page Heading',
        defaultValue: 'Clear Answers Before You Hire Us',
      },
      {
        key: 'faq.header.description',
        label: 'Page Intro',
        defaultValue:
          'Everything you need to know about booking single services, full Meta & TikTok ad setups, AI UGC videos, and landing pages, opt-in pages, or e-commerce websites.',
        multiline: true,
      },
      ...FAQ_DATA.flatMap((item, idx) => [
        {
          key: `faq.${idx}.question`,
          label: `Question ${idx + 1}`,
          defaultValue: item.question,
        },
        {
          key: `faq.${idx}.answer`,
          label: `Answer ${idx + 1}`,
          defaultValue: item.answer,
          multiline: true,
        },
      ]),
      { key: 'faq.cta.title', label: 'Bottom CTA Heading', defaultValue: 'Still Have a Question?' },
      {
        key: 'faq.cta.description',
        label: 'Bottom CTA Subtext',
        defaultValue:
          'Send a quick message on WhatsApp or fill out a project brief on our Pricing page.',
      },
    ],
  },
  {
    pageId: 'contact',
    pageLabel: 'Contact Page',
    fields: [
      {
        key: 'contact.header.kicker',
        label: 'Page Kicker',
        defaultValue: 'Contact BossAdoly Digital Hub',
      },
      {
        key: 'contact.header.title',
        label: 'Page Heading',
        defaultValue: 'Start Your Project Directly on WhatsApp',
      },
      {
        key: 'contact.header.description',
        label: 'Page Intro',
        defaultValue:
          'We operate digitally across Nigeria, Africa, and global markets. Reach out directly via WhatsApp or email to hire us today.',
        multiline: true,
      },
      {
        key: 'contact.whatsapp.label',
        label: 'WhatsApp Card Label',
        defaultValue: 'Direct WhatsApp Line',
      },
      {
        key: 'contact.whatsapp.subtext',
        label: 'WhatsApp Card Subtext',
        defaultValue: 'Tap here to chat & hire BossAdoly instantly',
      },
      { key: 'contact.email.address', label: 'Contact Email', defaultValue: CONTACT_INFO.email },
      {
        key: 'contact.studioNote',
        label: 'Studio Availability Note',
        defaultValue:
          'Digital Studio · Designing landing pages, opt-in pages, e-commerce stores, and ad campaigns for businesses across Nigeria, Africa & worldwide.',
        multiline: true,
      },
      {
        key: 'contact.form.title',
        label: 'Quick Message Form Heading',
        defaultValue: 'Send a Quick WhatsApp Note',
      },
      {
        key: 'contact.form.description',
        label: 'Quick Message Form Subtext',
        defaultValue: `Write your message below and send it straight to ${CONTACT_INFO.whatsappDisplay}.`,
      },
    ],
  },
  {
    pageId: 'chrome',
    pageLabel: 'Header & Footer',
    fields: [
      { key: 'brand.first', label: 'Brand Name Part 1', defaultValue: 'BossAdoly' },
      { key: 'brand.second', label: 'Brand Name Part 2 (Orange)', defaultValue: 'Digital Hub' },
      { key: 'nav.cta', label: 'Top Bar Hire Button', defaultValue: 'Hire Me' },
      {
        key: 'footer.summary',
        label: 'Footer Brand Summary',
        defaultValue:
          'Helping startups, fashion brands, and growing businesses reach their right audience through Meta & TikTok advertising, AI UGC video creation, and all website designs including landing pages, opt-in pages, and e-commerce stores.',
        multiline: true,
      },
      {
        key: 'footer.connectTitle',
        label: 'Footer Social Heading',
        defaultValue: 'Connect With BossAdoly',
      },
      {
        key: 'footer.connectText',
        label: 'Footer Social Subtext',
        defaultValue: 'Follow our latest campaigns, AI UGC reels, and digital marketing insights.',
      },
      {
        key: 'footer.tagline',
        label: 'Footer Bottom Tagline',
        defaultValue:
          'Meta & TikTok Ads · AI UGC Videos · Landing Pages, Opt-In Pages & E-Commerce Websites',
      },
    ],
  },
];

export const EDITABLE_IMAGE_SLOTS: EditableImageSlot[] = [
  {
    slotKey: 'home.hero.slide1',
    pageLabel: 'Home Hero Carousel',
    label: 'Hero Carousel Slide 1',
    defaultUrl: 'https://i.ibb.co/Pz6sKsgZ/Church-photography-worship-serve-team.jpg',
  },
  {
    slotKey: 'home.hero.slide2',
    pageLabel: 'Home Hero Carousel',
    label: 'Hero Carousel Slide 2',
    defaultUrl: 'https://i.ibb.co/jPt91Ykt/Behind-the-Scenes-Film-Crew-at-Work.jpg',
  },
  {
    slotKey: 'home.hero.slide3',
    pageLabel: 'Home Hero Carousel',
    label: 'Hero Carousel Slide 3',
    defaultUrl: 'https://i.ibb.co/fGSc5DG4/Adoly-s-Telegram-Digital-Hub-Poster.png',
  },
  {
    slotKey: 'home.hero.slide4',
    pageLabel: 'Home Hero Carousel',
    label: 'Hero Carousel Slide 4',
    defaultUrl: 'https://i.ibb.co/k290wDyd/Futuristic-Digital-Analytics-Hub-Poster.png',
  },
  {
    slotKey: 'home.hero.slide5',
    pageLabel: 'Home Hero Carousel',
    label: 'Hero Carousel Slide 5',
    defaultUrl: 'https://i.ibb.co/v68xBy3L/Adoly-s-Digital-Hub-Web-Design-Poster.png',
  },
  {
    slotKey: 'home.bento.webImage',
    pageLabel: 'Home Page',
    label: 'Featured Ads & Web Card Image',
    defaultUrl: BRAND_ASSETS.webShowcase,
  },
  {
    slotKey: 'home.bento.ugcImage',
    pageLabel: 'Home Page',
    label: 'Featured AI UGC Card Image',
    defaultUrl: BRAND_ASSETS.aiUgcStudio,
  },
  {
    slotKey: 'services.ads.image',
    pageLabel: 'Services Page',
    label: '01. Meta & TikTok Ads Image',
    defaultUrl: BRAND_ASSETS.heroStudio,
  },
  {
    slotKey: 'services.ugc.image',
    pageLabel: 'Services Page',
    label: '02. AI UGC Video Creation Image',
    defaultUrl: BRAND_ASSETS.aiUgcStudio,
  },
  {
    slotKey: 'services.web.image',
    pageLabel: 'Services Page',
    label: '03. Website & Landing Page Image',
    defaultUrl: BRAND_ASSETS.webShowcase,
  },
  {
    slotKey: 'about.founder.image',
    pageLabel: 'About Us Page',
    label: 'About Us Portrait Image',
    defaultUrl: BRAND_ASSETS.founderPortrait,
  },
  {
    slotKey: 'team.adole-emmanuel.image',
    pageLabel: 'Meet Our Team Page',
    label: 'Team Member 1 (BossAdoly)',
    defaultUrl: TEAM_DATA[0].image || '',
  },
  {
    slotKey: 'team.ai-ugc-unit.image',
    pageLabel: 'Meet Our Team Page',
    label: 'Team Member 2 (AI UGC Desk)',
    defaultUrl: TEAM_DATA[1].image || '',
  },
  {
    slotKey: 'team.web-conversion-unit.image',
    pageLabel: 'Meet Our Team Page',
    label: 'Team Member 3 (Web Architecture Desk)',
    defaultUrl: TEAM_DATA[2].image || '',
  },
  {
    slotKey: 'social.facebook.icon',
    pageLabel: 'Footer Social Logos',
    label: 'Facebook Footer Logo',
    defaultUrl: '/assets/aistudio/images_cc8ace29.png',
  },
  {
    slotKey: 'social.instagram.icon',
    pageLabel: 'Footer Social Logos',
    label: 'Instagram Footer Logo',
    defaultUrl: '/assets/aistudio/images_5bcd8758.jpg',
  },
  {
    slotKey: 'social.linkedin.icon',
    pageLabel: 'Footer Social Logos',
    label: 'LinkedIn Footer Logo',
    defaultUrl: '/assets/aistudio/images__2__9c1a9d42.jpg',
  },
  {
    slotKey: 'social.x.icon',
    pageLabel: 'Footer Social Logos',
    label: 'X Footer Logo',
    defaultUrl: '/assets/aistudio/images__1__e82f6c08.png',
  },
];
