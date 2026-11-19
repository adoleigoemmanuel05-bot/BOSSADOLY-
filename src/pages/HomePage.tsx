import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { BRAND_ASSETS, SERVICES_DATA } from '../data/siteData';
import {
  getImageOverride,
  getTextColorStyle,
  getTextOverride,
} from '../data/siteEditableSchema';
import { CtaActionLink } from '../components/CtaActionLink';
import { CustomSectionsRenderer } from '../components/CustomSectionsRenderer';
import { MediaShowcaseGrid } from '../components/MediaShowcaseGrid';
import { StyledImage } from '../components/StyledImage';
import type { CustomSection, HeroAppearance, MediaItem, PageId } from '../types/content';
import {
  getExtraCarouselSlides,
  getGalleryImageStyle,
  getHeroImageStyle,
  getImageStyleOverride,
} from '../utils/imageStyles';
import { buildHireWhatsAppUrl } from '../utils/whatsapp';

interface HomePageProps {
  items: MediaItem[];
  siteText: Record<string, string>;
  siteImages: Record<string, string>;
  heroAppearance: HeroAppearance;
  customSections: CustomSection[];
  hiddenSections: string[];
  onNavigate: (page: PageId, sectionId?: string) => void;
}

const DEFAULT_HERO_SLIDES = [
  {
    slotKey: 'home.hero.slide1',
    src: 'https://i.ibb.co/Pz6sKsgZ/Church-photography-worship-serve-team.jpg',
    alt: 'Church photography worship serve team',
  },
  {
    slotKey: 'home.hero.slide2',
    src: 'https://i.ibb.co/jPt91Ykt/Behind-the-Scenes-Film-Crew-at-Work.jpg',
    alt: 'Behind the Scenes Film Crew at Work',
  },
  {
    slotKey: 'home.hero.slide3',
    src: 'https://i.ibb.co/fGSc5DG4/Adoly-s-Telegram-Digital-Hub-Poster.png',
    alt: "Adoly's Telegram Digital Hub Poster",
  },
  {
    slotKey: 'home.hero.slide4',
    src: 'https://i.ibb.co/k290wDyd/Futuristic-Digital-Analytics-Hub-Poster.png',
    alt: 'Futuristic Digital Analytics Hub Poster',
  },
  {
    slotKey: 'home.hero.slide5',
    src: 'https://i.ibb.co/v68xBy3L/Adoly-s-Digital-Hub-Web-Design-Poster.png',
    alt: "Adoly's Digital Hub Web Design Poster",
  },
];

