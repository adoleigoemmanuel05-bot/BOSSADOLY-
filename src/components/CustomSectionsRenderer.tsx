import { CheckCircle2, MessageCircle } from 'lucide-react';
import { getTextColorStyle, getTextOverride } from '../data/siteEditableSchema';
import type { CustomSection, PageId } from '../types/content';
import {
  getExtraCarouselSlides,
  getImageStyleOverride,
  type ImageSlotStyle,
} from '../utils/imageStyles';
import { buildHireWhatsAppUrl } from '../utils/whatsapp';
import { CtaActionLink } from './CtaActionLink';
import { StyledImage } from './StyledImage';

interface CustomSectionsRendererProps {
  sections: CustomSection[];
  siteText?: Record<string, string>;
  siteImages?: Record<string, string>;
  onNavigate?: (page: PageId, sectionId?: string) => void;
}

export function CustomSectionsRenderer({
  sections,
  siteText = {},
  siteImages = {},
  onNavigate,
}: CustomSectionsRendererProps) {
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => {
        const tone = section.tone || 'white';
        const isAccent = tone === 'accent';
        const isLight = tone === 'light';
        const resolvedImg = siteImages[`custom.${section.id}.image`] || section.image || '';
        const hasImage = Boolean(resolvedImg.trim());
        const imgStyle = getImageStyleOverride(
          siteText,
          `custom.${section.id}.image`,
          (section.imageStyle as ImageSlotStyle) || 'standard'
        );
        const extraSlides = getExtraCarouselSlides(siteText, `custom.${section.id}.image`);

        const kickerText = getTextOverride(
          siteText,
          `custom.${section.id}.kicker`,
          section.kicker || ''
        );
        const titleText = getTextOverride(
          siteText,
          `custom.${section.id}.title`,
          section.title
        );
        const descText = getTextOverride(
          siteText,
          `custom.${section.id}.description`,
          section.description
        );
        const bulletsRaw = getTextOverride(
          siteText,
          `custom.${section.id}.bullets`,
          section.bullets.join('\n')
        );
        const bulletItems = bulletsRaw
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        const ctaLabelText = getTextOverride(
          siteText,
          `custom.${section.id}.ctaLabel`,
          section.ctaLabel || ''
        );
        const ctaUrlResolved = siteText[`custom.${section.id}.ctaUrl`] || section.ctaUrl;

        const wrapperClasses = isAccent
          ? 'bg-orange-600 text-white'
          : isLight
          ? 'border-t border-b border-neutral-200 bg-neutral-50 text-neutral-900'
          : 'border-t border-neutral-200 bg-white text-neutral-900';

        return (
          <section key={section.id} className={`${wrapperClasses} py-14`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div
                className={
                  hasImage
                    ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-center'
                    : 'max-w-4xl space-y-5'
                }
              >
                {hasImage && (
                  <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-neutral-200/40 bg-neutral-100 aspect-[16/10]">
                    <StyledImage
                      src={resolvedImg}
                      alt={titleText}
                      styleMode={imgStyle}
                      extraSlides={extraSlides}
                    />
                  </div>
                )}

                <div className={hasImage ? 'lg:col-span-7 space-y-4' : 'space-y-4'}>
                  {kickerText && (
                    <p
                      className={`text-xs font-semibold ${
                        isAccent ? 'text-yellow-200' : 'text-orange-600'
                      }`}
                      style={getTextColorStyle(siteText, `custom.${section.id}.kicker`)}
                    >
                      {kickerText}
                    </p>
                  )}

                  <h2
                    className={`font-display text-2xl sm:text-3xl font-bold tracking-tight ${
                      isAccent ? 'text-white' : 'text-neutral-900'
                    }`}
                    style={getTextColorStyle(siteText, `custom.${section.id}.title`)}
                  >
                    {titleText}
                  </h2>

                  {descText && (
                    <p
                      className={`text-sm sm:text-base leading-relaxed ${
                        isAccent ? 'text-orange-50' : 'text-neutral-600'
                      }`}
                      style={getTextColorStyle(siteText, `custom.${section.id}.description`)}
                    >
                      {descText}
                    </p>
                  )}

                  {bulletItems.length > 0 && (
                    <ul
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 ${
                        isAccent ? 'text-white' : 'text-neutral-700'
                      }`}
                      style={getTextColorStyle(siteText, `custom.${section.id}.bullets`)}
                    >
                      {bulletItems.map((bullet, idx) => (
                        <li
                          key={`${section.id}-b-${idx}`}
                          className="flex items-start gap-2.5 text-sm"
                        >
                          <CheckCircle2
                            className={`h-4 w-4 mt-0.5 shrink-0 ${
                              isAccent ? 'text-yellow-300' : 'text-orange-600'
                            }`}
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {ctaLabelText.trim() && (
                    <div className="pt-2">
                      <CtaActionLink
                        rawUrl={ctaUrlResolved}
                        fallbackHref={buildHireWhatsAppUrl(titleText)}
                        onNavigate={onNavigate}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                          isAccent
                            ? 'bg-yellow-300 hover:bg-yellow-400 text-neutral-900'
                            : 'bg-orange-600 hover:bg-orange-700 text-white'
                        }`}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span style={getTextColorStyle(siteText, `custom.${section.id}.ctaLabel`)}>
                          {ctaLabelText}
                        </span>
                      </CtaActionLink>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
