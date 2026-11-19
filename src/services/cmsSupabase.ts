import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../supabase';
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
import { ADMIN_EMAIL, type CloudCmsResult, type SyncedCollectionsMap } from './cmsFirestore';

let cachedSupabaseUser: SupabaseUser | null = null;

if (supabase) {
  void supabase.auth.getSession().then(({ data }) => {
    cachedSupabaseUser = data.session?.user ?? null;
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedSupabaseUser = session?.user ?? null;
  });
}

export function getCachedSupabaseUser(): SupabaseUser | null {
  return cachedSupabaseUser;
}

export function isSupabaseAdminUser(user: SupabaseUser | null | undefined): boolean {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function isSupabaseAdminSignedIn(): boolean {
  return Boolean(supabase && isSupabaseAdminUser(cachedSupabaseUser));
}

async function getVerifiedSupabaseAdminEmail(): Promise<string | null> {
  if (!supabase) return null;
  if (isSupabaseAdminUser(cachedSupabaseUser)) {
    return cachedSupabaseUser!.email || ADMIN_EMAIL;
  }
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user ?? null;
  cachedSupabaseUser = user;
  if (isSupabaseAdminUser(user)) {
    return user!.email || ADMIN_EMAIL;
  }
  return null;
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

async function prepareImageValue(
  rawUrl: string | null | undefined,
  maxBytes = 850_000
): Promise<string> {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:image/')) {
    const compressed = await compressImageDataUrl(trimmed, Math.min(maxBytes, 700_000));
    return compressed.slice(0, maxBytes);
  }
  return trimmed.slice(0, maxBytes);
}

export async function verifySupabaseTablesReady(): Promise<{
  ready: boolean;
  missingTablesError?: string;
}> {
  if (!supabase) {
    return { ready: false, missingTablesError: 'Supabase client is not configured.' };
  }
  const { error } = await supabase.from('cms_settings').select('id').limit(1);
  if (error) {
    return { ready: false, missingTablesError: error.message };
  }
  return { ready: true };
}

export async function loadCmsFromSupabase(): Promise<CloudCmsResult> {
  if (!supabase) return { hasCloudData: false };

  try {
    const [
      settingsRes,
      textRes,
      slotRes,
      mediaRes,
      teamRes,
      servicesRes,
      pricingRes,
      faqRes,
      customRes,
    ] = await Promise.all([
      supabase.from('cms_settings').select('*').eq('id', 'main').maybeSingle(),
      supabase.from('cms_text_entries').select('*').eq('is_public', true),
      supabase.from('cms_slot_images').select('*').eq('is_public', true),
      supabase
        .from('cms_media')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('cms_team')
        .select('*')
        .eq('is_public', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('cms_services')
        .select('*')
        .eq('is_public', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('cms_pricing')
        .select('*')
        .eq('is_public', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('cms_faqs')
        .select('*')
        .eq('is_public', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('cms_custom_sections')
        .select('*')
        .eq('is_public', true)
        .order('sort_order', { ascending: true }),
    ]);

    if (settingsRes.error) {
      return { hasCloudData: false };
    }

    const settingsRow = settingsRes.data as Record<string, unknown> | null;
    const textRows = (textRes.data || []) as Record<string, unknown>[];
    const slotRows = (slotRes.data || []) as Record<string, unknown>[];
    const mediaRows = (mediaRes.data || []) as Record<string, unknown>[];
    const teamRows = (teamRes.data || []) as Record<string, unknown>[];
    const serviceRows = (servicesRes.data || []) as Record<string, unknown>[];
    const pricingRows = (pricingRes.data || []) as Record<string, unknown>[];
    const faqRows = (faqRes.data || []) as Record<string, unknown>[];
    const customRows = (customRes.data || []) as Record<string, unknown>[];

    const synced = (settingsRow?.synced_collections as SyncedCollectionsMap) || {};
    const heroRaw = settingsRow?.hero_appearance as HeroAppearance | undefined;
    const heroCustomized = Boolean(
      heroRaw &&
        (heroRaw.tone !== 'light' ||
          heroRaw.overlayOpacity !== 75 ||
          heroRaw.brightness !== 100)
    );
    const hasSettingsEdits = Boolean(
      settingsRow &&
        (String(settingsRow.logo_url || '').trim().length > 0 ||
          (Array.isArray(settingsRow.hidden_sections) && settingsRow.hidden_sections.length > 0) ||
          Object.keys(synced).length > 0 ||
          heroCustomized)
    );

    const hasCloudData = Boolean(
      hasSettingsEdits ||
        textRows.length > 0 ||
        slotRows.length > 0 ||
        mediaRows.length > 0 ||
        teamRows.length > 0 ||
        serviceRows.length > 0 ||
        pricingRows.length > 0 ||
        faqRows.length > 0 ||
        customRows.length > 0
    );

    if (!hasCloudData) {
      return { hasCloudData: false };
    }

    const siteText: Record<string, string> = {};
    for (const row of textRows) {
      if (typeof row.key === 'string' && typeof row.value === 'string' && row.value.length > 0) {
        siteText[row.key] = row.value;
      }
    }

    const siteImages: Record<string, string> = {};
    for (const row of slotRows) {
      if (
        typeof row.slot_key === 'string' &&
        typeof row.image_url === 'string' &&
        row.image_url.length > 0
      ) {
        siteImages[row.slot_key] = row.image_url;
      }
    }

    const items: MediaItem[] = mediaRows.map((m) => ({
      id: String(m.id || ''),
      type: (m.type === 'video' ? 'video' : 'image') as 'video' | 'image',
      title: String(m.title || 'Studio Media'),
      category: String(m.category || 'Showcase'),
      url: String(m.url || ''),
      embedUrl: typeof m.embed_url === 'string' && m.embed_url ? m.embed_url : undefined,
      source: (m.source === 'youtube' || m.source === 'gdrive' ? m.source : 'gallery') as
        | 'youtube'
        | 'gdrive'
        | 'gallery',
      placement: (m.placement === 'hero' || m.placement === 'team' ? m.placement : 'showcase') as
        | 'showcase'
        | 'hero'
        | 'team',
      visible: m.visible !== false,
      createdAt: String(m.created_at || ''),
    }));

    const teamMembers: TeamMember[] | undefined =
      teamRows.length > 0 || synced.team
        ? teamRows.map((m) => ({
            id: String(m.id || ''),
            name: String(m.name || ''),
            role: String(m.role || ''),
            specialty: String(m.specialty || ''),
            bio: String(m.bio || ''),
            image: String(m.image || ''),
            imageStyle: String(m.image_style || ''),
            ctaLabel: String(m.cta_label || ''),
            ctaUrl: String(m.cta_url || ''),
          }))
        : undefined;

    const services: ServiceOffering[] | undefined =
      serviceRows.length > 0 || synced.services
        ? serviceRows.map((s, idx) => ({
            id: String(s.id || ''),
            number: String(s.number || String(idx + 1).padStart(2, '0')),
            title: String(s.title || ''),
            subtitle: String(s.subtitle || ''),
            description: String(s.description || ''),
            deliverables: Array.isArray(s.deliverables) ? s.deliverables.map(String) : [],
            modeLabel: String(s.mode_label || ''),
            whatsappIntent: String(s.whatsapp_intent || ''),
            image: String(s.image || ''),
            imageStyle: String(s.image_style || ''),
            ctaLabel: String(s.cta_label || ''),
            ctaUrl: String(s.cta_url || ''),
            secondaryCtaLabel: String(s.secondary_cta_label || ''),
            secondaryCtaUrl: String(s.secondary_cta_url || ''),
          }))
        : undefined;

    const pricingTiers: PricingTier[] | undefined =
      pricingRows.length > 0 || synced.pricing
        ? pricingRows.map((p) => ({
            id: String(p.id || ''),
            name: String(p.name || ''),
            tag: String(p.tag || ''),
            priceDisplay: String(p.price_display || ''),
            billingNote: String(p.billing_note || ''),
            summary: String(p.summary || ''),
            features: Array.isArray(p.features) ? p.features.map(String) : [],
            featured: Boolean(p.featured),
            whatsappService: String(p.whatsapp_service || ''),
            ctaLabel: String(p.cta_label || ''),
            ctaUrl: String(p.cta_url || ''),
          }))
        : undefined;

    const faqs: FaqEntry[] | undefined =
      faqRows.length > 0 || synced.faqs
        ? faqRows.map((f) => ({
            id: String(f.id || ''),
            question: String(f.question || ''),
            answer: String(f.answer || ''),
          }))
        : undefined;

    const customSections: CustomSection[] = customRows.map((c) => ({
      id: String(c.id || ''),
      pageId: (typeof c.page_id === 'string' ? c.page_id : 'home') as CustomSection['pageId'],
      kicker: String(c.kicker || ''),
      title: String(c.title || ''),
      description: String(c.description || ''),
      bullets: Array.isArray(c.bullets) ? c.bullets.map(String) : [],
      image: String(c.image || ''),
      imageStyle: String(c.image_style || ''),
      ctaLabel: String(c.cta_label || ''),
      ctaUrl: String(c.cta_url || ''),
      tone: (c.tone === 'light' || c.tone === 'accent' ? c.tone : 'white') as
        | 'white'
        | 'light'
        | 'accent',
    }));

    const rawLogo = typeof settingsRow?.logo_url === 'string' ? settingsRow.logo_url : '';
    const rawHidden = Array.isArray(settingsRow?.hidden_sections)
      ? settingsRow.hidden_sections.map(String)
      : undefined;

    return {
      hasCloudData: true,
      logoUrl: settingsRow ? (rawLogo ? rawLogo : null) : undefined,
      heroAppearance: heroRaw,
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
  } catch {
    return { hasCloudData: false };
  }
}

export async function syncSettingsToSupabase(params: {
  logoUrl?: string | null;
  heroAppearance?: HeroAppearance;
  hiddenSections?: string[];
  syncedCollectionsPatch?: SyncedCollectionsMap;
}): Promise<void> {
  if (!supabase) return;
  const email = await getVerifiedSupabaseAdminEmail();
  if (!email) return;

  const { data: existingRow } = await supabase
    .from('cms_settings')
    .select('*')
    .eq('id', 'main')
    .maybeSingle();

  const existing = existingRow as Record<string, unknown> | null;
  const prevHero = (existing?.hero_appearance as HeroAppearance) || {
    tone: 'light',
    overlayOpacity: 75,
    brightness: 100,
  };
  const nextHero = params.heroAppearance || prevHero;
  const nextLogo =
    params.logoUrl !== undefined
      ? await prepareImageValue(params.logoUrl, 850_000)
      : clampString(existing?.logo_url ?? '', 850_000);
  const nextHidden =
    params.hiddenSections !== undefined
      ? clampStringArray(params.hiddenSections, 50, 120)
      : clampStringArray(existing?.hidden_sections, 50, 120);
  const prevSynced = (existing?.synced_collections as SyncedCollectionsMap) || {};
  const nextSynced: SyncedCollectionsMap = {
    ...(prevSynced.team !== undefined ? { team: Boolean(prevSynced.team) } : {}),
    ...(prevSynced.services !== undefined ? { services: Boolean(prevSynced.services) } : {}),
    ...(prevSynced.pricing !== undefined ? { pricing: Boolean(prevSynced.pricing) } : {}),
    ...(prevSynced.faqs !== undefined ? { faqs: Boolean(prevSynced.faqs) } : {}),
    ...(params.syncedCollectionsPatch || {}),
  };

  const { error } = await supabase.from('cms_settings').upsert(
    {
      id: 'main',
      logo_url: nextLogo,
      hero_appearance: {
        tone: nextHero.tone === 'dark' ? 'dark' : 'light',
        overlayOpacity: Math.min(95, Math.max(0, Math.round(nextHero.overlayOpacity))),
        brightness: Math.min(160, Math.max(40, Math.round(nextHero.brightness))),
      },
      hidden_sections: nextHidden,
      synced_collections: nextSynced,
      is_public: true,
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncTextUpdatesToSupabase(
  updates: Record<string, string | null>
): Promise<void> {
  if (!supabase) return;
  const email = await getVerifiedSupabaseAdminEmail();
  if (!email) return;

  const deleteKeys: string[] = [];
  const upsertRows: { key: string; value: string; is_public: boolean }[] = [];

  for (const [key, val] of Object.entries(updates)) {
    const cleanKey = clampString(key.trim(), 200);
    if (!cleanKey) continue;
    if (val === null || val === '') {
      deleteKeys.push(cleanKey);
    } else {
      upsertRows.push({
        key: cleanKey,
        value: clampString(val, 20000),
        is_public: true,
      });
    }
  }

  if (deleteKeys.length > 0) {
    const { error } = await supabase.from('cms_text_entries').delete().in('key', deleteKeys);
    if (error) throw new Error(error.message);
  }

  if (upsertRows.length > 0) {
    const { error } = await supabase
      .from('cms_text_entries')
      .upsert(upsertRows, { onConflict: 'key' });
    if (error) throw new Error(error.message);
  }
}

export async function syncSlotImageToSupabase(
  slotKey: string,
  imageUrl: string | null
): Promise<void> {
  if (!supabase) return;
  const email = await getVerifiedSupabaseAdminEmail();
  if (!email) return;

  const cleanKey = clampString(slotKey.trim(), 160);
  if (!cleanKey) return;

  if (!imageUrl) {
    const { error } = await supabase.from('cms_slot_images').delete().eq('slot_key', cleanKey);
    if (error) throw new Error(error.message);
    return;
  }

  const preparedUrl = await prepareImageValue(imageUrl, 850_000);
  if (!preparedUrl) {
    const { error } = await supabase.from('cms_slot_images').delete().eq('slot_key', cleanKey);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from('cms_slot_images').upsert(
    {
      slot_key: cleanKey,
      image_url: preparedUrl,
      is_public: true,
    },
    { onConflict: 'slot_key' }
  );
  if (error) throw new Error(error.message);
}

export async function upsertMediaItemToSupabase(item: MediaItem): Promise<void> {
  if (!supabase) return;
  const email = await getVerifiedSupabaseAdminEmail();
  if (!email) return;

  const preparedUrl = await prepareImageValue(item.url, 850_000);
  const { error } = await supabase.from('cms_media').upsert(
    {
      id: clampString(item.id, 128),
      type: item.type,
      title: clampString(item.title || 'Studio Media', 240),
      category: clampString(item.category || 'Showcase', 120),
      url: preparedUrl || 'about:blank',
      embed_url: item.embedUrl ? clampString(item.embedUrl, 1000) : null,
      source: item.source,
      placement: item.placement,
      visible: Boolean(item.visible),
      created_at: item.createdAt || new Date().toISOString(),
      is_public: true,
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(error.message);
}

export async function deleteMediaItemFromSupabase(id: string): Promise<void> {
  if (!supabase) return;
  const email = await getVerifiedSupabaseAdminEmail();
  if (!email) return;

  const { error } = await supabase.from('cms_media').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function syncTeamMembersToSupabase(members: TeamMember[]): Promise<void> {
  if (!supabase) return;
  const email = await getVerifiedSupabaseAdminEmail();
  if (!email) return;

  const { data: existingRows, error: fetchErr } = await supabase.from('cms_team').select('id');
  if (fetchErr) throw new Error(fetchErr.message);

  const keepIds = new Set(members.map((m) => clampString(m.id, 128)));
  const removeIds = (existingRows || [])
    .map((r) => String((r as { id: string }).id))
    .filter((id) => !keepIds.has(id));

  if (removeIds.length > 0) {
    const { error } = await supabase.from('cms_team').delete().in('id', removeIds);
    if (error) throw new Error(error.message);
  }

  if (members.length > 0) {
    const rows = await Promise.all(
      members.map(async (m, idx) => ({
        id: clampString(m.id, 128),
        sort_order: idx,
        name: clampString(m.name || 'Team Member', 200),
        role: clampString(m.role || '', 200),
        specialty: clampString(m.specialty || '', 300),
        bio: clampString(m.bio || '', 2500),
        image: await prepareImageValue(m.image || '', 850_000),
        image_style: clampString(m.imageStyle || 'standard', 60),
        cta_label: clampString(m.ctaLabel || '', 120),
        cta_url: clampString(m.ctaUrl || '', 1000),
        is_public: true,
      }))
    );
    const { error } = await supabase.from('cms_team').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  await syncSettingsToSupabase({ syncedCollectionsPatch: { team: true } });
}

export async function syncServicesToSupabase(services: ServiceOffering[]): Promise<void> {
  if (!supabase) return;
  const email = await getVerifiedSupabaseAdminEmail();
  if (!email) return;

  const { data: existingRows, error: fetchErr } = await supabase.from('cms_services').select('id');
  if (fetchErr) throw new Error(fetchErr.message);

  const keepIds = new Set(services.map((s) => clampString(s.id, 128)));
  const removeIds = (existingRows || [])
    .map((r) => String((r as { id: string }).id))
    .filter((id) => !keepIds.has(id));

  if (removeIds.length > 0) {
    const { error } = await supabase.from('cms_services').delete().in('id', removeIds);
    if (error) throw new Error(error.message);
  }

  if (services.length > 0) {
    const rows = await Promise.all(
      services.map(async (s, idx) => ({
        id: clampString(s.id, 128),
        number: clampString(String(idx + 1).padStart(2, '0'), 16),
        sort_order: idx,
        title: clampString(s.title || 'Service', 240),
        subtitle: clampString(s.subtitle || '', 300),
        description: clampString(s.description || '', 3000),
        deliverables: clampStringArray(s.deliverables, 30, 300),
        mode_label: clampString(s.modeLabel || '', 120),
        whatsapp_intent: clampString(s.whatsappIntent || s.title || '', 240),
        image: await prepareImageValue(s.image || '', 850_000),
        image_style: clampString(s.imageStyle || 'standard', 60),
        cta_label: clampString(s.ctaLabel || '', 120),
        cta_url: clampString(s.ctaUrl || '', 1000),
        secondary_cta_label: clampString(s.secondaryCtaLabel || '', 120),
        secondary_cta_url: clampString(s.secondaryCtaUrl || '', 1000),
        is_public: true,
      }))
    );
    const { error } = await supabase.from('cms_services').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  await syncSettingsToSupabase({ syncedCollectionsPatch: { services: true } });
}

export async function syncPricingToSupabase(tiers: PricingTier[]): Promise<void> {
  if (!supabase) return;
  const email = await getVerifiedSupabaseAdminEmail();
  if (!email) return;

  const { data: existingRows, error: fetchErr } = await supabase.from('cms_pricing').select('id');
  if (fetchErr) throw new Error(fetchErr.message);

  const keepIds = new Set(tiers.map((t) => clampString(t.id, 128)));
  const removeIds = (existingRows || [])
    .map((r) => String((r as { id: string }).id))
    .filter((id) => !keepIds.has(id));

  if (removeIds.length > 0) {
    const { error } = await supabase.from('cms_pricing').delete().in('id', removeIds);
    if (error) throw new Error(error.message);
  }

  if (tiers.length > 0) {
    const rows = tiers.map((p, idx) => ({
      id: clampString(p.id, 128),
      sort_order: idx,
      name: clampString(p.name || 'Package', 200),
      tag: clampString(p.tag || 'Package', 120),
      price_display: clampString(p.priceDisplay || 'Custom Quote', 120),
      billing_note: clampString(p.billingNote || '', 200),
      summary: clampString(p.summary || '', 2000),
      features: clampStringArray(p.features, 30, 300),
      featured: Boolean(p.featured),
      whatsapp_service: clampString(p.whatsappService || p.name || '', 240),
      cta_label: clampString(p.ctaLabel || '', 120),
      cta_url: clampString(p.ctaUrl || '', 1000),
      is_public: true,
    }));
    const { error } = await supabase.from('cms_pricing').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  await syncSettingsToSupabase({ syncedCollectionsPatch: { pricing: true } });
}

export async function syncFaqsToSupabase(faqs: FaqEntry[]): Promise<void> {
  if (!supabase) return;
  const email = await getVerifiedSupabaseAdminEmail();
  if (!email) return;

  const { data: existingRows, error: fetchErr } = await supabase.from('cms_faqs').select('id');
  if (fetchErr) throw new Error(fetchErr.message);

  const keepIds = new Set(faqs.map((f) => clampString(f.id, 128)));
  const removeIds = (existingRows || [])
    .map((r) => String((r as { id: string }).id))
    .filter((id) => !keepIds.has(id));

  if (removeIds.length > 0) {
    const { error } = await supabase.from('cms_faqs').delete().in('id', removeIds);
    if (error) throw new Error(error.message);
  }

  if (faqs.length > 0) {
    const rows = faqs.map((f, idx) => ({
      id: clampString(f.id, 128),
      sort_order: idx,
      question: clampString(f.question || 'Question', 500),
      answer: clampString(f.answer || '', 4000),
      is_public: true,
    }));
    const { error } = await supabase.from('cms_faqs').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  await syncSettingsToSupabase({ syncedCollectionsPatch: { faqs: true } });
}

export async function syncCustomSectionsToSupabase(sections: CustomSection[]): Promise<void> {
  if (!supabase) return;
  const email = await getVerifiedSupabaseAdminEmail();
  if (!email) return;

  const { data: existingRows, error: fetchErr } = await supabase
    .from('cms_custom_sections')
    .select('id');
  if (fetchErr) throw new Error(fetchErr.message);

  const keepIds = new Set(sections.map((s) => clampString(s.id, 128)));
  const removeIds = (existingRows || [])
    .map((r) => String((r as { id: string }).id))
    .filter((id) => !keepIds.has(id));

  if (removeIds.length > 0) {
    const { error } = await supabase.from('cms_custom_sections').delete().in('id', removeIds);
    if (error) throw new Error(error.message);
  }

  if (sections.length > 0) {
    const rows = await Promise.all(
      sections.map(async (c, idx) => ({
        id: clampString(c.id, 128),
        sort_order: idx,
        page_id: c.pageId,
        kicker: clampString(c.kicker || '', 200),
        title: clampString(c.title || 'New Section', 240),
        description: clampString(c.description || '', 4000),
        bullets: clampStringArray(c.bullets, 30, 300),
        image: await prepareImageValue(c.image || '', 850_000),
        image_style: clampString(c.imageStyle || 'standard', 60),
        cta_label: clampString(c.ctaLabel || '', 120),
        cta_url: clampString(c.ctaUrl || '', 1000),
        tone: (c.tone === 'light' || c.tone === 'accent' ? c.tone : 'white') as
          | 'white'
          | 'light'
          | 'accent',
        is_public: true,
      }))
    );
    const { error } = await supabase
      .from('cms_custom_sections')
      .upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }
}

export async function syncAllCmsToSupabase(cms: CmsContent): Promise<void> {
  const email = await getVerifiedSupabaseAdminEmail();
  if (!email) {
    throw new Error(`Please sign in to Supabase with ${ADMIN_EMAIL} first.`);
  }

  await syncSettingsToSupabase({
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
    await syncTextUpdatesToSupabase(cms.siteText);
  }

  for (const [slotKey, url] of Object.entries(cms.siteImages)) {
    await syncSlotImageToSupabase(slotKey, url);
  }

  for (const item of cms.items) {
    await upsertMediaItemToSupabase(item);
  }

  await Promise.all([
    syncTeamMembersToSupabase(cms.teamMembers),
    syncServicesToSupabase(cms.services),
    syncPricingToSupabase(cms.pricingTiers),
    syncFaqsToSupabase(cms.faqs),
    syncCustomSectionsToSupabase(cms.customSections),
  ]);
}
