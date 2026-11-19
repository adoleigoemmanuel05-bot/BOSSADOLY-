import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
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
import { compressImageDataUrl } from '../utils/imageCompression';

export const ADMIN_EMAIL = 'adoleigoemmanuel05@gmail.com';

export interface SyncedCollectionsMap {
  team?: boolean;
  services?: boolean;
  pricing?: boolean;
  faqs?: boolean;
}

export interface CloudCmsResult {
  hasCloudData: boolean;
  logoUrl?: string | null;
  heroAppearance?: HeroAppearance;
  hiddenSections?: string[];
  syncedCollections?: SyncedCollectionsMap;
  siteText?: Record<string, string>;
  siteImages?: Record<string, string>;
  items?: MediaItem[];
  teamMembers?: TeamMember[];
  services?: ServiceOffering[];
  pricingTiers?: PricingTier[];
  faqs?: FaqEntry[];
  customSections?: CustomSection[];
}

export function isCloudAdminSignedIn(): boolean {
  const user = auth.currentUser;
  return Boolean(user && user.emailVerified && user.email === ADMIN_EMAIL);
}

function getVerifiedUid(): string | null {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || user.email !== ADMIN_EMAIL) {
    return null;
  }
  return user.uid;
}

function sanitizeDocId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '__').slice(0, 128);
  return cleaned || `id_${Date.now()}`;
}

function clampString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.slice(0, maxLen);
}

