import { getTextColorStyle, getTextOverride } from '../data/siteEditableSchema';

interface BrandLogoProps {
  logoUrl: string | null;
  siteText?: Record<string, string>;
  onClick?: () => void;
  inverted?: boolean;
}

export function BrandLogo({ logoUrl, siteText = {}, onClick, inverted = false }: BrandLogoProps) {
  const brandFirst = getTextOverride(siteText, 'brand.first', 'BossAdoly');
  const brandSecond = getTextOverride(siteText, 'brand.second', 'Digital Hub');

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
      aria-label={`${brandFirst} ${brandSecond} Home`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${brandFirst} ${brandSecond} Logo`}
          referrerPolicy="no-referrer"
          className="h-9 w-9 rounded-lg object-cover border border-neutral-200 bg-white shrink-0"
        />
      ) : (
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white shrink-0"
          aria-hidden="true"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 4H13.5C16.2614 4 18.5 6.01472 18.5 8.5C18.5 10.172 17.4848 11.6305 15.9806 12.3982C17.7819 13.0954 19 14.702 19 16.6C19 19.0301 16.7614 21 14 21H5V4Z"
              stroke="white"
              strokeWidth="2.1"
              strokeLinejoin="round"
            />
            <path d="M9 9H13C13.8284 9 14.5 9.67157 14.5 10.5C14.5 11.3284 13.8284 12 13 12H9V9Z" fill="#FACC15" />
            <path d="M9 14.5H13.5C14.3284 14.5 15 15.1716 15 16C15 16.8284 14.3284 17.5 13.5 17.5H9V14.5Z" fill="#FACC15" />
          </svg>
        </span>
      )}
      <span
        className={`font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0 ${
          inverted ? 'text-white' : 'text-neutral-900'
        }`}
      >
        <span style={getTextColorStyle(siteText, 'brand.first')}>{brandFirst}</span>{' '}
        <span
          className="text-orange-600"
          style={getTextColorStyle(siteText, 'brand.second')}
        >
          {brandSecond}
        </span>
      </span>
    </button>
  );
}
