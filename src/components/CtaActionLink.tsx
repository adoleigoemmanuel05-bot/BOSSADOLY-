import type { ReactNode } from 'react';
import type { PageId } from '../types/content';
import { resolveDestination } from '../utils/cta';

interface CtaActionLinkProps {
  rawUrl?: string;
  fallbackHref?: string;
  fallbackPage?: PageId;
  fallbackSectionId?: string;
  onNavigate?: (page: PageId, sectionId?: string) => void;
  className?: string;
  ariaLabel?: string;
  title?: string;
  children: ReactNode;
}

export function CtaActionLink({
  rawUrl,
  fallbackHref,
  fallbackPage,
  fallbackSectionId,
  onNavigate,
  className = '',
  ariaLabel,
  title,
  children,
}: CtaActionLinkProps) {
  const dest = resolveDestination(rawUrl, {
    href: fallbackHref,
    page: fallbackPage,
    sectionId: fallbackSectionId,
  });

  if (dest.isInternalPage && dest.targetPage && onNavigate) {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate(dest.targetPage!, dest.targetSectionId);
          if (!dest.targetSectionId) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        aria-label={ariaLabel}
        title={title}
        className={`${className} cursor-pointer`}
      >
        {children}
      </button>
    );
  }

  return (
    <a
      href={dest.href}
      target={dest.href.startsWith('mailto:') || dest.href.startsWith('tel:') || dest.href.startsWith('#') ? undefined : '_blank'}
      rel={dest.href.startsWith('mailto:') || dest.href.startsWith('tel:') || dest.href.startsWith('#') ? undefined : 'noopener noreferrer'}
      aria-label={ariaLabel}
      title={title}
      className={className}
    >
      {children}
    </a>
  );
}
