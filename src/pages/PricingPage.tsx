import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check, MessageCircle, Send } from 'lucide-react';
import { CtaActionLink } from '../components/CtaActionLink';
import { CustomSectionsRenderer } from '../components/CustomSectionsRenderer';
import { getTextColorStyle, getTextOverride } from '../data/siteEditableSchema';
import type { CustomSection, PageId, PricingTier, ServiceOffering } from '../types/content';
import {
  buildHireWhatsAppUrl,
  buildPricingInquiryMessage,
  buildWhatsAppUrl,
  WHATSAPP_DISPLAY,
} from '../utils/whatsapp';

interface PricingPageProps {
  siteText: Record<string, string>;
  siteImages?: Record<string, string>;
  pricingTiers: PricingTier[];
  services: ServiceOffering[];
  customSections: CustomSection[];
  hiddenSections: string[];
  onNavigate?: (page: PageId, sectionId?: string) => void;
}

const DEFAULT_FORM_SERVICE_OPTIONS = [
  { value: 'AI UGC Video', label: 'AI UGC Video' },
  { value: 'Website Design (Landing Page)', label: 'Website Design — Landing Page' },
  { value: 'Website Design (Opt-In Page)', label: 'Website Design — Opt-In Page' },
  { value: 'Website Design (E-Commerce Website)', label: 'Website Design — E-Commerce Store' },
  { value: 'Website Design (Custom Business Website)', label: 'Website Design — Custom Website' },
  { value: 'Ad Service (Meta & TikTok)', label: 'Ad Service (Meta & TikTok)' },
  { value: 'Full Service (Ads + AI UGC + Website)', label: 'Full Service (Ads + AI UGC + Website)' },
];

