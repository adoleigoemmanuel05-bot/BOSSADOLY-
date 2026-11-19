import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mail, Send } from 'lucide-react';
import { CtaActionLink } from '../components/CtaActionLink';
import { CustomSectionsRenderer } from '../components/CustomSectionsRenderer';
import { CONTACT_INFO, SOCIAL_LINKS } from '../data/siteData';
import { getTextColorStyle, getTextOverride } from '../data/siteEditableSchema';
import type { CustomSection, PageId } from '../types/content';
import { buildWhatsAppUrl, WHATSAPP_DISPLAY } from '../utils/whatsapp';

interface ContactPageProps {
  siteText: Record<string, string>;
  siteImages?: Record<string, string>;
  customSections: CustomSection[];
  hiddenSections: string[];
  onNavigate?: (page: PageId, sectionId?: string) => void;
}

export function ContactPage({
  siteText,
  siteImages = {},
  customSections,
  hiddenSections,
  onNavigate,
}: ContactPageProps) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const pageCustomSections = customSections.filter((s) => s.pageId === 'contact');

  const emailAddress = getTextOverride(siteText, 'contact.email.address', CONTACT_INFO.email);

  const handleQuickSend = (e: FormEvent) => {
    e.preventDefault();
    const formatted = `Hello BossAdoly Digital Hub!\nName: ${
      name.trim() || 'Prospective Client'
    }\nMessage: ${message.trim() || 'I would like to discuss hiring your services.'}`;
    const url = buildWhatsAppUrl(formatted);
    setGeneratedLink(url);

    const anchor = document.createElement('a');
    anchor.href = url;
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
            style={getTextColorStyle(siteText, 'contact.header.kicker')}
          >
            {getTextOverride(siteText, 'contact.header.kicker', 'Contact BossAdoly Digital Hub')}
          </p>
          <h1
            className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 max-w-3xl"
            style={{ textWrap: 'balance', ...getTextColorStyle(siteText, 'contact.header.title') }}
          >
            {getTextOverride(
              siteText,
              'contact.header.title',
              'Start Your Project Directly on WhatsApp'
            )}
          </h1>
          <p
            className="text-base text-neutral-600 max-w-2xl"
            style={getTextColorStyle(siteText, 'contact.header.description')}
          >
            {getTextOverride(
              siteText,
              'contact.header.description',
              'We operate digitally across Nigeria, Africa, and global markets. Reach out directly via WhatsApp or email to hire us today.'
            )}
          </p>
        </div>
      </section>

      {!hiddenSections.includes('contact.details') && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Contact Channels — No Street Address */}
            <div className="lg:col-span-5 space-y-6">
              {/* Prominent WhatsApp Icon Card containing +234 8077780074 */}
              <CtaActionLink
                rawUrl={siteText['contact.whatsapp.url']}
                fallbackHref={SOCIAL_LINKS.whatsapp}
                onNavigate={onNavigate}
                className="block w-full text-left rounded-2xl border-2 border-orange-600 bg-orange-600 text-white p-7 hover:bg-orange-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-yellow-300 text-neutral-900">
                    <svg
                      className="h-9 w-9"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.78 14.07c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.13.1-1.82-.12-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.18-4.93-4.37-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.01-2.42.26-.29.58-.36.77-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.14.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.3-.12.59.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.68.79 1.97.94.29.14.48.22.55.34.07.12.07.69-.17 1.37z" />
                    </svg>
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold text-yellow-200"
                      style={getTextColorStyle(siteText, 'contact.whatsapp.label')}
                    >
                      {getTextOverride(siteText, 'contact.whatsapp.label', 'Direct WhatsApp Line')}
                    </p>
                    <p className="font-display text-2xl font-bold tracking-tight text-white tabular-nums mt-0.5">
                      {WHATSAPP_DISPLAY}
                    </p>
                    <p
                      className="text-xs text-orange-100 mt-1"
                      style={getTextColorStyle(siteText, 'contact.whatsapp.subtext')}
                    >
                      {getTextOverride(
                        siteText,
                        'contact.whatsapp.subtext',
                        'Tap here to chat & hire BossAdoly instantly'
                      )}
                    </p>
                  </div>
                </div>
              </CtaActionLink>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-yellow-300 text-neutral-900 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500">Official Email</p>
                    <a
                      href={`mailto:${emailAddress}`}
                      className="text-base font-semibold text-neutral-900 hover:text-orange-600 transition-colors"
                      style={getTextColorStyle(siteText, 'contact.email.address')}
                    >
                      {emailAddress}
                    </a>
                  </div>
                </div>

                <div
                  className="pt-4 border-t border-neutral-200 text-sm text-neutral-600"
                  style={getTextColorStyle(siteText, 'contact.studioNote')}
                >
                  {getTextOverride(
                    siteText,
                    'contact.studioNote',
                    'Digital Studio · Designing landing pages, opt-in pages, e-commerce stores, and ad campaigns for businesses across Nigeria, Africa & worldwide.'
                  )}
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Message Composer */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6">
                <div>
                  <h2
                    className="text-2xl font-bold text-neutral-900"
                    style={getTextColorStyle(siteText, 'contact.form.title')}
                  >
                    {getTextOverride(siteText, 'contact.form.title', 'Send a Quick WhatsApp Note')}
                  </h2>
                  <p
                    className="text-sm text-neutral-600 mt-1"
                    style={getTextColorStyle(siteText, 'contact.form.description')}
                  >
                    {getTextOverride(
                      siteText,
                      'contact.form.description',
                      `Write your message below and send it straight to ${WHATSAPP_DISPLAY}.`
                    )}
                  </p>
                </div>

                <form onSubmit={handleQuickSend} className="space-y-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-neutral-800 mb-1.5">
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name or brand name"
                      className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-msg" className="block text-sm font-medium text-neutral-800 mb-1.5">
                      How Can We Help You?
                    </label>
                    <textarea
                      id="contact-msg"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us whether you need Meta/TikTok Ads, AI UGC Videos, or Website Design..."
                      className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {getTextOverride(
                        siteText,
                        'contact.form.submitLabel',
                        `Send on WhatsApp (${WHATSAPP_DISPLAY})`
                      )}
                    </span>
                  </button>
                </form>

                {generatedLink && (
                  <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-medium text-neutral-800">
                      WhatsApp link ready:
                    </span>
                    <a
                      href={generatedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-orange-700 underline hover:text-orange-800"
                    >
                      Open WhatsApp Now
                    </a>
                  </div>
                )}
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
