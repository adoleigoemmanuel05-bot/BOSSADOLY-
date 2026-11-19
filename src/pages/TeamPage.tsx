import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { CtaActionLink } from '../components/CtaActionLink';
import { CustomSectionsRenderer } from '../components/CustomSectionsRenderer';
import { StyledImage } from '../components/StyledImage';
import {
  getImageOverride,
  getTextColorStyle,
  getTextOverride,
} from '../data/siteEditableSchema';
import type { CustomSection, MediaItem, PageId, TeamMember } from '../types/content';
import {
  getExtraCarouselSlides,
  getGalleryImageStyle,
  getImageStyleOverride,
  type ImageSlotStyle,
} from '../utils/imageStyles';
import { buildHireWhatsAppUrl } from '../utils/whatsapp';

interface TeamPageProps {
  items: MediaItem[];
  siteText: Record<string, string>;
  siteImages: Record<string, string>;
  teamMembers: TeamMember[];
  customSections: CustomSection[];
  hiddenSections: string[];
  onNavigate?: (page: PageId, sectionId?: string) => void;
}

export function TeamPage({
  items,
  siteText,
  siteImages,
  teamMembers,
  customSections,
  hiddenSections,
  onNavigate,
}: TeamPageProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [highlightSlide, setHighlightSlide] = useState(0);

  const uploadedTeamImages = items.filter(
    (item) => item.placement === 'team' && item.type === 'image'
  );
  const pageCustomSections = customSections.filter((s) => s.pageId === 'team');
  const highlightsStyle = getGalleryImageStyle(siteText, 'team.highlights');

  useEffect(() => {
    if (highlightsStyle !== 'carousel' || uploadedTeamImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setHighlightSlide((prev) => (prev + 1) % uploadedTeamImages.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [highlightsStyle, uploadedTeamImages.length]);

  const safeHighlightIdx =
    uploadedTeamImages.length > 0 ? highlightSlide % uploadedTeamImages.length : 0;

  return (
    <div className="bg-white">
      <section className="border-b border-neutral-200 bg-neutral-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <p
            className="text-xs font-semibold text-orange-600"
            style={getTextColorStyle(siteText, 'team.header.kicker')}
          >
            {getTextOverride(siteText, 'team.header.kicker', 'Meet Our Team')}
          </p>
          <h1
            className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 max-w-3xl"
            style={{ textWrap: 'balance', ...getTextColorStyle(siteText, 'team.header.title') }}
          >
            {getTextOverride(
              siteText,
              'team.header.title',
              'Focused Talent Behind Every Ad, Reel, and Website'
            )}
          </h1>
          <p
            className="text-base text-neutral-600 max-w-2xl"
            style={getTextColorStyle(siteText, 'team.header.description')}
          >
            {getTextOverride(
              siteText,
              'team.header.description',
              'Led by Adole Emmanuel (BossAdoly), our studio combines Meta & TikTok media buying, AI UGC production, and modern web design.'
            )}
          </p>
        </div>
      </section>

      {(!hiddenSections.includes('team.members') ||
        (!hiddenSections.includes('team.highlights') && uploadedTeamImages.length > 0)) && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 space-y-12">
          {!hiddenSections.includes('team.members') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.map((member) => {
                const imgSrc = getImageOverride(
                  siteImages,
                  `team.${member.id}.image`,
                  member.image || ''
                );
                const imgStyle = getImageStyleOverride(
                  siteText,
                  `team.${member.id}.image`,
                  (member.imageStyle as ImageSlotStyle) || 'standard'
                );
                const extraSlides = getExtraCarouselSlides(
                  siteText,
                  `team.${member.id}.image`
                );
                const name = getTextOverride(siteText, `team.${member.id}.name`, member.name);
                const role = getTextOverride(siteText, `team.${member.id}.role`, member.role);
                const specialty = getTextOverride(
                  siteText,
                  `team.${member.id}.specialty`,
                  member.specialty
                );
                const bio = getTextOverride(siteText, `team.${member.id}.bio`, member.bio);
                const hasFailed = failedImages[`${member.id}:${imgSrc}`];

                return (
                  <article
                    key={member.id}
                    className="rounded-2xl border border-neutral-200 bg-white overflow-hidden flex flex-col"
                  >
                    <div className="aspect-square bg-neutral-100 overflow-hidden">
                      {imgSrc && !hasFailed ? (
                        <StyledImage
                          src={imgSrc}
                          alt={name}
                          styleMode={imgStyle}
                          extraSlides={extraSlides}
                          imgPositionClass="object-top"
                          onError={() =>
                            setFailedImages((prev) => ({
                              ...prev,
                              [`${member.id}:${imgSrc}`]: true,
                            }))
                          }
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-700 font-display text-2xl font-bold">
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        {specialty && (
                          <p
                            className="text-xs font-medium text-orange-600"
                            style={getTextColorStyle(siteText, `team.${member.id}.specialty`)}
                          >
                            {specialty}
                          </p>
                        )}
                        <h2
                          className="text-xl font-bold text-neutral-900"
                          style={getTextColorStyle(siteText, `team.${member.id}.name`)}
                        >
                          {name}
                        </h2>
                        <p
                          className="text-sm font-medium text-neutral-700"
                          style={getTextColorStyle(siteText, `team.${member.id}.role`)}
                        >
                          {role}
                        </p>
                        <p
                          className="text-sm text-neutral-600 leading-relaxed pt-1"
                          style={getTextColorStyle(siteText, `team.${member.id}.bio`)}
                        >
                          {bio}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-100">
                        <CtaActionLink
                          rawUrl={siteText[`team.${member.id}.ctaUrl`] || member.ctaUrl}
                          fallbackHref={buildHireWhatsAppUrl(`Consultation with ${name}`)}
                          onNavigate={onNavigate}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>
                            {getTextOverride(
                              siteText,
                              `team.${member.id}.ctaLabel`,
                              member.ctaLabel || 'Connect on WhatsApp'
                            )}
                          </span>
                        </CtaActionLink>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!hiddenSections.includes('team.highlights') && uploadedTeamImages.length > 0 && (
            <div className="space-y-5 pt-4 border-t border-neutral-200">
              <h2 className="text-2xl font-bold text-neutral-900">Studio Highlights</h2>

              {highlightsStyle === 'carousel' ? (
                <div className="max-w-2xl mx-auto">
                  <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                    <div className="aspect-[16/10] bg-neutral-100 overflow-hidden">
                      <img
                        src={uploadedTeamImages[safeHighlightIdx].url}
                        alt={uploadedTeamImages[safeHighlightIdx].title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-neutral-500">
                          {uploadedTeamImages[safeHighlightIdx].category}
                        </p>
                        <h3 className="text-sm font-semibold text-neutral-900 mt-0.5">
                          {uploadedTeamImages[safeHighlightIdx].title}
                        </h3>
                      </div>
                      {uploadedTeamImages.length > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setHighlightSlide(
                                (prev) =>
                                  (prev - 1 + uploadedTeamImages.length) % uploadedTeamImages.length
                              )
                            }
                            aria-label="Previous highlight"
                            className="h-8 w-8 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 flex items-center justify-center cursor-pointer"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setHighlightSlide((prev) => (prev + 1) % uploadedTeamImages.length)
                            }
                            aria-label="Next highlight"
                            className="h-8 w-8 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 flex items-center justify-center cursor-pointer"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 ${
                    highlightsStyle === 'spotlight' ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
                  } gap-6`}
                >
                  {uploadedTeamImages.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`rounded-xl border border-neutral-200 bg-white overflow-hidden ${
                        highlightsStyle === 'editorial'
                          ? 'p-3 shadow-sm hover:shadow-md transition-shadow'
                          : ''
                      } ${
                        highlightsStyle === 'spotlight' && idx === 0 ? 'sm:col-span-2' : ''
                      }`}
                    >
                      <div
                        className={`${
                          highlightsStyle === 'spotlight' && idx === 0
                            ? 'aspect-[16/9]'
                            : 'aspect-[4/3]'
                        } bg-neutral-100 overflow-hidden ${
                          highlightsStyle === 'editorial'
                            ? 'rounded-lg border border-neutral-200'
                            : ''
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className={highlightsStyle === 'editorial' ? 'pt-3 px-1' : 'p-4'}>
                        <p className="text-xs text-neutral-500">{img.category}</p>
                        <h3 className="text-sm font-semibold text-neutral-900 mt-0.5">{img.title}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