export function HomePage({
  items,
  siteText,
  siteImages,
  heroAppearance,
  customSections,
  hiddenSections,
  onNavigate,
}: HomePageProps) {
  const pageCustomSections = customSections.filter((s) => s.pageId === 'home');
  const uploadedHeroes = items
    .filter((item) => item.placement === 'hero' && item.type === 'image')
    .map((item) => ({ src: item.url, alt: item.title }));

  const resolvedDefaultSlides = DEFAULT_HERO_SLIDES.map((s) => ({
    src: getImageOverride(siteImages, s.slotKey, s.src),
    alt: s.alt,
  }));

  const heroSlides =
    uploadedHeroes.length > 0
      ? [...uploadedHeroes, ...resolvedDefaultSlides]
      : resolvedDefaultSlides;

  const heroImageStyle = getHeroImageStyle(siteText);
  const showcaseStyle = getGalleryImageStyle(siteText, 'home.showcase');

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (
      heroSlides.length <= 1 ||
      heroImageStyle === 'static' ||
      heroImageStyle === 'grid'
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [heroSlides.length, heroImageStyle]);

  const currentIndex = activeSlide % heroSlides.length;

  const bentoWebImg = getImageOverride(
    siteImages,
    'home.bento.webImage',
    BRAND_ASSETS.webShowcase
  );
  const bentoUgcImg = getImageOverride(
    siteImages,
    'home.bento.ugcImage',
    BRAND_ASSETS.aiUgcStudio
  );

  const isDarkHero = heroAppearance.tone === 'dark';
  const overlayRgb = isDarkHero ? '10, 10, 10' : '255, 255, 255';
  const strongAlpha = Math.min(0.95, Math.max(0, heroAppearance.overlayOpacity / 100));
  const midAlpha = Math.min(0.9, Math.max(0, (heroAppearance.overlayOpacity * 0.68) / 100));

  return (
    <div className="bg-white">
      {/* Hero Section with Admin-Controlled Carousel/Grid/Static Image Style & Fade/Brightness */}
      {!hiddenSections.includes('home.hero') && (
        <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-100">
          {/* Background Image Layer */}
          <div className="absolute inset-0" aria-hidden="true">
            {heroImageStyle === 'grid' ? (
              <div className="w-full h-full grid grid-cols-2 sm:grid-cols-3 gap-1">
                {heroSlides.slice(0, 6).map((slide, index) => (
                  <img
                    key={`grid-${slide.src}-${index}`}
                    src={slide.src}
                    alt={slide.alt}
                    referrerPolicy="no-referrer"
                    style={{ filter: `brightness(${heroAppearance.brightness}%)` }}
                    className="w-full h-full object-cover object-center"
                  />
                ))}
              </div>
            ) : heroImageStyle === 'static' ? (
              <img
                src={heroSlides[0]?.src}
                alt={heroSlides[0]?.alt || 'BossAdoly Digital Hub'}
                referrerPolicy="no-referrer"
                style={{ filter: `brightness(${heroAppearance.brightness}%)` }}
                className="w-full h-full object-cover object-center"
              />
            ) : heroImageStyle === 'carousel-slide' ? (
              <div
                className="flex h-full transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {heroSlides.map((slide, index) => (
                  <img
                    key={`slide-${slide.src}-${index}`}
                    src={slide.src}
                    alt={slide.alt}
                    referrerPolicy="no-referrer"
                    style={{ filter: `brightness(${heroAppearance.brightness}%)` }}
                    className="w-full h-full object-cover object-center shrink-0"
                  />
                ))}
              </div>
            ) : (
              heroSlides.map((slide, index) => (
                <img
                  key={`${slide.src}-${index}`}
                  src={slide.src}
                  alt={slide.alt}
                  referrerPolicy="no-referrer"
                  style={{ filter: `brightness(${heroAppearance.brightness}%)` }}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 ${
                    index === currentIndex
                      ? heroImageStyle === 'carousel-zoom'
                        ? 'opacity-100 scale-105'
                        : 'opacity-100 scale-100'
                      : 'opacity-0 scale-100'
                  }`}
                />
              ))
            )}

            {/* Directional Fade controlled from Admin Dashboard */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, rgba(${overlayRgb}, ${strongAlpha}) 0%, rgba(${overlayRgb}, ${midAlpha}) 48%, rgba(${overlayRgb}, 0) 100%)`,
              }}
            />
          </div>

          {/* Hero Foreground Content */}
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-24">
            <div className="max-w-xl space-y-6">
              <p
                className={`text-xs font-semibold tracking-wide ${
                  isDarkHero ? 'text-yellow-300' : 'text-orange-700'
                }`}
                style={getTextColorStyle(siteText, 'home.hero.eyebrow')}
              >
                {getTextOverride(
                  siteText,
                  'home.hero.eyebrow',
                  'Meta & TikTok Ads · AI UGC Videos · Landing Pages, Opt-In & E-Commerce Websites'
                )}
              </p>

              <h1
                className={`font-display font-bold tracking-tight leading-[1.08] ${
                  isDarkHero ? 'text-white' : 'text-neutral-900'
                }`}
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.65rem)',
                  textWrap: 'balance',
                  ...getTextColorStyle(siteText, 'home.hero.title'),
                }}
              >
                {getTextOverride(
                  siteText,
                  'home.hero.title',
                  'Turn Attention Into Paying Customers With Confidence'
                )}
              </h1>

              <p
                className={`text-base sm:text-lg leading-relaxed ${
                  isDarkHero ? 'text-neutral-200' : 'text-neutral-700'
                }`}
                style={getTextColorStyle(siteText, 'home.hero.description')}
              >
                {getTextOverride(
                  siteText,
                  'home.hero.description',
                  'BossAdoly Digital Hub designs all types of websites—landing pages, opt-in pages, and e-commerce stores—produces scroll-stopping AI UGC videos, and runs complete Meta & TikTok ad setups. Hire us for one focused service or the full growth engine.'
                )}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <CtaActionLink
                  rawUrl={siteText['home.hero.ctaPrimary.url']}
                  fallbackHref={buildHireWhatsAppUrl('Full Growth Setup or Single Service')}
                  onNavigate={onNavigate}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span style={getTextColorStyle(siteText, 'home.hero.ctaPrimary')}>
                    {getTextOverride(siteText, 'home.hero.ctaPrimary', 'Hire Me on WhatsApp')}
                  </span>
                </CtaActionLink>

                <CtaActionLink
                  rawUrl={siteText['home.hero.ctaSecondary.url']}
                  fallbackPage="pricing"
                  fallbackSectionId="pricing-quote-form"
                  onNavigate={onNavigate}
                  className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-neutral-900 bg-yellow-300 hover:bg-yellow-400 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                  <span style={getTextColorStyle(siteText, 'home.hero.ctaSecondary')}>
                    {getTextOverride(siteText, 'home.hero.ctaSecondary', 'Build Custom Quote')}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </CtaActionLink>
              </div>
            </div>
          </div>

          {/* Carousel Slide Indicators */}
          {heroImageStyle !== 'static' && heroImageStyle !== 'grid' && heroSlides.length > 1 && (
            <div className="relative z-10 lg:absolute lg:bottom-6 lg:right-8 px-4 pb-5 lg:p-0 flex items-center justify-end gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={`dot-${slide.src}-${index}`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show slide ${index + 1}: ${slide.alt}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    index === currentIndex
                      ? 'w-7 bg-orange-600'
                      : 'w-2.5 bg-neutral-900/35 hover:bg-neutral-900/60'
                  }`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Full-Width 4-Column Proof Strip */}
      {!hiddenSections.includes('home.stats') && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 border border-neutral-200 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 bg-neutral-50">
            <div className="p-6">
              <p
                className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 tabular-nums"
                style={getTextColorStyle(siteText, 'home.stats.1.value')}
              >
                {getTextOverride(siteText, 'home.stats.1.value', '3+ Years')}
              </p>
              <p
                className="mt-1 text-sm text-neutral-600"
                style={getTextColorStyle(siteText, 'home.stats.1.label')}
              >
                {getTextOverride(siteText, 'home.stats.1.label', 'Digital & Lagos Program Mastery')}
              </p>
            </div>
            <div className="p-6">
              <p
                className="font-display text-2xl sm:text-3xl font-bold text-orange-600 tabular-nums"
                style={getTextColorStyle(siteText, 'home.stats.2.value')}
              >
                {getTextOverride(siteText, 'home.stats.2.value', 'Meta & TikTok')}
              </p>
              <p
                className="mt-1 text-sm text-neutral-600"
                style={getTextColorStyle(siteText, 'home.stats.2.label')}
              >
                {getTextOverride(siteText, 'home.stats.2.label', 'Complete Ad Funnel Execution')}
              </p>
            </div>
            <div className="p-6">
              <p
                className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 tabular-nums"
                style={getTextColorStyle(siteText, 'home.stats.3.value')}
              >
                {getTextOverride(siteText, 'home.stats.3.value', 'AI UGC Video')}
              </p>
              <p
                className="mt-1 text-sm text-neutral-600"
                style={getTextColorStyle(siteText, 'home.stats.3.label')}
              >
                {getTextOverride(siteText, 'home.stats.3.label', 'Creator-Style Ad Reels That Sell')}
              </p>
            </div>
            <div className="p-6">
              <p
                className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 tabular-nums"
                style={getTextColorStyle(siteText, 'home.stats.4.value')}
              >
                {getTextOverride(siteText, 'home.stats.4.value', 'Single / Full')}
              </p>
              <p
                className="mt-1 text-sm text-neutral-600"
                style={getTextColorStyle(siteText, 'home.stats.4.label')}
              >
                {getTextOverride(siteText, 'home.stats.4.label', 'Book One Service or Everything')}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Core Capabilities Asymmetric Bento */}
      {!hiddenSections.includes('home.services') && (
        <section className="border-t border-neutral-200 bg-neutral-50/70 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p
                  className="text-xs font-semibold text-orange-600"
                  style={getTextColorStyle(siteText, 'home.services.kicker')}
                >
                  {getTextOverride(siteText, 'home.services.kicker', 'What We Deliver')}
                </p>
                <h2
                  className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900"
                  style={getTextColorStyle(siteText, 'home.services.title')}
                >
                  {getTextOverride(
                    siteText,
                    'home.services.title',
                    'Choose One Service or the Full Growth Setup'
                  )}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 cursor-pointer whitespace-nowrap"
              >
                <span>View All Services</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Marquee Service 01 */}
              <div className="lg:col-span-7 rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col">
                <div className="aspect-[16/9] bg-neutral-100 overflow-hidden">
                  <StyledImage
                    src={bentoWebImg}
                    alt="Modern landing page, opt-in page, and e-commerce website design"
                    styleMode={getImageStyleOverride(siteText, 'home.bento.webImage')}
                    extraSlides={getExtraCarouselSlides(siteText, 'home.bento.webImage')}
                  />
                </div>
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-neutral-500">
                      01 · {SERVICES_DATA[0].modeLabel} & 03 · {SERVICES_DATA[2].modeLabel}
                    </p>
                    <h3
                      className="text-2xl font-bold text-neutral-900"
                      style={getTextColorStyle(siteText, 'home.bento.left.title')}
                    >
                      {getTextOverride(
                        siteText,
                        'home.bento.left.title',
                        'Meta & TikTok Ads + Landing, Opt-In & E-Commerce Websites'
                      )}
                    </h3>
                    <p
                      className="text-sm sm:text-base text-neutral-600 leading-relaxed"
                      style={getTextColorStyle(siteText, 'home.bento.left.description')}
                    >
                      {getTextOverride(
                        siteText,
                        'home.bento.left.description',
                        'From lead-capture opt-in pages and sleek landing pages to full e-commerce storefronts and Pixel-tracked ad campaigns—we connect every click straight to your WhatsApp or checkout.'
                      )}
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {SERVICES_DATA[0].deliverables.slice(0, 2).map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-neutral-700">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                      {SERVICES_DATA[2].deliverables.slice(0, 2).map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-neutral-700">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100">
                    <CtaActionLink
                      rawUrl={siteText['home.bento.left.cta.url']}
                      fallbackHref={buildHireWhatsAppUrl('Meta & TikTok Ads or Website Design')}
                      onNavigate={onNavigate}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span style={getTextColorStyle(siteText, 'home.bento.left.cta')}>
                        {getTextOverride(siteText, 'home.bento.left.cta', 'Hire for Ads or Web')}
                      </span>
                    </CtaActionLink>
                    <CtaActionLink
                      rawUrl={siteText['home.bento.left.ctaSecondary.url']}
                      fallbackPage="services"
                      onNavigate={onNavigate}
                      className="px-4 py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900"
                    >
                      <span style={getTextColorStyle(siteText, 'home.bento.left.ctaSecondary')}>
                        {getTextOverride(siteText, 'home.bento.left.ctaSecondary', 'Explore Deliverables')}
                      </span>
                    </CtaActionLink>
                  </div>
                </div>
              </div>

              {/* Marquee Service 02: AI UGC */}
              <div className="lg:col-span-5 rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col">
                <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
                  <StyledImage
                    src={bentoUgcImg}
                    alt="Creator filming AI UGC video content in studio"
                    styleMode={getImageStyleOverride(siteText, 'home.bento.ugcImage')}
                    extraSlides={getExtraCarouselSlides(siteText, 'home.bento.ugcImage')}
                  />
                </div>
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-neutral-500">
                      02 · {SERVICES_DATA[1].modeLabel}
                    </p>
                    <h3
                      className="text-2xl font-bold text-neutral-900"
                      style={getTextColorStyle(siteText, 'home.bento.right.title')}
                    >
                      {getTextOverride(siteText, 'home.bento.right.title', SERVICES_DATA[1].title)}
                    </h3>
                    <p
                      className="text-sm sm:text-base text-neutral-600 leading-relaxed"
                      style={getTextColorStyle(siteText, 'home.bento.right.description')}
                    >
                      {getTextOverride(
                        siteText,
                        'home.bento.right.description',
                        SERVICES_DATA[1].description
                      )}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100">
                    <CtaActionLink
                      rawUrl={siteText['home.bento.right.cta.url']}
                      fallbackHref={buildHireWhatsAppUrl('AI UGC Video Creation')}
                      onNavigate={onNavigate}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-neutral-900 bg-yellow-300 hover:bg-yellow-400 rounded-lg transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span style={getTextColorStyle(siteText, 'home.bento.right.cta')}>
                        {getTextOverride(siteText, 'home.bento.right.cta', 'Book AI UGC Videos')}
                      </span>
                    </CtaActionLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Admin-Managed Reels & Gallery Showcase */}
      {!hiddenSections.includes('home.showcase') && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <MediaShowcaseGrid items={items} galleryStyle={showcaseStyle} />
        </section>
      )}

      {/* Conversion Banner */}
      {!hiddenSections.includes('home.banner') && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="rounded-2xl bg-orange-600 text-white p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-2 max-w-2xl">
              <p
                className="text-xs font-semibold text-yellow-200"
                style={getTextColorStyle(siteText, 'home.banner.kicker')}
              >
                {getTextOverride(siteText, 'home.banner.kicker', 'Ready When You Are')}
              </p>
              <h2
                className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={getTextColorStyle(siteText, 'home.banner.title')}
              >
                {getTextOverride(
                  siteText,
                  'home.banner.title',
                  'Need Ads, AI UGC Videos, or a Modern Website This Week?'
                )}
              </h2>
              <p
                className="text-sm sm:text-base text-orange-100"
                style={getTextColorStyle(siteText, 'home.banner.description')}
              >
                {getTextOverride(
                  siteText,
                  'home.banner.description',
                  'Send your goals and budget on our Pricing page or message BossAdoly directly on WhatsApp for a fast response.'
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <CtaActionLink
                rawUrl={siteText['home.banner.ctaPrimary.url']}
                fallbackPage="pricing"
                onNavigate={onNavigate}
                className="px-5 py-3 text-sm font-semibold text-neutral-900 bg-yellow-300 hover:bg-yellow-400 rounded-lg transition-colors whitespace-nowrap"
              >
                <span style={getTextColorStyle(siteText, 'home.banner.ctaPrimary')}>
                  {getTextOverride(siteText, 'home.banner.ctaPrimary', 'Fill Project Brief')}
                </span>
              </CtaActionLink>
              <CtaActionLink
                rawUrl={siteText['home.banner.ctaSecondary.url']}
                fallbackHref={buildHireWhatsAppUrl()}
                onNavigate={onNavigate}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4" />
                <span style={getTextColorStyle(siteText, 'home.banner.ctaSecondary')}>
                  {getTextOverride(siteText, 'home.banner.ctaSecondary', 'Chat on WhatsApp')}
                </span>
              </CtaActionLink>
            </div>
          </div>
        </section>
      )}

      <CustomSectionsRenderer
        sections={pageCustomSections}
        siteText={siteText}
        siteImages={siteImages}
        onNavigate={onNavigate}
      />
    </div>
  );
}
