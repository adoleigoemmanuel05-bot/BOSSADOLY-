import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Film, Image as ImageIcon } from 'lucide-react';
import type { MediaItem } from '../types/content';
import type { GalleryImageStyle } from '../utils/imageStyles';

interface MediaShowcaseGridProps {
  items: MediaItem[];
  galleryStyle?: GalleryImageStyle;
  onOpenAdmin?: () => void;
}

export function MediaShowcaseGrid({
  items,
  galleryStyle = 'grid',
}: MediaShowcaseGridProps) {
  const [filter, setFilter] = useState<'all' | 'video' | 'image'>('all');
  const [carouselIdx, setCarouselIdx] = useState(0);

  const showcaseItems = items.filter((item) => item.placement === 'showcase');
  const filtered = showcaseItems.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  useEffect(() => {
    setCarouselIdx(0);
  }, [filter, filtered.length, galleryStyle]);

  useEffect(() => {
    if (galleryStyle !== 'carousel' || filtered.length <= 1) return;
    const hasVideo = filtered.some((i) => i.type === 'video');
    if (hasVideo) return; // Don't auto-advance away from playable video iframes
    const timer = window.setInterval(() => {
      setCarouselIdx((prev) => (prev + 1) % filtered.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [galleryStyle, filtered]);

  if (showcaseItems.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center space-y-2">
        <p className="text-sm font-medium text-neutral-900">
          Studio Videos & Project Gallery Showcase
        </p>
        <p className="text-sm text-neutral-600 max-w-lg mx-auto">
          New YouTube reels, Google Drive campaign videos, and website or ad project visuals
          published by BossAdoly Digital Hub appear here automatically.
        </p>
      </div>
    );
  }

  const renderCard = (item: MediaItem, editorialMode = false, spotlightLead = false) => (
    <article
      key={item.id}
      className={`rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col ${
        editorialMode ? 'p-3 shadow-sm hover:shadow-md transition-shadow' : ''
      } ${spotlightLead ? 'lg:col-span-2' : ''}`}
    >
      {item.type === 'video' && item.embedUrl ? (
        <div
          className={`aspect-video bg-neutral-900 relative ${
            editorialMode ? 'rounded-lg overflow-hidden' : ''
          }`}
        >
          <iframe
            src={item.embedUrl}
            title={item.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div
          className={`${
            spotlightLead ? 'aspect-[16/9]' : 'aspect-[4/3]'
          } bg-neutral-100 overflow-hidden relative ${
            editorialMode ? 'rounded-lg border border-neutral-200' : ''
          }`}
        >
          <img
            src={item.url}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className={`${editorialMode ? 'pt-4 pb-1 px-1' : 'p-5'} flex-1 flex flex-col justify-between gap-3`}>
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            {item.type === 'video' ? (
              <Film className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
            )}
            <span>{item.category}</span>
            <span aria-hidden="true">·</span>
            <span>
              {item.source === 'youtube'
                ? 'YouTube'
                : item.source === 'gdrive'
                ? 'Google Drive'
                : 'Studio Gallery'}
            </span>
          </div>
          <h4 className="mt-1.5 text-base font-semibold text-neutral-900">{item.title}</h4>
        </div>

        {item.type === 'video' && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            <span>Open Source Video</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  );

  const safeIdx = filtered.length > 0 ? carouselIdx % filtered.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-neutral-900">
            Featured Reels & Studio Uploads
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            Curated videos and project visuals published directly from BossAdoly Digital Hub.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200">
          {(
            [
              ['all', 'All Media'],
              ['video', 'Videos'],
              ['image', 'Images'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filter === key
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
          No {filter} items uploaded yet.
        </div>
      ) : galleryStyle === 'carousel' ? (
        <div className="relative">
          <div className="max-w-3xl mx-auto">
            {renderCard(filtered[safeIdx], false, true)}
          </div>

          {filtered.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setCarouselIdx((prev) => (prev - 1 + filtered.length) % filtered.length)
                }
                aria-label="Previous showcase item"
                className="h-9 w-9 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                {filtered.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCarouselIdx(idx)}
                    aria-label={`Show item ${idx + 1}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === safeIdx ? 'w-6 bg-orange-600' : 'w-2 bg-neutral-300'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCarouselIdx((prev) => (prev + 1) % filtered.length)}
                aria-label="Next showcase item"
                className="h-9 w-9 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            galleryStyle === 'spotlight' ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
          } gap-6`}
        >
          {filtered.map((item, idx) =>
            renderCard(item, galleryStyle === 'editorial', galleryStyle === 'spotlight' && idx === 0)
          )}
        </div>
      )}
    </div>
  );
}