export function PricingPage({
  siteText,
  siteImages = {},
  pricingTiers,
  services,
  customSections,
  hiddenSections,
  onNavigate,
}: PricingPageProps) {
  const [name, setName] = useState('');
  const [service, setService] = useState('AI UGC Video');
  const [duration, setDuration] = useState('1 Month');
  const [budget, setBudget] = useState('');
  const [goal, setGoal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);

  const customServiceOptions = services
    .filter((s) => !['ads', 'ugc', 'web'].includes(s.id))
    .map((s) => ({ value: s.title, label: s.title }));

  const pageCustomSections = customSections.filter((s) => s.pageId === 'pricing');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!budget.trim()) {
      setErrorMsg('Please enter your budget.');
      return;
    }
    if (!goal.trim()) {
      setErrorMsg('Please briefly describe your goal.');
      return;
    }

    const message = buildPricingInquiryMessage({
      name: name.trim(),
      service,
      duration,
      budget: budget.trim(),
      goal: goal.trim(),
    });
    const whatsappUrl = buildWhatsAppUrl(message);
    setSubmittedUrl(whatsappUrl);

    const anchor = document.createElement('a');
    anchor.href = whatsappUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <div className="bg-white">
      <section className="border-b border-neutral-200 bg-neutral-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <p
            className="text-xs font-semibold text-orange-600"
            style={getTextColorStyle(siteText, 'pricing.header.kicker')}
          >
            {getTextOverride(siteText, 'pricing.header.kicker', 'Pricing & Custom Brief')}
          </p>
          <h1
            className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 max-w-3xl"
            style={{ textWrap: 'balance', ...getTextColorStyle(siteText, 'pricing.header.title') }}
          >
            {getTextOverride(
              siteText,
              'pricing.header.title',
              'Flexible Packages Built Around Your Goal & Budget'
            )}
          </h1>
          <p
            className="text-base text-neutral-600 max-w-2xl"
            style={getTextColorStyle(siteText, 'pricing.header.description')}
          >
            {getTextOverride(
              siteText,
              'pricing.header.description',
              'Book a single service or hire BossAdoly Digital Hub for complete end-to-end execution. Fill out the project form below and your details will drop directly on our WhatsApp.'
            )}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      {!hiddenSections.includes('pricing.tiers') && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {pricingTiers.map((tier) => {
              const tag = getTextOverride(siteText, `pricing.${tier.id}.tag`, tier.tag);
              const tierName = getTextOverride(siteText, `pricing.${tier.id}.name`, tier.name);
              const priceDisplay = getTextOverride(
                siteText,
                `pricing.${tier.id}.priceDisplay`,
                tier.priceDisplay
              );
              const billingNote = getTextOverride(
                siteText,
                `pricing.${tier.id}.billingNote`,
                tier.billingNote
              );
              const summary = getTextOverride(siteText, `pricing.${tier.id}.summary`, tier.summary);
              const featuresRaw = getTextOverride(
                siteText,
                `pricing.${tier.id}.features`,
                tier.features.join('\n')
              );
              const features = featuresRaw
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean);

              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl p-7 flex flex-col justify-between gap-6 border ${
                    tier.featured
                      ? 'border-orange-600 bg-orange-50/40'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div className="space-y-4">
                    <p
                      className={`text-xs font-semibold ${
                        tier.featured ? 'text-orange-700' : 'text-neutral-500'
                      }`}
                      style={getTextColorStyle(siteText, `pricing.${tier.id}.tag`)}
                    >
                      {tag}
                    </p>
                    <h2
                      className="text-2xl font-bold text-neutral-900"
                      style={getTextColorStyle(siteText, `pricing.${tier.id}.name`)}
                    >
                      {tierName}
                    </h2>
                    <div>
                      <p
                        className="font-display text-3xl font-bold text-neutral-900 tabular-nums"
                        style={getTextColorStyle(siteText, `pricing.${tier.id}.priceDisplay`)}
                      >
                        {priceDisplay}
                      </p>
                      {billingNote && (
                        <p
                          className="text-xs text-neutral-500 mt-1"
                          style={getTextColorStyle(siteText, `pricing.${tier.id}.billingNote`)}
                        >
                          {billingNote}
                        </p>
                      )}
                    </div>
                    <p
                      className="text-sm text-neutral-600 leading-relaxed"
                      style={getTextColorStyle(siteText, `pricing.${tier.id}.summary`)}
                    >
                      {summary}
                    </p>

                    {features.length > 0 && (
                      <ul
                        className="space-y-2.5 pt-2 border-t border-neutral-200/70 text-neutral-700"
                        style={getTextColorStyle(siteText, `pricing.${tier.id}.features`)}
                      >
                        {features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5 text-sm">
                            <Check className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <CtaActionLink
                    rawUrl={siteText[`pricing.${tier.id}.ctaUrl`] || tier.ctaUrl}
                    fallbackHref={buildHireWhatsAppUrl(tier.whatsappService || tierName)}
                    onNavigate={onNavigate}
                    className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg transition-colors ${
                      tier.featured
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-yellow-300 hover:bg-yellow-400 text-neutral-900'
                    }`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span style={getTextColorStyle(siteText, `pricing.${tier.id}.ctaLabel`)}>
                      {getTextOverride(
                        siteText,
                        `pricing.${tier.id}.ctaLabel`,
                        tier.ctaLabel || 'Hire via WhatsApp'
                      )}
                    </span>
                  </CtaActionLink>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Direct-to-WhatsApp Project & Budget Form */}
      {!hiddenSections.includes('pricing.form') && (
        <section
          id="pricing-quote-form"
          className="border-t border-neutral-200 bg-neutral-50 py-14 scroll-mt-20"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-10 space-y-6">
              <div className="space-y-2">
                <p
                  className="text-xs font-semibold text-orange-600"
                  style={getTextColorStyle(siteText, 'pricing.form.kicker')}
                >
                  {getTextOverride(siteText, 'pricing.form.kicker', 'Instant WhatsApp Brief')}
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-bold text-neutral-900"
                  style={getTextColorStyle(siteText, 'pricing.form.title')}
                >
                  {getTextOverride(
                    siteText,
                    'pricing.form.title',
                    'Tell Us What You Need — Drops Straight on WhatsApp'
                  )}
                </h2>
                <p className="text-sm text-neutral-600">
                  Complete the fields below and click Submit to send your request directly to{' '}
                  <span className="font-semibold text-neutral-900">{WHATSAPP_DISPLAY}</span>.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="client-name" className="block text-sm font-medium text-neutral-800 mb-1.5">
                    Your Name
                  </label>
                  <input
                    id="client-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chinedu Okafor / Your Brand Name"
                    className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="service-wanted" className="block text-sm font-medium text-neutral-800 mb-1.5">
                      What Do You Want?
                    </label>
                    <select
                      id="service-wanted"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {DEFAULT_FORM_SERVICE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      {customServiceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="service-duration" className="block text-sm font-medium text-neutral-800 mb-1.5">
                      How Long Do You Want Our Service?
                    </label>
                    <select
                      id="service-duration"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="One-Time Project">One-Time Project</option>
                      <option value="2 Weeks Sprint">2 Weeks Sprint</option>
                      <option value="1 Month">1 Month</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months or Ongoing">6 Months or Ongoing</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="client-budget" className="block text-sm font-medium text-neutral-800 mb-1.5">
                    What Is Your Budget?
                  </label>
                  <input
                    id="client-budget"
                    type="text"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. ₦150,000 - ₦300,000 or $300"
                    className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label htmlFor="client-goal" className="block text-sm font-medium text-neutral-800 mb-1.5">
                    What Is Your Goal?
                  </label>
                  <textarea
                    id="client-goal"
                    rows={3}
                    required
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Launch our new ready-to-wear collection and generate daily sales via Meta & TikTok ads."
                    className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {errorMsg && (
                  <p role="alert" className="text-sm font-medium text-red-600">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span style={getTextColorStyle(siteText, 'pricing.form.submitLabel')}>
                    {getTextOverride(siteText, 'pricing.form.submitLabel', 'Submit & Send to WhatsApp')}
                  </span>
                </button>
              </form>

              {submittedUrl && (
                <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 space-y-3">
                  <p className="text-sm font-semibold text-neutral-900">
                    Your brief is ready for WhatsApp!
                  </p>
                  <p className="text-xs text-neutral-700">
                    If WhatsApp did not open automatically in a new tab, click below to drop your
                    details straight into BossAdoly&apos;s WhatsApp chat:
                  </p>
                  <a
                    href={submittedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Open WhatsApp Chat ({WHATSAPP_DISPLAY})</span>
                  </a>
                </div>
              )}
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
