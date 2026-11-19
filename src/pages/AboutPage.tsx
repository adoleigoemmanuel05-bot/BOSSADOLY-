import { Compass, Globe, MessageCircle, Sparkles } from 'lucide-react';
import { ABOUT_COPY, BRAND_ASSETS } from '../data/siteData';
import {
  getImageOverride,
  getTextColorStyle,
  getTextOverride,
} from '../data/siteEditableSchema';
import { CtaActionLink } from '../components/CtaActionLink';
import { CustomSectionsRenderer } from '../components/CustomSectionsRenderer';
import { StyledImage } from '../components/StyledImage';
import type { CustomSection, PageId } from '../types/content';
import { getExtraCarouselSlides, getImageStyleOverride } from '../utils/imageStyles';
import { buildHireWhatsAppUrl } from '../utils/whatsapp';

interface AboutPageProps {
  siteText: Record<string, string>;
  siteImages: Record<string, string>;
  customSections: CustomSection[];
  hiddenSections: string[];
  onNavigate: (page: PageId, sectionId?: string) => void;
}

export function AboutPage({
  siteText,
  siteImages,
  customSections,
  hiddenSections,
  onNavigate,
}: AboutPageProps) {
  const portraitUrl = getImageOverride(
    siteImages,
    'about.founder.image',
    BRAND_ASSETS.founderPortrait
  );
  const portraitStyle = getImageStyleOverride(siteText, 'about.founder.image');
  const portraitSlides = getExtraCarouselSlides(siteText, 'about.founder.image');
  const pageCustomSections = customSections.filter((s) => s.pageId === 'about');

  return (
    <div className="bg-white">
      <section className="border-b border-neutral-200 bg-neutral-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <p
            className="text-xs font-semibold text-orange-600"
            style={getTextColorStyle(siteText, 'about.header.kicker')}
          >
            {getTextOverride(siteText, 'about.header.kicker', 'About BossAdoly Digital Hub')}
          </p>
          <h1
            className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 max-w-3xl"
            style={{ textWrap: 'balance', ...getTextColorStyle(siteText, 'about.header.title') }}
          >
            {getTextOverride(siteText, 'about.header.title', ABOUT_COPY.headline)}
          </h1>
        </div>
      </section>

      {!hiddenSections.includes('about.story') && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-5">
              <div className="h-full min-h-[380px] rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100">
                <StyledImage
                  src={portraitUrl}
                  alt="Adole Emmanuel, Founder of BossAdoly Digital Hub"
                  styleMode={portraitStyle}
                  extraSlides={portraitSlides}
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-8 flex flex-col justify-center">
              <div className="space-y-2.5">
                <h2
                  className="text-2xl font-bold text-neutral-900"
                  style={getTextColorStyle(siteText, 'about.journeyTitle')}
                >
                  {getTextOverride(siteText, 'about.journeyTitle', ABOUT_COPY.journeyTitle)}
                </h2>
                <p
                  className="text-base text-neutral-600 leading-relaxed"
                  style={getTextColorStyle(siteText, 'about.journeyText')}
                >
                  {getTextOverride(siteText, 'about.journeyText', ABOUT_COPY.journeyText)}
                </p>
              </div>

              <div className="border-t border-neutral-200 pt-6 space-y-2.5">
                <h2
                  className="text-2xl font-bold text-neutral-900"
                  style={getTextColorStyle(siteText, 'about.experienceTitle')}
                >
                  {getTextOverride(siteText, 'about.experienceTitle', ABOUT_COPY.experienceTitle)}
                </h2>
                <p
                  className="text-base text-neutral-600 leading-relaxed"
                  style={getTextColorStyle(siteText, 'about.experienceText')}
                >
                  {getTextOverride(siteText, 'about.experienceText', ABOUT_COPY.experienceText)}
                </p>
              </div>

              <div className="border-t border-neutral-200 pt-6 space-y-4">
                <h2
                  className="text-2xl font-bold text-neutral-900"
                  style={getTextColorStyle(siteText, 'about.missionTitle')}
                >
                  {getTextOverride(siteText, 'about.missionTitle', ABOUT_COPY.missionTitle)}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 space-y-2">
                    <Compass className="h-5 w-5 text-orange-600" aria-hidden="true" />
                    <p
                      className="text-sm text-neutral-700 leading-relaxed"
                      style={getTextColorStyle(siteText, 'about.mission1')}
                    >
                      {getTextOverride(siteText, 'about.mission1', ABOUT_COPY.missions[0])}
                    </p>
                  </div>
                  <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-5 space-y-2">
                    <Globe className="h-5 w-5 text-orange-600" aria-hidden="true" />
                    <p
                      className="text-sm text-neutral-800 leading-relaxed"
                      style={getTextColorStyle(siteText, 'about.mission2')}
                    >
                      {getTextOverride(siteText, 'about.mission2', ABOUT_COPY.missions[1])}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <CtaActionLink
                  rawUrl={siteText['about.ctaPrimary.url']}
                  fallbackHref={buildHireWhatsAppUrl('Working With BossAdoly Digital Hub')}
                  onNavigate={onNavigate}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span style={getTextColorStyle(siteText, 'about.ctaPrimary')}>
                    {getTextOverride(siteText, 'about.ctaPrimary', 'Hire BossAdoly')}
                  </span>
                </CtaActionLink>
                <CtaActionLink
                  rawUrl={siteText['about.ctaSecondary.url']}
                  fallbackPage="services"
                  onNavigate={onNavigate}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-neutral-900 bg-yellow-300 hover:bg-yellow-400 rounded-lg transition-colors"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span style={getTextColorStyle(siteText, 'about.ctaSecondary')}>
                    {getTextOverride(siteText, 'about.ctaSecondary', 'Explore Services')}
                  </span>
                </CtaActionLink>
              </div>
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
