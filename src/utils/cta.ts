import type { PageId } from '../types/content';
import { buildHireWhatsAppUrl } from './whatsapp';

const VALID_TARGET_PAGES = new Set<PageId>([
  'home',
  'services',
  'pricing',
  'about',
  'team',
  'faq',
  'contact',
]);

export interface ResolvedDestination {
  href: string;
  isInternalPage: boolean;
  targetPage?: PageId;
  targetSectionId?: string;
}

export function resolveDestination(
  rawUrl: string | undefined,
  fallback: { href?: string; page?: PageId; sectionId?: string }
): ResolvedDestination {
  const trimmed = (rawUrl || '').trim();

  if (!trimmed) {
    if (fallback.page) {
      return {
        href: `#${fallback.page}`,
        isInternalPage: true,
        targetPage: fallback.page,
        targetSectionId: fallback.sectionId,
      };
    }
    return {
      href: fallback.href || buildHireWhatsAppUrl(),
      isInternalPage: false,
    };
  }

  // Internal page hash e.g. #pricing or pricing, plus #pricing-form
  const lower = trimmed.toLowerCase();
  const strippedHash = lower.startsWith('#') ? lower.slice(1) : lower;
  if (
    strippedHash === 'pricing-form' ||
    strippedHash === 'pricing#pricing-quote-form' ||
    strippedHash === 'pricing#form'
  ) {
    return {
      href: '#pricing-form',
      isInternalPage: true,
      targetPage: 'pricing',
      targetSectionId: 'pricing-quote-form',
    };
  }
  if (VALID_TARGET_PAGES.has(strippedHash as PageId)) {
    return {
      href: `#${strippedHash}`,
      isInternalPage: true,
      targetPage: strippedHash as PageId,
    };
  }

  // Explicit protocol links (https://, http://, mailto:, tel:)
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return {
      href: trimmed,
      isInternalPage: false,
    };
  }

  // Phone number entered directly -> convert to WhatsApp wa.me link
  const digitsOnly = trimmed.replace(/[\s\-().+]/g, '');
  if (/^\d{7,15}$/.test(digitsOnly) && !/[a-zA-Z]/.test(trimmed)) {
    return {
      href: `https://wa.me/${digitsOnly}`,
      isInternalPage: false,
    };
  }

  // Domain without protocol -> prepend https://
  return {
    href: `https://${trimmed}`,
    isInternalPage: false,
  };
}
