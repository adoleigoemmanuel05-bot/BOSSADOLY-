import { Mail, MessageCircle } from 'lucide-react';
import { CONTACT_INFO, SOCIAL_LINKS } from '../data/siteData';
import { getImageOverride, getTextColorStyle, getTextOverride } from '../data/siteEditableSchema';
import type { PageId } from '../types/content';
import { getImageStyleOverride } from '../utils/imageStyles';
import { BrandLogo } from './BrandLogo';
import { StyledImage } from './StyledImage';

interface FooterProps {
  logoUrl: string | null;
  siteText?: Record<string, string>;
  siteImages?: Record<string, string>;
  onNavigate: (page: PageId, sectionId?: string) => void;
}

export function Footer({
  logoUrl,
  siteText = {},
  siteImages = {},
  onNavigate,
}: FooterProps) {
  const handleNav = (page: PageId) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerEmail = getTextOverride(siteText, 'contact.email.address', CONTACT_INFO.email);
  const summary = getTextOverride(
    siteText,
    'footer.summary',
    'Helping startups, fashion brands, and growing businesses reach their right audience through Meta & TikTok advertising, AI UGC video creation, and all website designs including landing pages, opt-in pages, and e-commerce stores.'
  );
  const connectTitle = getTextOverride(siteText, 'footer.connectTitle', 'Connect With BossAdoly');
  const connectText = getTextOverride(
    siteText,
    'footer.connectText',
    'Follow our latest campaigns, AI UGC reels, and digital marketing insights.'
  );
  const tagline = getTextOverride(
    siteText,
    'footer.tagline',
    'Meta & TikTok Ads · AI UGC Videos · Landing Pages, Opt-In Pages & E-Commerce Websites'
  );

  const fbIcon = getImageOverride(
    siteImages,
    'social.facebook.icon',
    '/assets/aistudio/images_cc8ace29.png'
  );
  const igIcon = getImageOverride(
    siteImages,
    'social.instagram.icon',
    '/assets/aistudio/images_5bcd8758.jpg'
  );
  const liIcon = getImageOverride(
    siteImages,
    'social.linkedin.icon',
    '/assets/aistudio/images__2__9c1a9d42.jpg'
  );
  const xIcon = getImageOverride(
    siteImages,
    'social.x.icon',
    '/assets/aistudio/images__1__e82f6c08.png'
  );

  return (
    <footer className="bg-neutral-950 text-neutral-300 border-t border-neutral-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Summary — No Specific Address */}
          <div className="md:col-span-5 space-y-4">
            <BrandLogo
              logoUrl={logoUrl}
              siteText={siteText}
              onClick={() => handleNav('home')}
              inverted
            />
            <p
              className="text-sm text-neutral-400 leading-relaxed max-w-md"
              style={getTextColorStyle(siteText, 'footer.summary')}
            >
              {summary}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-300 pt-1">
              <a
                href={`mailto:${footerEmail}`}
                className="inline-flex items-center gap-2 hover:text-yellow-300 transition-colors"
                style={getTextColorStyle(siteText, 'contact.email.address')}
              >
                <Mail className="h-4 w-4 text-orange-500" aria-hidden="true" />
                <span>{footerEmail}</span>
              </a>
              <a
                href={SOCIAL_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-yellow-300 transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-yellow-400" aria-hidden="true" />
                <span>{CONTACT_INFO.whatsappDisplay}</span>
              </a>
            </div>
          </div>

          {/* Pages */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-white">Navigation</h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              {(
                [
                  ['home', 'Home'],
                  ['services', 'Services'],
                  ['pricing', 'Pricing'],
                  ['about', 'About Us'],
                  ['team', 'Meet Our Team'],
                  ['faq', 'FAQ'],
                  ['contact', 'Contact Us'],
                ] as [PageId, string][]
              ).map(([id, label]) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => handleNav(id)}
                    className="text-neutral-400 hover:text-yellow-300 transition-colors cursor-pointer text-left"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="md:col-span-4 space-y-4">
            <h3
              className="text-sm font-semibold text-white"
              style={getTextColorStyle(siteText, 'footer.connectTitle')}
            >
              {connectTitle}
            </h3>
            <p
              className="text-sm text-neutral-400"
              style={getTextColorStyle(siteText, 'footer.connectText')}
            >
              {connectText}
            </p>
            <div className="flex items-center gap-3">
              {/* Facebook */}
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BossAdoly on Facebook"
                title="Facebook"
                className="h-10 w-10 rounded-xl overflow-hidden bg-transparent flex items-center justify-center transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <StyledImage
                  src={fbIcon}
                  alt="Facebook"
                  compact
                  styleMode={getImageStyleOverride(siteText, 'social.facebook.icon')}
                  className="!object-contain"
                />
              </a>

              {/* Instagram */}
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BossAdoly on Instagram"
                title="Instagram"
                className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <StyledImage
                  src={igIcon}
                  alt="Instagram"
                  compact
                  styleMode={getImageStyleOverride(siteText, 'social.instagram.icon')}
                />
              </a>

              {/* WhatsApp */}
              <a
                href={SOCIAL_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with BossAdoly on WhatsApp"
                title="WhatsApp (+234 8077780074)"
                className="h-10 w-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.78 14.07c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.13.1-1.82-.12-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.18-4.93-4.37-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.01-2.42.26-.29.58-.36.77-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.14.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.3-.12.59.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.68.79 1.97.94.29.14.48.22.55.34.07.12.07.69-.17 1.37z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BossAdoly on LinkedIn"
                title="LinkedIn"
                className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <StyledImage
                  src={liIcon}
                  alt="LinkedIn"
                  compact
                  styleMode={getImageStyleOverride(siteText, 'social.linkedin.icon')}
                />
              </a>

              {/* X (formerly Twitter) */}
              <a
                href={SOCIAL_LINKS.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BossAdoly on X (formerly Twitter)"
                title="X (formerly Twitter)"
                className="h-10 w-10 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <StyledImage
                  src={xIcon}
                  alt="X"
                  compact
                  styleMode={getImageStyleOverride(siteText, 'social.x.icon')}
                />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} BossAdoly Digital Hub. All rights reserved.</p>
          <p style={getTextColorStyle(siteText, 'footer.tagline')}>{tagline}</p>
        </div>
      </div>
    </footer>
  );
}
