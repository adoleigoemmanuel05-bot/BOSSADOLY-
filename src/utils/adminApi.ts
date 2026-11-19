import { FAQ_DATA, PRICING_TIERS, SERVICES_DATA, TEAM_DATA } from '../data/siteData';
import type {
  CmsContent,
  CustomSection,
  FaqEntry,
  HeroAppearance,
  MediaItem,
  PricingTier,
  ServiceOffering,
  TeamMember,
} from '../types/content';
import { loadLocalCmsSnapshot, saveLocalCmsSnapshot } from './localSnapshot';

const DEFAULT_ADMIN_PASSWORD = 'Adoly1234@';
const LOCAL_PW_HASH_KEY = 'bossadoly_admin_pw_hash_v1';
export const CLOUD_PW_HASH_KEY = '__admin.pwHash';

const DEFAULT_HERO_APPEARANCE: HeroAppearance = {
  tone: 'light',
  overlayOpacity: 75,
  brightness: 100,
};

export interface AdminApiResponse<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  data: T;
  mode: 'server' | 'static';
}

async function hashPassword(raw: string): Promise<string> {
  const salted = `bossadoly_v1::${raw}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(salted);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Deterministic fallback for non-secure HTTP contexts
  let h = 2166136261;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv_${(h >>> 0).toString(16)}`;
}

function readLocalPwHash(): string | null {
  try {
    return localStorage.getItem(LOCAL_PW_HASH_KEY);
  } catch {
    return null;
  }
}

function writeLocalPwHash(hash: string): void {
  try {
    localStorage.setItem(LOCAL_PW_HASH_KEY, hash);
  } catch {
    // Ignore storage errors
  }
}

function getEffectivePwHash(cms?: CmsContent): string | null {
  const cloudHash = cms?.siteText?.[CLOUD_PW_HASH_KEY]?.trim();
  if (cloudHash) return cloudHash;
  return readLocalPwHash();
}

