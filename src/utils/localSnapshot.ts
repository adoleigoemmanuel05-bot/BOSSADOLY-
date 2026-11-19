import type { CmsContent } from '../types/content';

const DB_NAME = 'bossadoly_cms_db';
const STORE_NAME = 'snapshots';
const RECORD_KEY = 'full_cms_v1';
const LS_META_KEY = 'bossadoly_cms_snapshot_meta_v1';

export interface LocalCmsSnapshot {
  savedAt: number;
  content: CmsContent;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });
}

export async function saveLocalCmsSnapshot(content: CmsContent): Promise<void> {
  const payload: LocalCmsSnapshot = {
    savedAt: Date.now(),
    content,
  };

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(payload, RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
    });
    db.close();
  } catch {
    // Fallback to localStorage if IndexedDB is blocked
  }

  try {
    const serialized = JSON.stringify(payload);
    if (serialized.length <= 3_500_000) {
      localStorage.setItem(LS_META_KEY, serialized);
    }
  } catch {
    // Ignore localStorage quota limits when large images exist (IndexedDB covers them)
  }
}

export async function loadLocalCmsSnapshot(): Promise<LocalCmsSnapshot | null> {
  try {
    const db = await openDb();
    const record = await new Promise<LocalCmsSnapshot | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(RECORD_KEY);
      req.onsuccess = () => resolve((req.result as LocalCmsSnapshot) || null);
      req.onerror = () => resolve(null);
    });
    db.close();
    if (record && record.content) {
      return record;
    }
  } catch {
    // Fall back to localStorage
  }

  try {
    const raw = localStorage.getItem(LS_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalCmsSnapshot;
    if (parsed && parsed.content) return parsed;
  } catch {
    // Ignore malformed fallback
  }

  return null;
}

export function isCmsEdited(content: CmsContent, defaultCounts: {
  teamCount: number;
  servicesCount: number;
  pricingCount: number;
  faqsCount: number;
}): boolean {
  if (content.logoUrl) return true;
  if (Object.keys(content.siteText).length > 0) return true;
  if (Object.keys(content.siteImages).length > 0) return true;
  if (content.items.length > 0) return true;
  if (content.customSections.length > 0) return true;
  if (content.hiddenSections.length > 0) return true;
  if (
    content.heroAppearance.tone !== 'light' ||
    content.heroAppearance.overlayOpacity !== 75 ||
    content.heroAppearance.brightness !== 100
  ) {
    return true;
  }
  if (
    content.teamMembers.length !== defaultCounts.teamCount ||
    content.services.length !== defaultCounts.servicesCount ||
    content.pricingTiers.length !== defaultCounts.pricingCount ||
    content.faqs.length !== defaultCounts.faqsCount
  ) {
    return true;
  }
  return false;
}
