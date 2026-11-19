import { CheckCircle2, MessageCircle } from 'lucide-react';
import { CtaActionLink } from '../components/CtaActionLink';
import { CustomSectionsRenderer } from '../components/CustomSectionsRenderer';
import { MediaShowcaseGrid } from '../components/MediaShowcaseGrid';
import { StyledImage } from '../components/StyledImage';
import { BRAND_ASSETS } from '../data/siteData';
import {
  getImageOverride,
  getTextColorStyle,
  getTextOverride,
} from '../data/siteEditableSchema';
import type { CustomSection, MediaItem, PageId, ServiceOffering } from '../types/content';
import {
  getExtraCarouselSlides,
  getGalleryImageStyle,
  getImageStyleOverride,
  type ImageSlotStyle,
} from '../utils/imageStyles';
import { buildHireWhatsAppUrl } from '../utils/whatsapp';

interface ServicesPageProps {
  items: MediaItem[];
  siteText: Record<string, string>;
  siteImages: Record<string, string>;
  services: ServiceOffering[];
  customSections: CustomSection[];
  hiddenSections: string[];
  onNavigate: (page: PageId, sectionId?: string) => void;
}

export function ServicesPage({
  items,
  siteText,
  siteImages,
  services,
  customSections,
  hiddenSections,
  onNavigate,
}: ServicesPageProps) {
  const defaultImages: Record<string, string> = {
    ads: BRAND_ASSETS.heroStudio,
    ugc: BRAND_ASSETS.aiUgcStudio,
    web: BRAND_ASSETS.webShowcase,
  };
  const pageCustomSections = customSections.filter((s) => s.pageId === 'services');
  const showcaseStyle = getGalleryImageStyle(siteText, 'home.showcase');

  return (
    <div className="bg-white">
      <section className="border-b border-neutral-200 bg-neutral-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <p
            className="text-xs font-semibold text-orange-600"
            style={getTextColorStyle(siteText, 'services.header.kicker')}
          >
            {getTextOverride(
              siteText,
              'services.header.kicker',
              'Services · Full Suite or Single Option'
            )}
          </p>
          <h1
            className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 max-w-3xl"
            style={{ textWrap: 'balance', ...getTextColorStyle(siteText, 'services.header.title') }}
          >
            {getTextOverride(
              siteText,
              'services.header.title',
              'Complete Digital Execution or One Targeted Service'
            )}
          </h1>
          <p
            className="text-base text-neutral-600 max-w-2xl leading-relaxed"
            style={getTextColorStyle(siteText, 'services.header.description')}
          >
            {getTextOverride(
              siteText,
              'services.header.description',
              'Whether you want us to handle your entire Meta & TikTok ads pipeline, create AI UGC video reels, or design any website—landing pages, opt-in pages, or e-commerce stores—you choose the exact scope your business needs.'
            )}
          </p>
        </div>
      </section>

      {!hiddenSections.includes('services.list') && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 space-y-12">
          {services.map((service, index) => {
            const isReversed = index % 2 === 1;
            const imgSrc = getImageOverride(
              siteImages,
              `services.${service.id}.image`,
              service.image || defaultImages[service.id] || BRAND_ASSETS.webShowcase
            );
            const imgStyle = getImageStyleOverride(
              siteText,
              `services.${service.id}.image`,
              (service.imageStyle as ImageSlotStyle) || 'standard'
            );
            const extraSlides = getExtraCarouselSlides(
              siteText,
              `services.${service.id}.image`
            );
            const title = getTextOverride(
              siteText,
              `services.${service.id}.title`,
              service.title
            );
            const subtitle = getTextOverride(
              siteText,
              `services.${service.id}.subtitle`,
              service.subtitle
            );
            const description = getTextOverride(
              siteText,
              `services.${service.id}.description`,
              service.description
            );
            const modeLabel = getTextOverride(
              siteText,
              `services.${service.id}.modeLabel`,
              service.modeLabel
            );
            const deliverablesRaw = getTextOverride(
              siteText,
              `services.${service.id}.deliverables`,
              service.deliverables.join('\n')
            );
            const deliverables = deliverablesRaw
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean);

            return (
              <article
                key={service.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-2xl border border-neutral-200 bg-white overflow-hidden"
              >
                <div
                  className={`lg:col-span-5 bg-neutral-100 min-h-[260px] overflow-hidden ${
                    isReversed ? 'lg:order-2' : ''
                  }`}
                >
                  <StyledImage
                    src={imgSrc}
                    alt={title}
                    styleMode={imgStyle}
                    extraSlides={extraSlides}
                  />
                </div>

                <div
                  className={`lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between gap-6 ${
                    isReversed ? 'lg:order-1' : ''
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-orange-600">
                      <span>{String(index + 1).padStart(2, '0')}.</span>
                      <span style={getTextColorStyle(siteText, `services.${service.id}.modeLabel`)}>
                        {modeLabel}
                      </span>
                    </div>
                    <h2
                      className="text-2xl sm:text-3xl font-bold text-neutral-900"
                      style={getTextColorStyle(siteText, `services.${service.id}.title`)}
                    >
                      {title}
                    </h2>
                    {subtitle && (
                      <p
                        className="text-sm font-medium text-neutral-700"
                        style={getTextColorStyle(siteText, `services.${service.id}.subtitle`)}
                      >
                        {subtitle}
                      </p>
                    )}
                    <p
                      className="text-sm sm:text-base text-neutral-600 leading-relaxed"
                      style={getTextColorStyle(siteText, `services.${service.id}.description`)}
                    >
                      {description}
                    </p>

                    {deliverables.length > 0 && (
                      <ul
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-neutral-700"
                        style={getTextColorStyle(siteText, `services.${service.id}.deliverables`)}
                      >
                        {deliverables.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-neutral-100">
                    <CtaActionLink
                      rawUrl={siteText[`services.${service.id}.ctaUrl`] || service.ctaUrl}
                      fallbackHref={buildHireWhatsAppUrl(service.whatsappIntent || title)}
                      onNavigate={onNavigate}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>
                        {getTextOverride(
                          siteText,
                          `services.${service.id}.ctaLabel`,
                          service.ctaLabel || `Hire for ${title.split(' ')[0]}`
                        )}
                      </span>
                    </CtaActionLink>
                    <CtaActionLink
                      rawUrl={
                        siteText[`services.${service.id}.secondaryCtaUrl`] ||
                        service.secondaryCtaUrl
                      }
                      fallbackPage="pricing"
                      onNavigate={onNavigate}
                      className="px-4 py-2.5 text-sm font-semibold text-neutral-900 bg-yellow-300 hover:bg-yellow-400 rounded-lg transition-colors"
                    >
                      {getTextOverride(
                        siteText,
                        `services.${service.id}.secondaryCtaLabel`,
                        service.secondaryCtaLabel || 'Request Custom Pricing'
                      )}
                    </CtaActionLink>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {!hiddenSections.includes('services.showcase') && (
        <section className="border-t border-neutral-200 bg-neutral-50/70 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <MediaShowcaseGrid items={items} galleryStyle={showcaseStyle} />
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