async function verifyStaticPassword(candidate: string, cms?: CmsContent): Promise<boolean> {
  const savedHash = getEffectivePwHash(cms);
  if (savedHash) {
    const candidateHash = await hashPassword(candidate);
    return candidateHash === savedHash;
  }
  return candidate === DEFAULT_ADMIN_PASSWORD;
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseVideoEmbedUrl(rawUrl: string): {
  source: 'youtube' | 'gdrive';
  embedUrl: string;
} | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let videoId = '';
      if (host.includes('youtu.be')) {
        videoId = parsed.pathname.replace(/^\//, '').split('/')[0] || '';
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || '';
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0] || '';
      } else {
        videoId = parsed.searchParams.get('v') || '';
      }

      if (videoId && /^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
        return {
          source: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        };
      }
    }

    if (host.includes('drive.google.com')) {
      let fileId = '';
      const match = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        fileId = match[1];
      } else {
        fileId = parsed.searchParams.get('id') || '';
      }
      if (fileId && /^[a-zA-Z0-9_-]{10,120}$/.test(fileId)) {
        return {
          source: 'gdrive',
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeHeroAppearance(raw: unknown): HeroAppearance {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const tone: 'light' | 'dark' = obj.tone === 'dark' ? 'dark' : 'light';
  const rawOverlay = typeof obj.overlayOpacity === 'number' ? obj.overlayOpacity : Number(obj.overlayOpacity);
  const rawBrightness = typeof obj.brightness === 'number' ? obj.brightness : Number(obj.brightness);
  return {
    tone,
    overlayOpacity: Number.isFinite(rawOverlay) ? Math.min(95, Math.max(0, Math.round(rawOverlay))) : 75,
    brightness: Number.isFinite(rawBrightness) ? Math.min(160, Math.max(40, Math.round(rawBrightness))) : 100,
  };
}

async function getWorkingCms(currentCms?: CmsContent): Promise<CmsContent> {
  if (currentCms) {
    return {
      ...currentCms,
      items: [...currentCms.items],
      siteText: { ...currentCms.siteText },
      siteImages: { ...currentCms.siteImages },
      heroAppearance: { ...currentCms.heroAppearance },
      teamMembers: [...currentCms.teamMembers],
      services: [...currentCms.services],
      pricingTiers: [...currentCms.pricingTiers],
      faqs: [...currentCms.faqs],
      customSections: [...currentCms.customSections],
      hiddenSections: [...currentCms.hiddenSections],
    };
  }
  const snap = await loadLocalCmsSnapshot();
  if (snap?.content) {
    return {
      ...snap.content,
      items: [...snap.content.items],
      siteText: { ...snap.content.siteText },
      siteImages: { ...snap.content.siteImages },
      heroAppearance: { ...snap.content.heroAppearance },
      teamMembers: [...snap.content.teamMembers],
      services: [...snap.content.services],
      pricingTiers: [...snap.content.pricingTiers],
      faqs: [...snap.content.faqs],
      customSections: [...snap.content.customSections],
      hiddenSections: [...snap.content.hiddenSections],
    };
  }
  return {
    logoUrl: null,
    items: [],
    siteText: {},
    siteImages: {},
    heroAppearance: { ...DEFAULT_HERO_APPEARANCE },
    teamMembers: [...TEAM_DATA],
    services: [...SERVICES_DATA],
    pricingTiers: [...PRICING_TIERS],
    faqs: [...FAQ_DATA],
    customSections: [],
    hiddenSections: [],
  };
}

async function handleStaticAdminRequest(
  url: string,
  method: string,
  body: Record<string, unknown>,
  currentCms?: CmsContent
): Promise<AdminApiResponse<Record<string, unknown>>> {
  const upperMethod = method.toUpperCase();

  if (url === '/api/admin/verify' && upperMethod === 'POST') {
    const password = typeof body.password === 'string' ? body.password : '';
    const valid = await verifyStaticPassword(password, currentCms);
    if (!valid) {
      return {
        ok: false,
        status: 401,
        data: { error: 'Incorrect password.' },
        mode: 'static',
      };
    }
    const token = `static_${await hashPassword(`${password}_${Date.now()}`)}`;
    return { ok: true, status: 200, data: { ok: true, token }, mode: 'static' };
  }

  if (url === '/api/admin/change-password' && upperMethod === 'POST') {
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';

    const valid = await verifyStaticPassword(currentPassword, currentCms);
    if (!valid) {
      return {
        ok: false,
        status: 401,
        data: { error: 'Current password is incorrect.' },
        mode: 'static',
      };
    }
    if (newPassword.length < 6) {
      return {
        ok: false,
        status: 400,
        data: { error: 'New password must be at least 6 characters.' },
        mode: 'static',
      };
    }

    const newHash = await hashPassword(newPassword);
    writeLocalPwHash(newHash);
    const store = await getWorkingCms(currentCms);
    store.siteText[CLOUD_PW_HASH_KEY] = newHash;
    await saveLocalCmsSnapshot(store);

    const token = `static_${await hashPassword(`${newPassword}_${Date.now()}`)}`;
    return {
      ok: true,
      status: 200,
      data: { ok: true, token, pwHash: newHash },
      mode: 'static',
    };
  }

  const store = await getWorkingCms(currentCms);

  if (url === '/api/admin/video' && upperMethod === 'POST') {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const category =
      typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'AI UGC Video';
    const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
    const placementRaw = typeof body.placement === 'string' ? body.placement : 'showcase';
    const placement: 'showcase' | 'hero' | 'team' =
      placementRaw === 'hero' || placementRaw === 'team' ? placementRaw : 'showcase';

    if (!title || !rawUrl) {
      return { ok: false, status: 400, data: { error: 'Video title and URL are required.' }, mode: 'static' };
    }
    const parsed = parseVideoEmbedUrl(rawUrl);
    if (!parsed) {
      return {
        ok: false,
        status: 400,
        data: { error: 'Please paste a valid YouTube or Google Drive share link.' },
        mode: 'static',
      };
    }

    const newItem: MediaItem = {
      id: createId(),
      type: 'video',
      title,
      category,
      url: rawUrl,
      embedUrl: parsed.embedUrl,
      source: parsed.source,
      placement,
      visible: true,
      createdAt: new Date().toISOString(),
    };
    store.items.unshift(newItem);
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 201, data: { item: newItem }, mode: 'static' };
  }

  if (url === '/api/admin/upload-image' && upperMethod === 'POST') {
    const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : '';
    const title = typeof body.title === 'string' ? body.title.trim() : 'Studio Upload';
    const category =
      typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'Website Design';
    const placementRaw = typeof body.placement === 'string' ? body.placement : 'showcase';

    if (!/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) {
      return {
        ok: false,
        status: 400,
        data: { error: 'Invalid image format. Upload a PNG, JPG, WEBP, or SVG image.' },
        mode: 'static',
      };
    }

    if (placementRaw === 'logo') {
      store.logoUrl = dataUrl;
      await saveLocalCmsSnapshot(store);
      return { ok: true, status: 201, data: { logoUrl: dataUrl }, mode: 'static' };
    }

    const placement: 'showcase' | 'hero' | 'team' =
      placementRaw === 'hero' || placementRaw === 'team' ? placementRaw : 'showcase';
    const newItem: MediaItem = {
      id: createId(),
      type: 'image',
      title: title || 'Studio Visual',
      category,
      url: dataUrl,
      source: 'gallery',
      placement,
      visible: true,
      createdAt: new Date().toISOString(),
    };
    store.items.unshift(newItem);
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 201, data: { item: newItem }, mode: 'static' };
  }

  if (url === '/api/admin/logo' && upperMethod === 'DELETE') {
    store.logoUrl = null;
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 200, data: { logoUrl: null }, mode: 'static' };
  }

  if (url === '/api/admin/hero-appearance' && upperMethod === 'PUT') {
    store.heroAppearance = normalizeHeroAppearance(body);
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 200, data: { heroAppearance: store.heroAppearance }, mode: 'static' };
  }

  if (url.startsWith('/api/admin/item/')) {
    const id = decodeURIComponent(url.slice('/api/admin/item/'.length));
    if (upperMethod === 'PATCH') {
      const idx = store.items.findIndex((i) => i.id === id);
      if (idx === -1) {
        return { ok: false, status: 404, data: { error: 'Media item not found.' }, mode: 'static' };
      }
      const existing = { ...store.items[idx] };
      if (typeof body.visible === 'boolean') existing.visible = body.visible;
      if (typeof body.title === 'string' && body.title.trim()) existing.title = body.title.trim();
      if (typeof body.category === 'string' && body.category.trim()) existing.category = body.category.trim();
      store.items[idx] = existing;
      await saveLocalCmsSnapshot(store);
      return { ok: true, status: 200, data: { item: existing }, mode: 'static' };
    }
    if (upperMethod === 'DELETE') {
      store.items = store.items.filter((i) => i.id !== id);
      await saveLocalCmsSnapshot(store);
      return { ok: true, status: 200, data: { ok: true }, mode: 'static' };
    }
  }

  if (url === '/api/admin/site-text' && upperMethod === 'PUT') {
    const updates =
      body.updates && typeof body.updates === 'object'
        ? (body.updates as Record<string, string | null>)
        : {};
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') {
        delete store.siteText[k];
      } else {
        store.siteText[k] = String(v);
      }
    }
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 200, data: { siteText: store.siteText }, mode: 'static' };
  }

  if (url === '/api/admin/replace-image' && upperMethod === 'POST') {
    const slotKey = typeof body.slotKey === 'string' ? body.slotKey.trim() : '';
    if (!slotKey) {
      return { ok: false, status: 400, data: { error: 'Missing image slot key.' }, mode: 'static' };
    }
    if (body.reset) {
      delete store.siteImages[slotKey];
      await saveLocalCmsSnapshot(store);
      return { ok: true, status: 200, data: { url: null }, mode: 'static' };
    }
    const nextUrl =
      typeof body.dataUrl === 'string' && body.dataUrl.trim()
        ? body.dataUrl.trim()
        : typeof body.imageUrl === 'string' && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : '';
    if (!nextUrl) {
      return { ok: false, status: 400, data: { error: 'Provide an image file or URL.' }, mode: 'static' };
    }
    store.siteImages[slotKey] = nextUrl;
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 200, data: { url: nextUrl }, mode: 'static' };
  }

  if (url === '/api/admin/team' && upperMethod === 'PUT' && Array.isArray(body.teamMembers)) {
    store.teamMembers = body.teamMembers as TeamMember[];
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 200, data: { teamMembers: store.teamMembers }, mode: 'static' };
  }

  if (url === '/api/admin/services' && upperMethod === 'PUT' && Array.isArray(body.services)) {
    store.services = body.services as ServiceOffering[];
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 200, data: { services: store.services }, mode: 'static' };
  }

  if (url === '/api/admin/pricing' && upperMethod === 'PUT' && Array.isArray(body.pricingTiers)) {
    store.pricingTiers = body.pricingTiers as PricingTier[];
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 200, data: { pricingTiers: store.pricingTiers }, mode: 'static' };
  }

  if (url === '/api/admin/faqs' && upperMethod === 'PUT' && Array.isArray(body.faqs)) {
    store.faqs = body.faqs as FaqEntry[];
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 200, data: { faqs: store.faqs }, mode: 'static' };
  }

  if (
    url === '/api/admin/custom-sections' &&
    upperMethod === 'PUT' &&
    Array.isArray(body.customSections)
  ) {
    store.customSections = body.customSections as CustomSection[];
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 200, data: { customSections: store.customSections }, mode: 'static' };
  }

  if (
    url === '/api/admin/hidden-sections' &&
    upperMethod === 'PUT' &&
    Array.isArray(body.hiddenSections)
  ) {
    store.hiddenSections = body.hiddenSections.map(String);
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 200, data: { hiddenSections: store.hiddenSections }, mode: 'static' };
  }

  if (url === '/api/admin/restore-snapshot' && upperMethod === 'PUT') {
    await saveLocalCmsSnapshot(store);
    return { ok: true, status: 200, data: { ok: true }, mode: 'static' };
  }

  return { ok: true, status: 200, data: { ok: true }, mode: 'static' };
}

export async function adminApiRequest<T = Record<string, unknown>>(
  url: string,
  options: {
    method?: string;
    token?: string | null;
    body?: Record<string, unknown>;
    currentCms?: CmsContent;
  } = {}
): Promise<AdminApiResponse<T>> {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers['x-admin-token'] = options.token;
  }

  // If already authenticated in static mode, skip hitting non-existent /api/* on Netlify
  const isStaticSession = Boolean(options.token && options.token.startsWith('static_'));

  if (!isStaticSession) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = (await res.json()) as T;
        return { ok: res.ok, status: res.status, data, mode: 'server' };
      }
    } catch {
      // Fall through to static/cloud handler when Express server is not running (e.g., Netlify)
    }
  }

  const fallback = await handleStaticAdminRequest(
    url,
    method,
    options.body || {},
    options.currentCms
  );
  return fallback as AdminApiResponse<T>;
}
