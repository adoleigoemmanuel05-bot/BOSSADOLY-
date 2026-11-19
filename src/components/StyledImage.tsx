import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ImageSlotStyle } from '../utils/imageStyles';

interface StyledImageProps {
  src: string;
  alt: string;
  styleMode?: ImageSlotStyle;
  extraSlides?: string[];
  className?: string;
  containerClassName?: string;
  imgPositionClass?: string;
  compact?: boolean;
  onError?: () => void;
}

export function StyledImage({
  src,
  alt,
  styleMode = 'standard',
  extraSlides = [],
  className = '',
  containerClassName = '',
  imgPositionClass = 'object-center',
  compact = false,
  onError,
}: StyledImageProps) {
  const slides = [src, ...extraSlides.filter((u) => u && u !== src)].filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [src, extraSlides.length]);

  useEffect(() => {
    if (styleMode !== 'carousel' || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [styleMode, slides.length]);

  const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0;

  if (styleMode === 'carousel' && !compact) {
    return (
      <div className={`relative w-full h-full overflow-hidden group ${containerClassName}`}>
        {slides.map((slideUrl, idx) => (
          <img
            key={`${slideUrl}-${idx}`}
            src={slideUrl}
            alt={idx === 0 ? alt : `${alt} slide ${idx + 1}`}
            referrerPolicy="no-referrer"
            onError={idx === 0 ? onError : undefined}
            className={`w-full h-full object-cover ${imgPositionClass} transition-all duration-700 ${
              slides.length === 1
                ? 'scale-105 group-hover:scale-100'
                : idx === safeIndex
                ? 'opacity-100 relative'
                : 'opacity-0 absolute inset-0 pointer-events-none'
            } ${className}`}
          />
        ))}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
              }}
              aria-label="Previous image"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 text-neutral-900 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev + 1) % slides.length);
              }}
              aria-label="Next image"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 text-neutral-900 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2.5 inset-x-0 z-10 flex items-center justify-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(idx);
                  }}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === safeIndex ? 'w-5 bg-orange-500' : 'w-1.5 bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (styleMode === 'editorial' && !compact) {
    return (
      <div className={`w-full h-full p-2.5 bg-white ${containerClassName}`}>
        <div className="w-full h-full overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            onError={onError}
            className={`w-full h-full object-cover ${imgPositionClass} transition-transform duration-500 hover:scale-[1.03] ${className}`}
          />
        </div>
      </div>
    );
  }

  if (styleMode === 'spotlight' && !compact) {
    return (
      <div className={`w-full h-full p-2 bg-gradient-to-br from-orange-50 to-yellow-50 ${containerClassName}`}>
        <div className="w-full h-full overflow-hidden rounded-xl shadow-md ring-1 ring-orange-200/70">
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            onError={onError}
            className={`w-full h-full object-cover ${imgPositionClass} transition-transform duration-500 hover:scale-105 ${className}`}
          />
        </div>
      </div>
    );
  }

  if (styleMode === 'rounded') {
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${
          compact ? '' : 'p-3 bg-neutral-50'
        } ${containerClassName}`}
      >
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={onError}
          className={`${
            compact
              ? 'h-full w-full rounded-full object-cover'
              : 'w-full h-full rounded-3xl ring-2 ring-orange-400/50 shadow-sm object-cover'
          } ${imgPositionClass} ${className}`}
        />
      </div>
    );
  }

  if (styleMode === 'split-fade' && !compact) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${containerClassName}`}>
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={onError}
          className={`w-full h-full object-cover ${imgPositionClass} ${className}`}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none"
        />
      </div>
    );
  }

  if (styleMode === 'monochrome-hover') {
    return (
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={onError}
        className={`w-full h-full object-cover ${imgPositionClass} grayscale hover:grayscale-0 transition-all duration-500 ${className}`}
      />
    );
  }

  if (styleMode === 'zoom-hover') {
    return (
      <div className={`w-full h-full overflow-hidden ${containerClassName}`}>
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={onError}
          className={`w-full h-full object-cover ${imgPositionClass} transition-transform duration-500 hover:scale-110 ${className}`}
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={onError}
      className={`w-full h-full object-cover ${imgPositionClass} ${className}`}
    />
  );
}
