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
import {
  ADMIN_EMAIL,
  deleteMediaItemFromFirestore,
  isCloudAdminSignedIn as isFirestoreAdminSignedIn,
  loadCmsFromFirestore,
  syncAllCmsToFirestore,
  syncCustomSectionsToFirestore,
  syncFaqsToFirestore,
  syncPricingToFirestore,
  syncServicesToFirestore,
  syncSettingsToFirestore,
  syncSlotImageToFirestore,
  syncTeamMembersToFirestore,
  syncTextUpdatesToFirestore,
  upsertMediaItemToFirestore,
  type CloudCmsResult,
  type SyncedCollectionsMap,
} from './cmsFirestore';
import {
  deleteMediaItemFromSupabase,
  isSupabaseAdminSignedIn,
  loadCmsFromSupabase,
  syncAllCmsToSupabase,
  syncCustomSectionsToSupabase,
  syncFaqsToSupabase,
  syncPricingToSupabase,
  syncServicesToSupabase,
  syncSettingsToSupabase,
  syncSlotImageToSupabase,
  syncTeamMembersToSupabase,
  syncTextUpdatesToSupabase,
  upsertMediaItemToSupabase,
} from './cmsSupabase';

export { ADMIN_EMAIL, type CloudCmsResult, type SyncedCollectionsMap };

export function isCloudAdminSignedIn(): boolean {
  return isSupabaseAdminSignedIn() || isFirestoreAdminSignedIn();
}

export async function loadCmsFromCloud(): Promise<CloudCmsResult> {
  const supabaseData = await loadCmsFromSupabase();
  if (supabaseData.hasCloudData) {
    return supabaseData;
  }
  return loadCmsFromFirestore();
}

export async function syncSettingsToCloud(params: {
  logoUrl?: string | null;
  heroAppearance?: HeroAppearance;
  hiddenSections?: string[];
  syncedCollectionsPatch?: SyncedCollectionsMap;
}): Promise<void> {
  await Promise.all([
    isSupabaseAdminSignedIn() ? syncSettingsToSupabase(params) : Promise.resolve(),
    isFirestoreAdminSignedIn() ? syncSettingsToFirestore(params) : Promise.resolve(),
  ]);
}

export async function syncTextUpdatesToCloud(
  updates: Record<string, string | null>
): Promise<void> {
  await Promise.all([
    isSupabaseAdminSignedIn() ? syncTextUpdatesToSupabase(updates) : Promise.resolve(),
    isFirestoreAdminSignedIn() ? syncTextUpdatesToFirestore(updates) : Promise.resolve(),
  ]);
}

export async function syncSlotImageToCloud(
  slotKey: string,
  imageUrl: string | null
): Promise<void> {
  await Promise.all([
    isSupabaseAdminSignedIn() ? syncSlotImageToSupabase(slotKey, imageUrl) : Promise.resolve(),
    isFirestoreAdminSignedIn() ? syncSlotImageToFirestore(slotKey, imageUrl) : Promise.resolve(),
  ]);
}

export async function upsertMediaItemToCloud(item: MediaItem): Promise<void> {
  await Promise.all([
    isSupabaseAdminSignedIn() ? upsertMediaItemToSupabase(item) : Promise.resolve(),
    isFirestoreAdminSignedIn() ? upsertMediaItemToFirestore(item) : Promise.resolve(),
  ]);
}

export async function deleteMediaItemFromCloud(id: string): Promise<void> {
  await Promise.all([
    isSupabaseAdminSignedIn() ? deleteMediaItemFromSupabase(id) : Promise.resolve(),
    isFirestoreAdminSignedIn() ? deleteMediaItemFromFirestore(id) : Promise.resolve(),
  ]);
}

export async function syncTeamMembersToCloud(members: TeamMember[]): Promise<void> {
  await Promise.all([
    isSupabaseAdminSignedIn() ? syncTeamMembersToSupabase(members) : Promise.resolve(),
    isFirestoreAdminSignedIn() ? syncTeamMembersToFirestore(members) : Promise.resolve(),
  ]);
}

export async function syncServicesToCloud(services: ServiceOffering[]): Promise<void> {
  await Promise.all([
    isSupabaseAdminSignedIn() ? syncServicesToSupabase(services) : Promise.resolve(),
    isFirestoreAdminSignedIn() ? syncServicesToFirestore(services) : Promise.resolve(),
  ]);
}

export async function syncPricingToCloud(tiers: PricingTier[]): Promise<void> {
  await Promise.all([
    isSupabaseAdminSignedIn() ? syncPricingToSupabase(tiers) : Promise.resolve(),
    isFirestoreAdminSignedIn() ? syncPricingToFirestore(tiers) : Promise.resolve(),
  ]);
}

export async function syncFaqsToCloud(faqs: FaqEntry[]): Promise<void> {
  await Promise.all([
    isSupabaseAdminSignedIn() ? syncFaqsToSupabase(faqs) : Promise.resolve(),
    isFirestoreAdminSignedIn() ? syncFaqsToFirestore(faqs) : Promise.resolve(),
  ]);
}

export async function syncCustomSectionsToCloud(sections: CustomSection[]): Promise<void> {
  await Promise.all([
    isSupabaseAdminSignedIn() ? syncCustomSectionsToSupabase(sections) : Promise.resolve(),
    isFirestoreAdminSignedIn() ? syncCustomSectionsToFirestore(sections) : Promise.resolve(),
  ]);
}

export async function syncAllCmsToCloud(cms: CmsContent): Promise<void> {
  await Promise.all([
    isSupabaseAdminSignedIn() ? syncAllCmsToSupabase(cms) : Promise.resolve(),
    isFirestoreAdminSignedIn() ? syncAllCmsToFirestore(cms) : Promise.resolve(),
  ]);
}