function clampStringArray(val: unknown, maxItems = 30, itemMaxLen = 500): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((entry) => String(entry ?? '').trim().slice(0, itemMaxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

async function prepareImageValue(rawUrl: string | null | undefined, maxBytes = 800_000): Promise<string> {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:image/')) {
    const compressed = await compressImageDataUrl(trimmed, Math.min(maxBytes, 700_000));
    return compressed.slice(0, maxBytes);
  }
  return trimmed.slice(0, maxBytes);
}

export async function loadCmsFromFirestore(): Promise<CloudCmsResult> {
  let settingsDoc: Record<string, unknown> | null = null;
  try {
    const snap = await getDoc(doc(db, 'cms_settings', 'main'));
    if (snap.exists()) {
      settingsDoc = snap.data() as Record<string, unknown>;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'cms_settings/main');
  }

  async function fetchPublicCollection<T extends Record<string, unknown>>(
    colName: string
  ): Promise<T[]> {
    try {
      const q = query(collection(db, colName), where('isPublic', '==', true));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as T);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, colName);
    }
  }

  const [
    textDocs,
    slotImageDocs,
    mediaDocs,
    teamDocs,
    serviceDocs,
    pricingDocs,
    faqDocs,
    customDocs,
  ] = await Promise.all([
    fetchPublicCollection<Record<string, unknown>>('cms_text_entries'),
    fetchPublicCollection<Record<string, unknown>>('cms_slot_images'),
    fetchPublicCollection<Record<string, unknown>>('cms_media'),
    fetchPublicCollection<Record<string, unknown>>('cms_team'),
    fetchPublicCollection<Record<string, unknown>>('cms_services'),
    fetchPublicCollection<Record<string, unknown>>('cms_pricing'),
    fetchPublicCollection<Record<string, unknown>>('cms_faqs'),
    fetchPublicCollection<Record<string, unknown>>('cms_custom_sections'),
  ]);

  const hasCloudData = Boolean(
    settingsDoc ||
      textDocs.length > 0 ||
      slotImageDocs.length > 0 ||
      mediaDocs.length > 0 ||
      teamDocs.length > 0 ||
      serviceDocs.length > 0 ||
      pricingDocs.length > 0 ||
      faqDocs.length > 0 ||
      customDocs.length > 0
  );

  if (!hasCloudData) {
    return { hasCloudData: false };
  }

  const synced = (settingsDoc?.syncedCollections as SyncedCollectionsMap) || {};

  const siteText: Record<string, string> = {};
  for (const row of textDocs) {
    if (typeof row.key === 'string' && typeof row.value === 'string' && row.value.length > 0) {
      siteText[row.key] = row.value;
    }
  }

  const siteImages: Record<string, string> = {};
  for (const row of slotImageDocs) {
    if (typeof row.slotKey === 'string' && typeof row.imageUrl === 'string' && row.imageUrl.length > 0) {
      siteImages[row.slotKey] = row.imageUrl;
    }
  }

  const items: MediaItem[] = mediaDocs
    .map((m) => ({
      id: String(m.id || ''),
      type: (m.type === 'video' ? 'video' : 'image') as 'video' | 'image',
      title: String(m.title || 'Studio Media'),
      category: String(m.category || 'Showcase'),
      url: String(m.url || ''),
      embedUrl: typeof m.embedUrl === 'string' && m.embedUrl ? m.embedUrl : undefined,
      source: (m.source === 'youtube' || m.source === 'gdrive' ? m.source : 'gallery') as
        | 'youtube'
        | 'gdrive'
        | 'gallery',
      placement: (m.placement === 'hero' || m.placement === 'team' ? m.placement : 'showcase') as
        | 'showcase'
        | 'hero'
        | 'team',
      visible: m.visible !== false,
      createdAt: String(m.createdAtIso || ''),
    }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const teamMembers =
    teamDocs.length > 0 || synced.team
      ? teamDocs
          .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
          .map((m) => ({
            id: String(m.id || ''),
            name: String(m.name || ''),
            role: String(m.role || ''),
            specialty: String(m.specialty || ''),
            bio: String(m.bio || ''),
            image: String(m.image || ''),
            imageStyle: String(m.imageStyle || ''),
            ctaLabel: String(m.ctaLabel || ''),
            ctaUrl: String(m.ctaUrl || ''),
          }))
      : undefined;

  const services =
    serviceDocs.length > 0 || synced.services
      ? serviceDocs
          .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
          .map((s, idx) => ({
            id: String(s.id || ''),
            number: String(s.number || String(idx + 1).padStart(2, '0')),
            title: String(s.title || ''),
            subtitle: String(s.subtitle || ''),
            description: String(s.description || ''),
            deliverables: Array.isArray(s.deliverables) ? s.deliverables.map(String) : [],
            modeLabel: String(s.modeLabel || ''),
            whatsappIntent: String(s.whatsappIntent || ''),
            image: String(s.image || ''),
            imageStyle: String(s.imageStyle || ''),
            ctaLabel: String(s.ctaLabel || ''),
            ctaUrl: String(s.ctaUrl || ''),
            secondaryCtaLabel: String(s.secondaryCtaLabel || ''),
            secondaryCtaUrl: String(s.secondaryCtaUrl || ''),
          }))
      : undefined;

  const pricingTiers =
    pricingDocs.length > 0 || synced.pricing
      ? pricingDocs
          .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
          .map((p) => ({
            id: String(p.id || ''),
            name: String(p.name || ''),
            tag: String(p.tag || ''),
            priceDisplay: String(p.priceDisplay || ''),
            billingNote: String(p.billingNote || ''),
            summary: String(p.summary || ''),
            features: Array.isArray(p.features) ? p.features.map(String) : [],
            featured: Boolean(p.featured),
            whatsappService: String(p.whatsappService || ''),
            ctaLabel: String(p.ctaLabel || ''),
            ctaUrl: String(p.ctaUrl || ''),
          }))
      : undefined;

  const faqs =
    faqDocs.length > 0 || synced.faqs
      ? faqDocs
          .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
          .map((f) => ({
            id: String(f.id || ''),
            question: String(f.question || ''),
            answer: String(f.answer || ''),
          }))
      : undefined;

  const customSections: CustomSection[] = customDocs
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((c) => ({
      id: String(c.id || ''),
      pageId: (typeof c.pageId === 'string' ? c.pageId : 'home') as CustomSection['pageId'],
      kicker: String(c.kicker || ''),
      title: String(c.title || ''),
      description: String(c.description || ''),
      bullets: Array.isArray(c.bullets) ? c.bullets.map(String) : [],
      image: String(c.image || ''),
      imageStyle: String(c.imageStyle || ''),
      ctaLabel: String(c.ctaLabel || ''),
      ctaUrl: String(c.ctaUrl || ''),
      tone: (c.tone === 'light' || c.tone === 'accent' ? c.tone : 'white') as
        | 'white'
        | 'light'
        | 'accent',
    }));

  const rawLogo = typeof settingsDoc?.logoUrl === 'string' ? settingsDoc.logoUrl : '';
  const rawHero = settingsDoc?.heroAppearance as HeroAppearance | undefined;
  const rawHidden = Array.isArray(settingsDoc?.hiddenSections)
    ? settingsDoc.hiddenSections.map(String)
    : undefined;

  return {
    hasCloudData: true,
    logoUrl: settingsDoc ? (rawLogo ? rawLogo : null) : undefined,
    heroAppearance: rawHero,
    hiddenSections: rawHidden,
    syncedCollections: synced,
    siteText,
    siteImages,
    items,
    teamMembers,
    services,
    pricingTiers,
    faqs,
    customSections,
  };
}

export async function syncSettingsToFirestore(params: {
  logoUrl?: string | null;
  heroAppearance?: HeroAppearance;
  hiddenSections?: string[];
  syncedCollectionsPatch?: SyncedCollectionsMap;
}): Promise<void> {
  const uid = getVerifiedUid();
  if (!uid) return;

  const ref = doc(db, 'cms_settings', 'main');
  try {
    const snap = await getDoc(ref);
    const existingData = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
    const prevHero = (existingData?.heroAppearance as HeroAppearance) || {
      tone: 'light',
      overlayOpacity: 75,
      brightness: 100,
    };
    const nextHero = params.heroAppearance || prevHero;
    const nextLogo =
      params.logoUrl !== undefined
        ? await prepareImageValue(params.logoUrl, 850_000)
        : clampString(existingData?.logoUrl ?? '', 850_000);
    const nextHidden =
      params.hiddenSections !== undefined
        ? clampStringArray(params.hiddenSections, 50, 120)
        : clampStringArray(existingData?.hiddenSections, 50, 120);
    const prevSynced = (existingData?.syncedCollections as SyncedCollectionsMap) || {};
    const nextSynced: SyncedCollectionsMap = {
      ...(prevSynced.team !== undefined ? { team: Boolean(prevSynced.team) } : {}),
      ...(prevSynced.services !== undefined ? { services: Boolean(prevSynced.services) } : {}),
      ...(prevSynced.pricing !== undefined ? { pricing: Boolean(prevSynced.pricing) } : {}),
      ...(prevSynced.faqs !== undefined ? { faqs: Boolean(prevSynced.faqs) } : {}),
      ...(params.syncedCollectionsPatch || {}),
    };

    if (snap.exists()) {
      await updateDoc(ref, {
        heroAppearance: {
          tone: nextHero.tone === 'dark' ? 'dark' : 'light',
          overlayOpacity: Math.min(95, Math.max(0, Math.round(nextHero.overlayOpacity))),
          brightness: Math.min(160, Math.max(40, Math.round(nextHero.brightness))),
        },
        logoUrl: nextLogo,
        hiddenSections: nextHidden,
        syncedCollections: nextSynced,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        heroAppearance: {
          tone: nextHero.tone === 'dark' ? 'dark' : 'light',
          overlayOpacity: Math.min(95, Math.max(0, Math.round(nextHero.overlayOpacity))),
          brightness: Math.min(160, Math.max(40, Math.round(nextHero.brightness))),
        },
        logoUrl: nextLogo,
        hiddenSections: nextHidden,
        syncedCollections: nextSynced,
        isPublic: true,
        ownerId: uid,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'cms_settings/main');
  }
}

export async function syncTextUpdatesToFirestore(
  updates: Record<string, string | null>
): Promise<void> {
  const uid = getVerifiedUid();
  if (!uid) return;

  for (const [key, val] of Object.entries(updates)) {
    const cleanKey = clampString(key.trim(), 200);
    if (!cleanKey) continue;
    const entryId = sanitizeDocId(cleanKey);
    const ref = doc(db, 'cms_text_entries', entryId);

    try {
      if (val === null || val === '') {
        await deleteDoc(ref);
      } else {
        const snap = await getDoc(ref);
        const safeVal = clampString(val, 20000);
        if (snap.exists()) {
          await updateDoc(ref, {
            value: safeVal,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(ref, {
            key: cleanKey,
            value: safeVal,
            isPublic: true,
            ownerId: uid,
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `cms_text_entries/${entryId}`);
    }
  }
}

export async function syncSlotImageToFirestore(
  slotKey: string,
  imageUrl: string | null
): Promise<void> {
  const uid = getVerifiedUid();
  if (!uid) return;
  const cleanKey = clampString(slotKey.trim(), 160);
  if (!cleanKey) return;
  const slotId = sanitizeDocId(cleanKey);
  const ref = doc(db, 'cms_slot_images', slotId);

  try {
    if (!imageUrl) {
      await deleteDoc(ref);
      return;
    }
    const preparedUrl = await prepareImageValue(imageUrl, 850_000);
    if (!preparedUrl) {
      await deleteDoc(ref);
      return;
    }
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        imageUrl: preparedUrl,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        slotKey: cleanKey,
        imageUrl: preparedUrl,
        isPublic: true,
        ownerId: uid,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `cms_slot_images/${slotId}`);
  }
}

export async function upsertMediaItemToFirestore(item: MediaItem): Promise<void> {
  const uid = getVerifiedUid();
  if (!uid) return;
  const itemId = sanitizeDocId(item.id);
  const ref = doc(db, 'cms_media', itemId);

  try {
    const snap = await getDoc(ref);
    const preparedUrl = await prepareImageValue(item.url, 850_000);
    if (snap.exists()) {
      await updateDoc(ref, {
        title: clampString(item.title || 'Studio Media', 240),
        category: clampString(item.category || '', 120),
        visible: Boolean(item.visible),
        placement: item.placement,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        id: itemId,
        type: item.type,
        title: clampString(item.title || 'Studio Media', 240),
        category: clampString(item.category || '', 120),
        url: preparedUrl || 'about:blank',
        embedUrl: clampString(item.embedUrl || '', 1000),
        source: item.source,
        placement: item.placement,
        visible: Boolean(item.visible),
        createdAtIso: clampString(item.createdAt || new Date().toISOString(), 64),
        isPublic: true,
        ownerId: uid,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `cms_media/${itemId}`);
  }
}

export async function deleteMediaItemFromFirestore(id: string): Promise<void> {
  if (!isCloudAdminSignedIn()) return;
  const itemId = sanitizeDocId(id);
  try {
    await deleteDoc(doc(db, 'cms_media', itemId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `cms_media/${itemId}`);
  }
}

export async function syncTeamMembersToFirestore(members: TeamMember[]): Promise<void> {
  const uid = getVerifiedUid();
  if (!uid) return;

  try {
    const existingSnap = await getDocs(
      query(collection(db, 'cms_team'), where('isPublic', '==', true))
    );
    const keepIds = new Set(members.map((m) => sanitizeDocId(m.id)));
    for (const d of existingSnap.docs) {
      if (!keepIds.has(d.id)) {
        await deleteDoc(doc(db, 'cms_team', d.id));
      }
    }

    for (let idx = 0; idx < members.length; idx++) {
      const m = members[idx];
      const memberId = sanitizeDocId(m.id);
      const ref = doc(db, 'cms_team', memberId);
      const preparedImg = await prepareImageValue(m.image || '', 850_000);
      const existingDoc = existingSnap.docs.find((d) => d.id === memberId);

      const fields = {
        sortOrder: idx,
        name: clampString(m.name || 'Team Member', 200),
        role: clampString(m.role || '', 200),
        specialty: clampString(m.specialty || '', 300),
        bio: clampString(m.bio || '', 2500),
        image: preparedImg,
        imageStyle: clampString(m.imageStyle || '', 60),
        ctaLabel: clampString(m.ctaLabel || '', 120),
        ctaUrl: clampString(m.ctaUrl || '', 1000),
        updatedAt: serverTimestamp(),
      };

      if (existingDoc) {
        await updateDoc(ref, fields);
      } else {
        await setDoc(ref, {
          id: memberId,
          ...fields,
          isPublic: true,
          ownerId: uid,
        });
      }
    }

    await syncSettingsToFirestore({ syncedCollectionsPatch: { team: true } });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'cms_team');
  }
}

export async function syncServicesToFirestore(services: ServiceOffering[]): Promise<void> {
  const uid = getVerifiedUid();
  if (!uid) return;

  try {
    const existingSnap = await getDocs(
      query(collection(db, 'cms_services'), where('isPublic', '==', true))
    );
    const keepIds = new Set(services.map((s) => sanitizeDocId(s.id)));
    for (const d of existingSnap.docs) {
      if (!keepIds.has(d.id)) {
        await deleteDoc(doc(db, 'cms_services', d.id));
      }
    }

    for (let idx = 0; idx < services.length; idx++) {
      const s = services[idx];
      const serviceId = sanitizeDocId(s.id);
      const ref = doc(db, 'cms_services', serviceId);
      const preparedImg = await prepareImageValue(s.image || '', 850_000);
      const existingDoc = existingSnap.docs.find((d) => d.id === serviceId);

      const fields = {
        number: clampString(String(idx + 1).padStart(2, '0'), 16),
        sortOrder: idx,
        title: clampString(s.title || 'Service', 240),
        subtitle: clampString(s.subtitle || '', 300),
        description: clampString(s.description || '', 3000),
        deliverables: clampStringArray(s.deliverables, 30, 300),
        modeLabel: clampString(s.modeLabel || '', 120),
        whatsappIntent: clampString(s.whatsappIntent || s.title || '', 240),
        image: preparedImg,
        imageStyle: clampString(s.imageStyle || '', 60),
        ctaLabel: clampString(s.ctaLabel || '', 120),
        ctaUrl: clampString(s.ctaUrl || '', 1000),
        secondaryCtaLabel: clampString(s.secondaryCtaLabel || '', 120),
        secondaryCtaUrl: clampString(s.secondaryCtaUrl || '', 1000),
        updatedAt: serverTimestamp(),
      };

      if (existingDoc) {
        await updateDoc(ref, fields);
      } else {
        await setDoc(ref, {
          id: serviceId,
          ...fields,
          isPublic: true,
          ownerId: uid,
        });
      }
    }

    await syncSettingsToFirestore({ syncedCollectionsPatch: { services: true } });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'cms_services');
  }
}

export async function syncPricingToFirestore(tiers: PricingTier[]): Promise<void> {
  const uid = getVerifiedUid();
  if (!uid) return;

  try {
    const existingSnap = await getDocs(
      query(collection(db, 'cms_pricing'), where('isPublic', '==', true))
    );
    const keepIds = new Set(tiers.map((t) => sanitizeDocId(t.id)));
    for (const d of existingSnap.docs) {
      if (!keepIds.has(d.id)) {
        await deleteDoc(doc(db, 'cms_pricing', d.id));
      }
    }

    for (let idx = 0; idx < tiers.length; idx++) {
      const p = tiers[idx];
      const tierId = sanitizeDocId(p.id);
      const ref = doc(db, 'cms_pricing', tierId);
      const existingDoc = existingSnap.docs.find((d) => d.id === tierId);

      const fields = {
        sortOrder: idx,
        name: clampString(p.name || 'Package', 200),
        tag: clampString(p.tag || 'Package', 120),
        priceDisplay: clampString(p.priceDisplay || 'Custom Quote', 120),
        billingNote: clampString(p.billingNote || '', 200),
        summary: clampString(p.summary || '', 2000),
        features: clampStringArray(p.features, 30, 300),
        featured: Boolean(p.featured),
        whatsappService: clampString(p.whatsappService || p.name || '', 240),
        ctaLabel: clampString(p.ctaLabel || '', 120),
        ctaUrl: clampString(p.ctaUrl || '', 1000),
        updatedAt: serverTimestamp(),
      };

      if (existingDoc) {
        await updateDoc(ref, fields);
      } else {
        await setDoc(ref, {
          id: tierId,
          ...fields,
          isPublic: true,
          ownerId: uid,
        });
      }
    }

    await syncSettingsToFirestore({ syncedCollectionsPatch: { pricing: true } });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'cms_pricing');
  }
}

export async function syncFaqsToFirestore(faqs: FaqEntry[]): Promise<void> {
  const uid = getVerifiedUid();
  if (!uid) return;

  try {
    const existingSnap = await getDocs(
      query(collection(db, 'cms_faqs'), where('isPublic', '==', true))
    );
    const keepIds = new Set(faqs.map((f) => sanitizeDocId(f.id)));
    for (const d of existingSnap.docs) {
      if (!keepIds.has(d.id)) {
        await deleteDoc(doc(db, 'cms_faqs', d.id));
      }
    }

    for (let idx = 0; idx < faqs.length; idx++) {
      const f = faqs[idx];
      const faqId = sanitizeDocId(f.id);
      const ref = doc(db, 'cms_faqs', faqId);
      const existingDoc = existingSnap.docs.find((d) => d.id === faqId);

      const fields = {
        sortOrder: idx,
        question: clampString(f.question || 'Question', 500),
        answer: clampString(f.answer || '', 4000),
        updatedAt: serverTimestamp(),
      };

      if (existingDoc) {
        await updateDoc(ref, fields);
      } else {
        await setDoc(ref, {
          id: faqId,
          ...fields,
          isPublic: true,
          ownerId: uid,
        });
      }
    }

    await syncSettingsToFirestore({ syncedCollectionsPatch: { faqs: true } });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'cms_faqs');
  }
}

export async function syncCustomSectionsToFirestore(sections: CustomSection[]): Promise<void> {
  const uid = getVerifiedUid();
  if (!uid) return;

  try {
    const existingSnap = await getDocs(
      query(collection(db, 'cms_custom_sections'), where('isPublic', '==', true))
    );
    const keepIds = new Set(sections.map((s) => sanitizeDocId(s.id)));
    for (const d of existingSnap.docs) {
      if (!keepIds.has(d.id)) {
        await deleteDoc(doc(db, 'cms_custom_sections', d.id));
      }
    }

    for (let idx = 0; idx < sections.length; idx++) {
      const c = sections[idx];
      const sectionId = sanitizeDocId(c.id);
      const ref = doc(db, 'cms_custom_sections', sectionId);
      const preparedImg = await prepareImageValue(c.image || '', 850_000);
      const existingDoc = existingSnap.docs.find((d) => d.id === sectionId);

      const fields = {
        sortOrder: idx,
        pageId: c.pageId,
        kicker: clampString(c.kicker || '', 200),
        title: clampString(c.title || 'New Section', 240),
        description: clampString(c.description || '', 4000),
        bullets: clampStringArray(c.bullets, 30, 300),
        image: preparedImg,
        imageStyle: clampString(c.imageStyle || '', 60),
        ctaLabel: clampString(c.ctaLabel || '', 120),
        ctaUrl: clampString(c.ctaUrl || '', 1000),
        tone: (c.tone === 'light' || c.tone === 'accent' ? c.tone : 'white') as
          | 'white'
          | 'light'
          | 'accent',
        updatedAt: serverTimestamp(),
      };

      if (existingDoc) {
        await updateDoc(ref, fields);
      } else {
        await setDoc(ref, {
          id: sectionId,
          ...fields,
          isPublic: true,
          ownerId: uid,
        });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'cms_custom_sections');
  }
}

export async function syncAllCmsToFirestore(cms: CmsContent): Promise<void> {
  if (!isCloudAdminSignedIn()) return;

  await syncSettingsToFirestore({
    logoUrl: cms.logoUrl,
    heroAppearance: cms.heroAppearance,
    hiddenSections: cms.hiddenSections,
    syncedCollectionsPatch: {
      team: true,
      services: true,
      pricing: true,
      faqs: true,
    },
  });

  if (Object.keys(cms.siteText).length > 0) {
    await syncTextUpdatesToFirestore(cms.siteText);
  }

  for (const [slotKey, url] of Object.entries(cms.siteImages)) {
    await syncSlotImageToFirestore(slotKey, url);
  }

  for (const item of cms.items) {
    await upsertMediaItemToFirestore(item);
  }

  await Promise.all([
    syncTeamMembersToFirestore(cms.teamMembers),
    syncServicesToFirestore(cms.services),
    syncPricingToFirestore(cms.pricingTiers),
    syncFaqsToFirestore(cms.faqs),
    syncCustomSectionsToFirestore(cms.customSections),
  ]);
}
