export type ImageSlotStyle =
  | 'standard'
  | 'carousel'
  | 'spotlight'
  | 'rounded'
  | 'editorial'
  | 'split-fade'
  | 'monochrome-hover'
  | 'zoom-hover';

export type HeroImageStyle =
  | 'carousel-fade'
  | 'carousel-slide'
  | 'carousel-zoom'
  | 'grid'
  | 'static';

export type GalleryImageStyle = 'grid' | 'carousel' | 'spotlight' | 'editorial';

export const IMAGE_SLOT_STYLE_OPTIONS: { value: ImageSlotStyle; label: string }[] = [
  { value: 'standard', label: 'Standard Cover (Default)' },
  { value: 'carousel', label: 'Carousel Slider' },
  { value: 'spotlight', label: 'Spotlight Framed Card' },
  { value: 'rounded', label: 'Soft Rounded / Circle Frame' },
  { value: 'editorial', label: 'Editorial Studio Mat' },
  { value: 'zoom-hover', label: 'Interactive Zoom' },
  { value: 'monochrome-hover', label: 'B&W to Color on Hover' },
  { value: 'split-fade', label: 'Soft Gradient Fade' },
];

export const HERO_IMAGE_STYLE_OPTIONS: { value: HeroImageStyle; label: string }[] = [
  { value: 'carousel-fade', label: 'Carousel — Smooth Fade (Default)' },
  { value: 'carousel-slide', label: 'Carousel — Horizontal Slide' },
  { value: 'carousel-zoom', label: 'Carousel — Zoom Motion' },
  { value: 'grid', label: 'Multi-Image Grid Collage' },
  { value: 'static', label: 'Static Single Image' },
];

export const GALLERY_IMAGE_STYLE_OPTIONS: { value: GalleryImageStyle; label: string }[] = [
  { value: 'grid', label: 'Grid Cards (Default)' },
  { value: 'carousel', label: 'Carousel Slider' },
  { value: 'spotlight', label: 'Featured Spotlight + Grid' },
  { value: 'editorial', label: 'Editorial Studio Frames' },
];

export function getImageStyleOverride(
  siteText: Record<string, string>,
  key: string,
  fallback: ImageSlotStyle = 'standard'
): ImageSlotStyle {
  const val = siteText[`imageStyle.${key}`];
  const valid = IMAGE_SLOT_STYLE_OPTIONS.some((o) => o.value === val);
  return valid ? (val as ImageSlotStyle) : fallback;
}

export function getHeroImageStyle(siteText: Record<string, string>): HeroImageStyle {
  const val = siteText['imageStyle.home.hero'];
  const valid = HERO_IMAGE_STYLE_OPTIONS.some((o) => o.value === val);
  return valid ? (val as HeroImageStyle) : 'carousel-fade';
}

export function getGalleryImageStyle(
  siteText: Record<string, string>,
  key: 'home.showcase' | 'team.highlights'
): GalleryImageStyle {
  const val = siteText[`imageStyle.${key}`];
  const valid = GALLERY_IMAGE_STYLE_OPTIONS.some((o) => o.value === val);
  return valid ? (val as GalleryImageStyle) : 'grid';
}

export function getExtraCarouselSlides(
  siteText: Record<string, string>,
  slotKey: string
): string[] {
  const raw = siteText[`imageSlides.${slotKey}`];
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
