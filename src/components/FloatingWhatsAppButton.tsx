import type { PageId } from '../types/content';
import { buildHireWhatsAppUrl, WHATSAPP_DISPLAY } from '../utils/whatsapp';
import { CtaActionLink } from './CtaActionLink';

interface FloatingWhatsAppButtonProps {
  siteText?: Record<string, string>;
  onNavigate?: (page: PageId) => void;
}

export function FloatingWhatsAppButton({
  siteText = {},
  onNavigate,
}: FloatingWhatsAppButtonProps) {
  const customUrl = siteText['floating.cta.url'];
  const title = siteText['floating.cta.title'] || `Chat on WhatsApp (${WHATSAPP_DISPLAY})`;

  return (
    <CtaActionLink
      rawUrl={customUrl}
      fallbackHref={buildHireWhatsAppUrl()}
      onNavigate={onNavigate}
      ariaLabel={title}
      title={title}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-2 ring-white transition-transform duration-200 hover:scale-105 hover:bg-[#1ebe5d] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
    >
      <svg
        className="h-8 w-8"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.78 14.07c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.13.1-1.82-.12-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.18-4.93-4.37-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.01-2.42.26-.29.58-.36.77-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.14.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.3-.12.59.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.68.79 1.97.94.29.14.48.22.55.34.07.12.07.69-.17 1.37z" />
      </svg>
    </CtaActionLink>
  );
}
