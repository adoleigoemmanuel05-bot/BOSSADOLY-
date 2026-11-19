import { useState } from 'react';
import { Menu, MessageCircle, X } from 'lucide-react';
import { getTextColorStyle, getTextOverride } from '../data/siteEditableSchema';
import type { PageId } from '../types/content';
import { buildHireWhatsAppUrl } from '../utils/whatsapp';
import { BrandLogo } from './BrandLogo';
import { CtaActionLink } from './CtaActionLink';

interface NavbarProps {
  activePage: PageId;
  onNavigate: (page: PageId, sectionId?: string) => void;
  logoUrl: string | null;
  siteText?: Record<string, string>;
}

const NAV_ITEMS: { id: PageId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'about', label: 'About' },
  { id: 'team', label: 'Team' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
];

export function Navbar({ activePage, onNavigate, logoUrl, siteText = {} }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hireLabel = getTextOverride(siteText, 'nav.cta', 'Hire Me');
  const hireMobileLabel = getTextOverride(siteText, 'nav.cta.mobile', 'Hire Me on WhatsApp');
  const hireUrl = siteText['nav.cta.url'];

  const handleSelectPage = (page: PageId, sectionId?: string) => {
    onNavigate(page, sectionId);
    setMobileOpen(false);
    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Logo (Top Left on all pages) */}
        <BrandLogo
          logoUrl={logoUrl}
          siteText={siteText}
          onClick={() => handleSelectPage('home')}
        />

        {/* Zone 2: Clean single-line navigation links */}
        <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPage(item.id)}
                className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded ${
                  isActive
                    ? 'text-orange-600'
                    : 'text-neutral-700 hover:text-neutral-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-orange-600 rounded-full"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Hire CTA -> Configurable (default WhatsApp) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <CtaActionLink
            rawUrl={hireUrl}
            fallbackHref={buildHireWhatsAppUrl()}
            onNavigate={handleSelectPage}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span style={getTextColorStyle(siteText, 'nav.cta')}>{hireLabel}</span>
          </CtaActionLink>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-1">
          <div className="grid grid-cols-2 gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPage(item.id)}
                  className={`px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
            <CtaActionLink
              rawUrl={hireUrl}
              fallbackHref={buildHireWhatsAppUrl()}
              onNavigate={handleSelectPage}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
            >
              <MessageCircle className="h-4 w-4" />
              <span style={getTextColorStyle(siteText, 'nav.cta.mobile') || getTextColorStyle(siteText, 'nav.cta')}>
                {hireMobileLabel}
              </span>
            </CtaActionLink>
          </div>
        </div>
      )}
    </header>
  );
}
