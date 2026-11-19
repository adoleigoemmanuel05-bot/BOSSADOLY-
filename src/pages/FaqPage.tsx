import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { CtaActionLink } from '../components/CtaActionLink';
import { CustomSectionsRenderer } from '../components/CustomSectionsRenderer';
import { getTextColorStyle, getTextOverride } from '../data/siteEditableSchema';
import type { CustomSection, FaqEntry, PageId } from '../types/content';
import { buildHireWhatsAppUrl } from '../utils/whatsapp';

interface FaqPageProps {
  siteText: Record<string, string>;
  siteImages?: Record<string, string>;
  faqs: FaqEntry[];
  customSections: CustomSection[];
  hiddenSections: string[];
  onNavigate: (page: PageId, sectionId?: string) => void;
}

export function FaqPage({
  siteText,
  siteImages = {},
  faqs,
  customSections,
  hiddenSections,
  onNavigate,
}: FaqPageProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const pageCustomSections = customSections.filter((s) => s.pageId === 'faq');

  return (
    <div className="bg-white">
      <section className="border-b border-neutral-200 bg-neutral-50 py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
          <p
            className="text-xs font-semibold text-orange-600"
            style={getTextColorStyle(siteText, 'faq.header.kicker')}
          >
            {getTextOverride(siteText, 'faq.header.kicker', 'Frequently Asked Questions')}
          </p>
          <h1
            className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900"
            style={{ textWrap: 'balance', ...getTextColorStyle(siteText, 'faq.header.title') }}
          >
            {getTextOverride(siteText, 'faq.header.title', 'Clear Answers Before You Hire Us')}
          </h1>
          <p
            className="text-base text-neutral-600"
            style={getTextColorStyle(siteText, 'faq.header.description')}
          >
            {getTextOverride(
              siteText,
              'faq.header.description',
              'Everything you need to know about booking single services, full Meta & TikTok ad setups, AI UGC videos, and landing pages, opt-in pages, or e-commerce websites.'
            )}
          </p>
        </div>
      </section>

      {(!hiddenSections.includes('faq.list') || !hiddenSections.includes('faq.cta')) && (
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-4">
          {!hiddenSections.includes('faq.list') &&
            faqs.map((item, idx) => {
              const isOpen = openIndex === idx;
              const question = getTextOverride(siteText, `faq.${idx}.question`, item.question);
              const answer = getTextOverride(siteText, `faq.${idx}.answer`, item.answer);
              return (
                <div
                  key={item.id || `${item.question}-${idx}`}
                  className="rounded-xl border border-neutral-200 bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <span
                      className="font-display text-base sm:text-lg font-semibold text-neutral-900"
                      style={getTextColorStyle(siteText, `faq.${idx}.question`)}
                    >
                      {question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-orange-600 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div
                      className="px-6 pb-5 pt-1 text-sm sm:text-base text-neutral-600 leading-relaxed border-t border-neutral-100"
                      style={getTextColorStyle(siteText, `faq.${idx}.answer`)}
                    >
                      {answer}
                    </div>
                  )}
                </div>
              );
            })}

          {!hiddenSections.includes('faq.cta') && (
            <div className="mt-10 rounded-2xl border border-yellow-300 bg-yellow-50 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <h2
                  className="text-xl font-bold text-neutral-900"
                  style={getTextColorStyle(siteText, 'faq.cta.title')}
                >
                  {getTextOverride(siteText, 'faq.cta.title', 'Still Have a Question?')}
                </h2>
                <p
                  className="text-sm text-neutral-700"
                  style={getTextColorStyle(siteText, 'faq.cta.description')}
                >
                  {getTextOverride(
                    siteText,
                    'faq.cta.description',
                    'Send a quick message on WhatsApp or fill out a project brief on our Pricing page.'
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <CtaActionLink
                  rawUrl={siteText['faq.cta.primary.url']}
                  fallbackHref={buildHireWhatsAppUrl('Question about BossAdoly services')}
                  onNavigate={onNavigate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{getTextOverride(siteText, 'faq.cta.primary', 'Ask on WhatsApp')}</span>
                </CtaActionLink>
                <CtaActionLink
                  rawUrl={siteText['faq.cta.secondary.url']}
                  fallbackPage="pricing"
                  onNavigate={onNavigate}
                  className="px-4 py-2.5 text-sm font-semibold text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  {getTextOverride(siteText, 'faq.cta.secondary', 'Go to Pricing')}
                </CtaActionLink>
              </div>
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
