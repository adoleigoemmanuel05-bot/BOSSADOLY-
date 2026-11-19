import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  Check,
  Cloud,
  CloudOff,
  Eye,
  EyeOff,
  FileText,
  Film,
  Image as ImageIcon,
  ImagePlus,
  KeyRound,
  Lock,
  LogOut,
  MousePointerClick,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { AdminCtaManager } from '../components/AdminCtaManager';
import { AdminSectionsManager } from '../components/AdminSectionsManager';
import { FAQ_DATA, PRICING_TIERS, SERVICES_DATA, TEAM_DATA } from '../data/siteData';
import {
  EDITABLE_IMAGE_SLOTS,
  EDITABLE_TEXT_GROUPS,
  type EditableImageSlot,
  type EditablePageTextGroup,
  type EditableTextField,
} from '../data/siteEditableSchema';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { auth, googleProvider } from '../firebase';
import { supabase, isSupabaseConfigured } from '../supabase';
import {
  ADMIN_EMAIL,
  deleteMediaItemFromCloud,
  isCloudAdminSignedIn,
  syncAllCmsToCloud,
  syncSettingsToCloud,
  syncSlotImageToCloud,
  syncTextUpdatesToCloud,
  upsertMediaItemToCloud,
} from '../services/cmsCloud';
import {
  isSupabaseAdminUser,
  syncAllCmsToSupabase,
  verifySupabaseTablesReady,
} from '../services/cmsSupabase';
import {
  GALLERY_IMAGE_STYLE_OPTIONS,
  getGalleryImageStyle,
  getHeroImageStyle,
  getImageStyleOverride,
  HERO_IMAGE_STYLE_OPTIONS,
  IMAGE_SLOT_STYLE_OPTIONS,
} from '../utils/imageStyles';
import { readAndCompressFile } from '../utils/imageCompression';
import { isCmsEdited, loadLocalCmsSnapshot } from '../utils/localSnapshot';
import { adminApiRequest, CLOUD_PW_HASH_KEY } from '../utils/adminApi';
import {
  markPendingCloudSync,
  SAVED_HERO_APPEARANCE_KEY,
  SAVED_LOGO_KEY,
} from '../App';
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

interface AdminDashboardPageProps {
  cms: CmsContent;
  logoUrl: string | null;
  items: MediaItem[];
  siteText: Record<string, string>;
  siteImages: Record<string, string>;
  heroAppearance: HeroAppearance;
  teamMembers: TeamMember[];
  services: ServiceOffering[];
  pricingTiers: PricingTier[];
  faqs: FaqEntry[];
  customSections: CustomSection[];
  hiddenSections: string[];
  onRefreshContent: (token?: string) => Promise<void>;
}

const DEFAULT_COUNTS = {
  teamCount: TEAM_DATA.length,
  servicesCount: SERVICES_DATA.length,
  pricingCount: PRICING_TIERS.length,
  faqsCount: FAQ_DATA.length,
};

type AdminTab = 'media' | 'sections' | 'cta' | 'text' | 'images' | 'settings';

export function AdminDashboardPage({
  cms,
  logoUrl,
  items,
  siteText,
  siteImages,
  heroAppearance,
  teamMembers,
  services,
  pricingTiers,
  faqs,
  customSections,
  hiddenSections,
  onRefreshContent,
}: AdminDashboardPageProps) {
  // Intentionally kept strictly in memory so #ADMIN ALWAYS asks for password on every visit
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('media');

  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Video URL Upload state
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCategory, setVideoCategory] = useState('AI UGC Video');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoStatus, setVideoStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [videoSubmitting, setVideoSubmitting] = useState(false);

  // Image Gallery Upload state
  const [imageTitle, setImageTitle] = useState('');
  const [imageCategory, setImageCategory] = useState('Website Design');
  const [imagePlacement, setImagePlacement] = useState<'showcase' | 'hero' | 'team'>('showcase');
  const [imageStatus, setImageStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [imageSubmitting, setImageSubmitting] = useState(false);

  // Logo Upload state
  const [logoStatus, setLogoStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Page Words Editor state
  const [selectedTextPage, setSelectedTextPage] = useState(EDITABLE_TEXT_GROUPS[0].pageId);
  const [textDrafts, setTextDrafts] = useState<Record<string, string>>({});
  const [textSaving, setTextSaving] = useState(false);
  const [textStatus, setTextStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Page Image Replacer & Style state
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const [slidesDrafts, setSlidesDrafts] = useState<Record<string, string>>({});
  const [slotBusy, setSlotBusy] = useState<string | null>(null);
  const [slotStatus, setSlotStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Hero Background Light / Dark & Brightness state
  const [heroDraft, setHeroDraft] = useState<HeroAppearance>(heroAppearance);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroStatus, setHeroStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Cloud Sync (Supabase + Google Auth -> Firestore) state
  const [cloudUser, setCloudUser] = useState<User | null>(() => auth.currentUser);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [supaEmail, setSupaEmail] = useState(ADMIN_EMAIL);
  const [supaPassword, setSupaPassword] = useState('');
  const [supaMode, setSupaMode] = useState<'signin' | 'signup'>('signin');
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTextDrafts(siteText);
  }, [siteText]);

  useEffect(() => {
    setHeroDraft(heroAppearance);
  }, [heroAppearance]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCloudUser(user);
    });
    if (supabase) {
      void supabase.auth.getSession().then(({ data }) => {
        setSupabaseUser(data.session?.user ?? null);
      });
    }
    const supaSub = supabase
      ? supabase.auth.onAuthStateChange((_event, session) => {
          setSupabaseUser(session?.user ?? null);
        })
      : null;
    return () => {
      unsub();
      supaSub?.data.subscription.unsubscribe();
    };
  }, []);

  const computedTextGroups = useMemo<EditablePageTextGroup[]>(() => {
    const appendCustomSections = (pageId: string): EditableTextField[] =>
      customSections
        .filter((s) => s.pageId === pageId)
        .flatMap((s) => [
          {
            key: `custom.${s.id}.kicker`,
            label: `Custom Section (${s.title}) — Kicker`,
            defaultValue: s.kicker || '',
          },
          {
            key: `custom.${s.id}.title`,
            label: `Custom Section (${s.title}) — Heading`,
            defaultValue: s.title,
          },
          {
            key: `custom.${s.id}.description`,
            label: `Custom Section (${s.title}) — Description`,
            defaultValue: s.description,
            multiline: true,
          },
          {
            key: `custom.${s.id}.bullets`,
            label: `Custom Section (${s.title}) — Bullets (one per line)`,
            defaultValue: s.bullets.join('\n'),
            multiline: true,
          },
          {
            key: `custom.${s.id}.ctaLabel`,
            label: `Custom Section (${s.title}) — Button Text`,
            defaultValue: s.ctaLabel || '',
          },
        ]);

    return EDITABLE_TEXT_GROUPS.map((group) => {
      if (group.pageId === 'services') {
        const headerFields = group.fields.filter((f) => f.key.startsWith('services.header.'));
        const dynamicServiceFields: EditableTextField[] = services.flatMap((srv, idx) => {
          const num = String(idx + 1).padStart(2, '0');
          return [
            {
              key: `services.${srv.id}.modeLabel`,
              label: `${num} Mode Label (${srv.title})`,
              defaultValue: srv.modeLabel,
            },
            {
              key: `services.${srv.id}.title`,
              label: `${num} Service Title`,
              defaultValue: srv.title,
            },
            {
              key: `services.${srv.id}.subtitle`,
              label: `${num} Subtitle`,
              defaultValue: srv.subtitle,
            },
            {
              key: `services.${srv.id}.description`,
              label: `${num} Description`,
              defaultValue: srv.description,
              multiline: true,
            },
            {
              key: `services.${srv.id}.deliverables`,
              label: `${num} Deliverables (one per line)`,
              defaultValue: srv.deliverables.join('\n'),
              multiline: true,
            },
          ];
        });
        return {
          ...group,
          fields: [...headerFields, ...dynamicServiceFields, ...appendCustomSections('services')],
        };
      }

      if (group.pageId === 'pricing') {
        const headerFields = group.fields.filter((f) => f.key.startsWith('pricing.header.'));
        const formFields = group.fields.filter((f) => f.key.startsWith('pricing.form.'));
        const dynamicPricingFields: EditableTextField[] = pricingTiers.flatMap((tier, idx) => [
          { key: `pricing.${tier.id}.tag`, label: `Tier ${idx + 1} Tag`, defaultValue: tier.tag },
          { key: `pricing.${tier.id}.name`, label: `Tier ${idx + 1} Name`, defaultValue: tier.name },
          {
            key: `pricing.${tier.id}.priceDisplay`,
            label: `Tier ${idx + 1} Price Label`,
            defaultValue: tier.priceDisplay,
          },
          {
            key: `pricing.${tier.id}.billingNote`,
            label: `Tier ${idx + 1} Billing Note`,
            defaultValue: tier.billingNote,
          },
          {
            key: `pricing.${tier.id}.summary`,
            label: `Tier ${idx + 1} Summary`,
            defaultValue: tier.summary,
            multiline: true,
          },
          {
            key: `pricing.${tier.id}.features`,
            label: `Tier ${idx + 1} Features (one per line)`,
            defaultValue: tier.features.join('\n'),
            multiline: true,
          },
        ]);
        return {
          ...group,
          fields: [
            ...headerFields,
            ...dynamicPricingFields,
            ...formFields,
            ...appendCustomSections('pricing'),
          ],
        };
      }

      if (group.pageId === 'team') {
        const headerFields = group.fields.filter((f) => f.key.startsWith('team.header.'));
        const dynamicTeamFields: EditableTextField[] = teamMembers.flatMap((member, idx) => [
          {
            key: `team.${member.id}.name`,
            label: `Member ${idx + 1} Name`,
            defaultValue: member.name,
          },
          {
            key: `team.${member.id}.role`,
            label: `Member ${idx + 1} Role`,
            defaultValue: member.role,
          },
          {
            key: `team.${member.id}.specialty`,
            label: `Member ${idx + 1} Specialty`,
            defaultValue: member.specialty,
          },
          {
            key: `team.${member.id}.bio`,
            label: `Member ${idx + 1} Bio`,
            defaultValue: member.bio,
            multiline: true,
          },
        ]);
        return {
          ...group,
          fields: [...headerFields, ...dynamicTeamFields, ...appendCustomSections('team')],
        };
      }

      if (group.pageId === 'faq') {
        const headerFields = group.fields.filter((f) => f.key.startsWith('faq.header.'));
        const ctaFields = group.fields.filter((f) => f.key.startsWith('faq.cta.'));
        const dynamicFaqFields: EditableTextField[] = faqs.flatMap((item, idx) => [
          {
            key: `faq.${idx}.question`,
            label: `Question ${idx + 1}`,
            defaultValue: item.question,
          },
          {
            key: `faq.${idx}.answer`,
            label: `Answer ${idx + 1}`,
            defaultValue: item.answer,
            multiline: true,
          },
        ]);
        return {
          ...group,
          fields: [...headerFields, ...dynamicFaqFields, ...ctaFields, ...appendCustomSections('faq')],
        };
      }

      if (group.pageId === 'chrome') {
        return group;
      }

      return {
        ...group,
        fields: [...group.fields, ...appendCustomSections(group.pageId)],
      };
    });
  }, [services, pricingTiers, teamMembers, faqs, customSections]);

  const computedImageSlots = useMemo<EditableImageSlot[]>(() => {
    const homeAndAbout = EDITABLE_IMAGE_SLOTS.filter(
      (s) => s.slotKey.startsWith('home.') || s.slotKey.startsWith('about.')
    );
    const socialSlots = EDITABLE_IMAGE_SLOTS.filter((s) => s.slotKey.startsWith('social.'));

    const serviceSlots: EditableImageSlot[] = services.map((srv, idx) => {
      const staticMatch = EDITABLE_IMAGE_SLOTS.find(
        (s) => s.slotKey === `services.${srv.id}.image`
      );
      return {
        slotKey: `services.${srv.id}.image`,
        pageLabel: 'Services Page',
        label: `${String(idx + 1).padStart(2, '0')}. ${srv.title} Image`,
        defaultUrl: srv.image || staticMatch?.defaultUrl || '',
      };
    });

    const teamSlots: EditableImageSlot[] = teamMembers.map((member, idx) => {
      const staticMatch = EDITABLE_IMAGE_SLOTS.find(
        (s) => s.slotKey === `team.${member.id}.image`
      );
      return {
        slotKey: `team.${member.id}.image`,
        pageLabel: 'Meet Our Team Page',
        label: `Team Member ${idx + 1} (${member.name})`,
        defaultUrl: member.image || staticMatch?.defaultUrl || '',
      };
    });

    const customSlots: EditableImageSlot[] = customSections
      .filter((sec) => Boolean(sec.image || siteImages[`custom.${sec.id}.image`]))
      .map((sec) => ({
        slotKey: `custom.${sec.id}.image`,
        pageLabel: `Custom Section (${sec.pageId})`,
        label: `${sec.title} Image`,
        defaultUrl: sec.image || '',
      }));

    return [...homeAndAbout, ...serviceSlots, ...teamSlots, ...customSlots, ...socialSlots];
  }, [services, teamMembers, customSections, siteImages]);

  const handleSupabaseAuth = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const cleanEmail = supaEmail.trim().toLowerCase();
    if (cleanEmail !== ADMIN_EMAIL.toLowerCase()) {
      setCloudStatus({
        type: 'err',
        text: `Only the site owner account (${ADMIN_EMAIL}) is allowed to write to Supabase.`,
      });
      return;
    }

    setCloudBusy(true);
    setCloudStatus(null);
    try {
      if (supaMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: supaPassword,
        });
        if (error) {
          setCloudStatus({ type: 'err', text: error.message });
          return;
        }
        if (!data.session) {
          setCloudStatus({
            type: 'ok',
            text: `Account created! Check ${cleanEmail} for the confirmation link (or auto-confirm in Supabase Authentication -> Users), then click Sign In.`,
          });
          setSupaMode('signin');
          return;
        }
        setSupabaseUser(data.session.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: supaPassword,
        });
        if (error) {
          setCloudStatus({ type: 'err', text: error.message });
          return;
        }
        setSupabaseUser(data.user);
      }

      setSupaPassword('');
      const check = await verifySupabaseTablesReady();
      if (!check.ready) {
        setCloudStatus({
          type: 'err',
          text: `Signed in to Supabase, but tables are not ready yet (${check.missingTablesError}). Run the SQL script in Supabase SQL Editor first.`,
        });
        return;
      }

      await syncAllCmsToSupabase(cms);
      markPendingCloudSync(false);
      setCloudStatus({
        type: 'ok',
        text: 'Supabase connected! Every text, color, image, logo, and section is now backed up to your Supabase tables.',
      });
    } catch (err) {
      setCloudStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to connect to Supabase right now.',
      });
    } finally {
      setCloudBusy(false);
    }
  };

  const handleConnectCloudSync = async () => {
    setCloudBusy(true);
    setCloudStatus(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (!cred.user.emailVerified || cred.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        setCloudStatus({
          type: 'err',
          text: `Please sign in with the site owner Google account (${ADMIN_EMAIL}).`,
        });
        return;
      }
      await syncAllCmsToCloud(cms);
      markPendingCloudSync(false);
      setCloudStatus({
        type: 'ok',
        text: 'Cloud database connected! Every text, color, image, and section is now backed up permanently.',
      });
    } catch {
      setCloudStatus({
        type: 'err',
        text: 'Google sign-in was cancelled or blocked. Pop-up permission is required to connect cloud sync.',
      });
    } finally {
      setCloudBusy(false);
    }
  };

  const handleSyncNow = async () => {
    if (!isCloudAdminSignedIn()) return;
    setCloudBusy(true);
    setCloudStatus(null);
    try {
      await syncAllCmsToCloud(cms);
      markPendingCloudSync(false);
      setCloudStatus({
        type: 'ok',
        text: 'All website text, colors, images, and sections synced to Cloud Database!',
      });
    } catch (err) {
      setCloudStatus({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : 'Could not complete cloud sync right now. Please try again.',
      });
    } finally {
      setCloudBusy(false);
    }
  };

  const handleDisconnectCloud = async () => {
    setCloudBusy(true);
    setCloudStatus(null);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      if (supabase && supabaseUser) {
        await supabase.auth.signOut();
        setSupabaseUser(null);
      }
      setCloudStatus({ type: 'ok', text: 'Cloud account signed out on this browser.' });
    } finally {
      setCloudBusy(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await adminApiRequest<{ ok?: boolean; token?: string; error?: string }>(
        '/api/admin/verify',
        {
          method: 'POST',
          body: { password },
          currentCms: cms,
        }
      );
      const data = res.data;
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Incorrect password.');
        return;
      }
      setToken(data.token);
      setPassword('');

      // If running with an Express backend whose container reset to defaults, restore from cloud/IndexedDB
      if (res.mode === 'server') {
        try {
          const checkRes = await fetch('/api/content', {
            headers: { 'x-admin-token': data.token },
          });
          const checkType = checkRes.headers.get('content-type') || '';
          if (checkRes.ok && checkType.includes('application/json')) {
            const checkData = (await checkRes.json()) as CmsContent;
            const serverHasEdits = isCmsEdited(checkData, DEFAULT_COUNTS);
            if (!serverHasEdits) {
              const localSnap = await loadLocalCmsSnapshot();
              const source = isCmsEdited(cms, DEFAULT_COUNTS)
                ? cms
                : localSnap && isCmsEdited(localSnap.content, DEFAULT_COUNTS)
                ? localSnap.content
                : null;

              if (source) {
                await fetch('/api/admin/restore-snapshot', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': data.token,
                  },
                  body: JSON.stringify(source),
                });
              } else {
                const savedLogo = localStorage.getItem(SAVED_LOGO_KEY);
                if (savedLogo && savedLogo.startsWith('data:image/')) {
                  await fetch('/api/admin/upload-image', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-admin-token': data.token,
                    },
                    body: JSON.stringify({
                      dataUrl: savedLogo,
                      title: 'Company Logo',
                      category: 'Brand',
                      placement: 'logo',
                    }),
                  });
                }
              }
            }
          }
        } catch {
          // Ignore non-critical sync error
        }
      }

      await onRefreshContent(data.token);
    } catch {
      setAuthError('Unable to verify password. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    void onRefreshContent();
  };

  const handleAddVideo = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setVideoStatus(null);
    setVideoSubmitting(true);

    try {
      const res = await adminApiRequest<{ item?: MediaItem; error?: string }>('/api/admin/video', {
        method: 'POST',
        token,
        body: {
          title: videoTitle,
          category: videoCategory,
          url: videoUrl,
          placement: 'showcase',
        },
        currentCms: cms,
      });
      const data = res.data;
      if (!res.ok) {
        setVideoStatus({ type: 'err', text: data.error || 'Failed to add video.' });
        return;
      }
      if (data.item) {
        if (isCloudAdminSignedIn()) {
          await upsertMediaItemToCloud(data.item);
          markPendingCloudSync(false);
        } else {
          markPendingCloudSync(true);
        }
      }
      setVideoTitle('');
      setVideoUrl('');
      setVideoStatus({ type: 'ok', text: 'Video published to Showcase!' });
      await onRefreshContent(token);
    } catch {
      setVideoStatus({ type: 'err', text: 'Network error while saving video.' });
    } finally {
      setVideoSubmitting(false);
    }
  };

  const handleGalleryFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setImageStatus(null);
    setImageSubmitting(true);

    try {
      const dataUrl = await readAndCompressFile(file);
      const res = await adminApiRequest<{ item?: MediaItem; error?: string }>(
        '/api/admin/upload-image',
        {
          method: 'POST',
          token,
          body: {
            dataUrl,
            title: imageTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
            category: imageCategory,
            placement: imagePlacement,
          },
          currentCms: cms,
        }
      );
      const data = res.data;
      if (!res.ok) {
        setImageStatus({ type: 'err', text: data.error || 'Failed to upload image.' });
        return;
      }
      if (data.item) {
        if (isCloudAdminSignedIn()) {
          await upsertMediaItemToCloud(data.item);
          markPendingCloudSync(false);
        } else {
          markPendingCloudSync(true);
        }
      }
      setImageTitle('');
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      setImageStatus({ type: 'ok', text: 'Image uploaded from gallery!' });
      await onRefreshContent(token);
    } catch {
      setImageStatus({ type: 'err', text: 'Upload failed. Try a smaller image.' });
    } finally {
      setImageSubmitting(false);
    }
  };

  const handleLogoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setLogoStatus(null);

    try {
      const dataUrl = await readAndCompressFile(file);
      const res = await adminApiRequest<{ logoUrl?: string; error?: string }>(
        '/api/admin/upload-image',
        {
          method: 'POST',
          token,
          body: {
            dataUrl,
            title: 'Company Logo',
            category: 'Brand',
            placement: 'logo',
          },
          currentCms: cms,
        }
      );
      const data = res.data;
      if (!res.ok) {
        setLogoStatus({ type: 'err', text: data.error || 'Logo upload failed.' });
        return;
      }
      if (data.logoUrl) {
        try {
          localStorage.setItem(SAVED_LOGO_KEY, data.logoUrl);
        } catch {
          // Ignore storage quota errors
        }
        if (isCloudAdminSignedIn()) {
          await syncSettingsToCloud({ logoUrl: data.logoUrl });
          markPendingCloudSync(false);
        } else {
          markPendingCloudSync(true);
        }
      }
      if (logoInputRef.current) logoInputRef.current.value = '';
      setLogoStatus({ type: 'ok', text: 'Company logo saved across all pages!' });
      await onRefreshContent(token);
    } catch {
      setLogoStatus({ type: 'err', text: 'Logo upload failed.' });
    }
  };

  const handleResetLogo = async () => {
    if (!token) return;
    try {
      localStorage.removeItem(SAVED_LOGO_KEY);
    } catch {
      // Ignore storage errors
    }
    await adminApiRequest('/api/admin/logo', {
      method: 'DELETE',
      token,
      currentCms: cms,
    });
    if (isCloudAdminSignedIn()) {
      await syncSettingsToCloud({ logoUrl: null });
      markPendingCloudSync(false);
    } else {
      markPendingCloudSync(true);
    }
    setLogoStatus({ type: 'ok', text: 'Default BossAdoly logo restored.' });
    await onRefreshContent(token);
  };

  const handleSaveHeroAppearance = async (override?: HeroAppearance) => {
    if (!token) return;
    const payload = override || heroDraft;
    setHeroSaving(true);
    setHeroStatus(null);
    try {
      const res = await adminApiRequest<{ heroAppearance?: HeroAppearance; error?: string }>(
        '/api/admin/hero-appearance',
        {
          method: 'PUT',
          token,
          body: payload as unknown as Record<string, unknown>,
          currentCms: cms,
        }
      );
      const data = res.data;
      if (!res.ok || !data.heroAppearance) {
        setHeroStatus({ type: 'err', text: data.error || 'Failed to save background settings.' });
        return;
      }
      try {
        localStorage.setItem(SAVED_HERO_APPEARANCE_KEY, JSON.stringify(data.heroAppearance));
      } catch {
        // Ignore storage errors
      }
      if (isCloudAdminSignedIn()) {
        await syncSettingsToCloud({ heroAppearance: data.heroAppearance });
        markPendingCloudSync(false);
      } else {
        markPendingCloudSync(true);
      }
      setHeroDraft(data.heroAppearance);
      setHeroStatus({ type: 'ok', text: 'Hero background look updated!' });
      await onRefreshContent(token);
    } catch {
      setHeroStatus({ type: 'err', text: 'Network error saving background settings.' });
    } finally {
      setHeroSaving(false);
    }
  };

  const handleToggleVisibility = async (item: MediaItem) => {
    if (!token) return;
    const res = await adminApiRequest<{ item?: MediaItem }>(`/api/admin/item/${item.id}`, {
      method: 'PATCH',
      token,
      body: { visible: !item.visible },
      currentCms: cms,
    });
    if (res.ok && res.data.item) {
      if (isCloudAdminSignedIn()) {
        await upsertMediaItemToCloud(res.data.item);
        markPendingCloudSync(false);
      } else {
        markPendingCloudSync(true);
      }
    }
    await onRefreshContent(token);
  };

  const handleDeleteItem = async (id: string) => {
    if (!token) return;
    const res = await adminApiRequest(`/api/admin/item/${id}`, {
      method: 'DELETE',
      token,
      currentCms: cms,
    });
    if (res.ok) {
      if (isCloudAdminSignedIn()) {
        await deleteMediaItemFromCloud(id);
        markPendingCloudSync(false);
      } else {
        markPendingCloudSync(true);
      }
    }
    await onRefreshContent(token);
  };

  const handleSaveTextGroup = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const group = computedTextGroups.find((g) => g.pageId === selectedTextPage);
    if (!group) return;

    setTextSaving(true);
    setTextStatus(null);
    const updates: Record<string, string | null> = {};
    for (const field of group.fields) {
      const val = textDrafts[field.key];
      if (val === undefined || val === field.defaultValue || val === '') {
        updates[field.key] = null;
      } else {
        updates[field.key] = val;
      }

      const colorKey = `${field.key}.color`;
      const colorVal = (textDrafts[colorKey] || '').trim();
      updates[colorKey] = colorVal ? colorVal : null;
    }

    try {
      const res = await adminApiRequest<{ error?: string }>('/api/admin/site-text', {
        method: 'PUT',
        token,
        body: { updates },
        currentCms: cms,
      });
      if (!res.ok) {
        setTextStatus({ type: 'err', text: res.data.error || 'Failed to save changes.' });
        return;
      }
      if (isCloudAdminSignedIn()) {
        await syncTextUpdatesToCloud(updates);
        markPendingCloudSync(false);
      } else {
        markPendingCloudSync(true);
      }
      setTextStatus({
        type: 'ok',
        text: `Saved ${group.pageLabel} wording and text colors successfully!`,
      });
      await onRefreshContent(token);
    } catch {
      setTextStatus({ type: 'err', text: 'Network error while saving text.' });
    } finally {
      setTextSaving(false);
    }
  };

  const handleResetTextField = async (fieldKey: string, defaultVal: string) => {
    if (!token) return;
    const colorKey = `${fieldKey}.color`;
    setTextDrafts((prev) => {
      const next = { ...prev, [fieldKey]: defaultVal };
      delete next[colorKey];
      return next;
    });
    const updates = { [fieldKey]: null, [colorKey]: null };
    await adminApiRequest('/api/admin/site-text', {
      method: 'PUT',
      token,
      body: { updates },
      currentCms: cms,
    });
    if (isCloudAdminSignedIn()) {
      await syncTextUpdatesToCloud(updates);
      markPendingCloudSync(false);
    } else {
      markPendingCloudSync(true);
    }
    await onRefreshContent(token);
  };

  const handleSaveSiteTextKey = async (key: string, value: string | null, successMsg?: string) => {
    if (!token) return;
    setSlotBusy(key);
    setSlotStatus(null);
    const cleanedVal = value && value.trim() ? value.trim() : null;
    const updates = { [key]: cleanedVal };
    try {
      const res = await adminApiRequest<{ error?: string }>('/api/admin/site-text', {
        method: 'PUT',
        token,
        body: { updates },
        currentCms: cms,
      });
      if (!res.ok) {
        setSlotStatus({ type: 'err', text: res.data.error || 'Failed to save image style.' });
        return;
      }
      if (isCloudAdminSignedIn()) {
        await syncTextUpdatesToCloud(updates);
        markPendingCloudSync(false);
      } else {
        markPendingCloudSync(true);
      }
      if (successMsg) {
        setSlotStatus({ type: 'ok', text: successMsg });
      }
      await onRefreshContent(token);
    } catch {
      setSlotStatus({ type: 'err', text: 'Network error saving image style.' });
    } finally {
      setSlotBusy(null);
    }
  };

  const handleReplaceSlotWithFile = async (slotKey: string, file: File | undefined) => {
    if (!file || !token) return;
    setSlotBusy(slotKey);
    setSlotStatus(null);
    try {
      const dataUrl = await readAndCompressFile(file);
      const res = await adminApiRequest<{ url?: string; error?: string }>(
        '/api/admin/replace-image',
        {
          method: 'POST',
          token,
          body: { slotKey, dataUrl },
          currentCms: cms,
        }
      );
      const data = res.data;
      if (!res.ok) {
        setSlotStatus({ type: 'err', text: data.error || 'Failed to replace image.' });
        return;
      }
      if (isCloudAdminSignedIn()) {
        await syncSlotImageToCloud(slotKey, data.url || dataUrl);
        markPendingCloudSync(false);
      } else {
        markPendingCloudSync(true);
      }
      setSlotStatus({ type: 'ok', text: 'Page image replaced!' });
      await onRefreshContent(token);
    } catch {
      setSlotStatus({ type: 'err', text: 'Upload failed.' });
    } finally {
      setSlotBusy(null);
    }
  };

  const handleReplaceSlotWithUrl = async (slotKey: string) => {
    if (!token) return;
    const url = (urlDrafts[slotKey] || '').trim();
    if (!url) return;
    setSlotBusy(slotKey);
    setSlotStatus(null);
    try {
      const res = await adminApiRequest<{ url?: string; error?: string }>(
        '/api/admin/replace-image',
        {
          method: 'POST',
          token,
          body: { slotKey, imageUrl: url },
          currentCms: cms,
        }
      );
      const data = res.data;
      if (!res.ok) {
        setSlotStatus({ type: 'err', text: data.error || 'Failed to update image URL.' });
        return;
      }
      if (isCloudAdminSignedIn()) {
        await syncSlotImageToCloud(slotKey, data.url || url);
        markPendingCloudSync(false);
      } else {
        markPendingCloudSync(true);
      }
      setUrlDrafts((prev) => ({ ...prev, [slotKey]: '' }));
      setSlotStatus({ type: 'ok', text: 'Page image updated from URL!' });
      await onRefreshContent(token);
    } catch {
      setSlotStatus({ type: 'err', text: 'Network error updating image URL.' });
    } finally {
      setSlotBusy(null);
    }
  };

  const handleResetImageSlot = async (slotKey: string) => {
    if (!token) return;
    setSlotBusy(slotKey);
    setSlotStatus(null);
    try {
      await adminApiRequest('/api/admin/replace-image', {
        method: 'POST',
        token,
        body: { slotKey, reset: true },
        currentCms: cms,
      });
      if (isCloudAdminSignedIn()) {
        await syncSlotImageToCloud(slotKey, null);
        markPendingCloudSync(false);
      } else {
        markPendingCloudSync(true);
      }
      setSlotStatus({ type: 'ok', text: 'Restored default image.' });
      await onRefreshContent(token);
    } finally {
      setSlotBusy(null);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPwStatus(null);

    if (newPassword.trim().length < 6) {
      setPwStatus({ type: 'err', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwStatus({ type: 'err', text: 'New password and confirmation do not match.' });
      return;
    }

    setPwSaving(true);
    try {
      const res = await adminApiRequest<{
        ok?: boolean;
        token?: string;
        pwHash?: string;
        error?: string;
      }>('/api/admin/change-password', {
        method: 'POST',
        token,
        body: {
          currentPassword,
          newPassword: newPassword.trim(),
        },
        currentCms: cms,
      });
      const data = res.data;
      if (!res.ok || !data.token) {
        setPwStatus({ type: 'err', text: data.error || 'Unable to update password.' });
        return;
      }
      if (data.pwHash) {
        if (isCloudAdminSignedIn()) {
          await syncTextUpdatesToCloud({ [CLOUD_PW_HASH_KEY]: data.pwHash });
          markPendingCloudSync(false);
        } else {
          markPendingCloudSync(true);
        }
      }
      setToken(data.token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwStatus({
        type: 'ok',
        text: 'Admin password updated! Use your new password next time you log into #ADMIN.',
      });
      await onRefreshContent(data.token);
    } catch {
      setPwStatus({ type: 'err', text: 'Unable to update password right now.' });
    } finally {
      setPwSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-neutral-50 py-20 px-4">
        <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-yellow-300 text-neutral-900 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
              <p className="text-xs text-neutral-600">
                BossAdoly Media, Copy, Image & Security Control
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-neutral-800 mb-1.5">
                Admin Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter BossAdoly admin password"
                className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {authError && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full px-5 py-3 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {authLoading ? 'Verifying...' : 'Unlock Admin Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentTextGroup =
    computedTextGroups.find((g) => g.pageId === selectedTextPage) || computedTextGroups[0];
  const firestoreConnected = Boolean(
    cloudUser && cloudUser.emailVerified && cloudUser.email === ADMIN_EMAIL
  );
  const supaConnected = isSupabaseAdminUser(supabaseUser);
  const cloudConnected = supaConnected || firestoreConnected;

  return (
    <div className="bg-neutral-50 min-h-[75vh] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <p className="text-xs font-semibold text-orange-600">BossAdoly Control Center</p>
            <h1 className="font-display text-3xl font-bold text-neutral-900">
              Admin Dashboard
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Lock Dashboard</span>
          </button>
        </div>

        {/* Permanent Cloud Database Sync Banner */}
        <div
          className={`rounded-2xl border p-5 space-y-4 ${
            cloudConnected
              ? 'border-emerald-200 bg-emerald-50/70'
              : 'border-amber-200 bg-amber-50/80'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  cloudConnected
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                {cloudConnected ? (
                  <Cloud className="h-5 w-5" />
                ) : (
                  <CloudOff className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-neutral-900">
                  {supaConnected
                    ? 'Supabase Cloud Sync Active'
                    : firestoreConnected
                    ? 'Google Cloud Sync Active'
                    : 'Connect Supabase (or Google Cloud) So Edits Never Reset'}
                </h2>
                <p className="text-xs text-neutral-700 max-w-2xl">
                  {supaConnected
                    ? `Connected to Supabase as ${supabaseUser?.email}. Every text, color, image, logo, button, and custom section saves permanently to your Supabase tables.`
                    : firestoreConnected
                    ? `Signed in with Google as ${cloudUser?.email}. Sign in to Supabase below if you also want your changes saved to Supabase.`
                    : `Sign in with your owner account (${ADMIN_EMAIL}) so all text, colors, images, logo, and custom sections save permanently to your Supabase database.`}
                </p>
                {cloudStatus && (
                  <p
                    role="status"
                    className={`text-xs font-semibold pt-1 ${
                      cloudStatus.type === 'ok' ? 'text-emerald-800' : 'text-red-700'
                    }`}
                  >
                    {cloudStatus.text}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {cloudConnected && (
                <>
                  <button
                    type="button"
                    disabled={cloudBusy}
                    onClick={handleSyncNow}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${cloudBusy ? 'animate-spin' : ''}`} />
                    <span>{cloudBusy ? 'Syncing...' : 'Sync All Changes Now'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={cloudBusy}
                    onClick={handleDisconnectCloud}
                    className="px-3.5 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg cursor-pointer"
                  >
                    Sign Out Cloud
                  </button>
                </>
              )}
              {!firestoreConnected && (
                <button
                  type="button"
                  disabled={cloudBusy}
                  onClick={handleConnectCloudSync}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-100 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  <Cloud className="h-3.5 w-3.5" />
                  <span>{cloudBusy ? 'Connecting...' : 'Google Cloud Backup'}</span>
                </button>
              )}
            </div>
          </div>

          {isSupabaseConfigured && !supaConnected && (
            <form
              onSubmit={handleSupabaseAuth}
              className="border-t border-neutral-200/80 pt-4 flex flex-col lg:flex-row lg:items-end gap-3"
            >
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Supabase Owner Email
                </label>
                <input
                  type="email"
                  required
                  value={supaEmail}
                  onChange={(e) => setSupaEmail(e.target.value)}
                  placeholder={ADMIN_EMAIL}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Supabase Account Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={supaPassword}
                  onChange={(e) => setSupaPassword(e.target.value)}
                  placeholder="Enter your Supabase auth password"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={cloudBusy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  <Cloud className="h-3.5 w-3.5" />
                  <span>
                    {cloudBusy
                      ? 'Connecting...'
                      : supaMode === 'signup'
                      ? 'Create Supabase Login'
                      : 'Sign In to Supabase'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSupaMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
                  }
                  className="px-3 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-950 underline cursor-pointer"
                >
                  {supaMode === 'signin' ? 'First time? Create login' : 'Already created? Sign in'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Admin Section Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-4">
          {(
            [
              ['media', 'Videos & Gallery', Film],
              ['sections', 'Add / Delete Sections (+)', Plus],
              ['cta', 'Buttons & Links (CTA)', MousePointerClick],
              ['text', 'Edit Any Words', FileText],
              ['images', 'Replace Any Image', ImageIcon],
              ['settings', 'Password Settings', KeyRound],
            ] as const
          ).map(([tabKey, label, Icon]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === tabKey
                  ? 'bg-orange-600 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* TAB 0: ADD / DELETE SECTIONS, TEAM, SERVICES, PRICING & FAQ */}
        {activeTab === 'sections' && (
          <AdminSectionsManager
            cms={cms}
            token={token}
            teamMembers={teamMembers}
            services={services}
            pricingTiers={pricingTiers}
            faqs={faqs}
            customSections={customSections}
            hiddenSections={hiddenSections}
            siteText={siteText}
            siteImages={siteImages}
            onRefreshContent={onRefreshContent}
          />
        )}

        {/* TAB: EDIT CTA BUTTONS & DESTINATIONS */}
        {activeTab === 'cta' && (
          <AdminCtaManager
            cms={cms}
            token={token}
            siteText={siteText}
            services={services}
            pricingTiers={pricingTiers}
            teamMembers={teamMembers}
            customSections={customSections}
            onRefreshContent={onRefreshContent}
          />
        )}

        {/* TAB 1: MEDIA, VIDEOS & LOGO */}
        {activeTab === 'media' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video URL Upload */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                    <Film className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Upload Video URL</h2>
                    <p className="text-xs text-neutral-500">YouTube or Google Drive links</p>
                  </div>
                </div>

                <form onSubmit={handleAddVideo} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Video Title
                    </label>
                    <input
                      type="text"
                      required
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="e.g. Fashion Brand TikTok Ad Reel"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Category
                    </label>
                    <select
                      value={videoCategory}
                      onChange={(e) => setVideoCategory(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="AI UGC Video">AI UGC Video</option>
                      <option value="Meta & TikTok Ads">Meta & TikTok Ads</option>
                      <option value="Website Design">Website Design</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      YouTube or Google Drive URL
                    </label>
                    <input
                      type="url"
                      required
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/... or https://drive.google.com/file/d/..."
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {videoStatus && (
                    <p
                      className={`text-xs font-medium ${
                        videoStatus.type === 'ok' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {videoStatus.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={videoSubmitting}
                    className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    {videoSubmitting ? 'Publishing...' : 'Publish Video'}
                  </button>
                </form>
              </div>

              {/* Upload Image From Gallery */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-yellow-200 text-neutral-900 flex items-center justify-center">
                    <ImagePlus className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Upload Image From Gallery</h2>
                    <p className="text-xs text-neutral-500">PNG, JPG, WEBP up to 8MB</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Image Title
                    </label>
                    <input
                      type="text"
                      value={imageTitle}
                      onChange={(e) => setImageTitle(e.target.value)}
                      placeholder="e.g. Lagos Storefront Launch"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Category
                      </label>
                      <select
                        value={imageCategory}
                        onChange={(e) => setImageCategory(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Website Design">Website Design</option>
                        <option value="AI UGC Video">AI UGC Video</option>
                        <option value="Meta & TikTok Ads">Meta & TikTok Ads</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Placement
                      </label>
                      <select
                        value={imagePlacement}
                        onChange={(e) =>
                          setImagePlacement(e.target.value as 'showcase' | 'hero' | 'team')
                        }
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="showcase">Showcase Gallery</option>
                        <option value="hero">Hero Carousel</option>
                        <option value="team">Team Highlights</option>
                      </select>
                    </div>
                  </div>

                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleGalleryFileChange}
                    className="hidden"
                  />

                  {imageStatus && (
                    <p
                      className={`text-xs font-medium ${
                        imageStatus.type === 'ok' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {imageStatus.text}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={imageSubmitting}
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-neutral-900 bg-yellow-300 hover:bg-yellow-400 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{imageSubmitting ? 'Uploading...' : 'IMAGE UPLOAD BUTTON'}</span>
                  </button>
                </div>
              </div>

              {/* Company Logo Control */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Company Logo</h2>
                    <p className="text-xs text-neutral-500">
                      Displayed on the top-left of every page and in the footer
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 flex items-center gap-4">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Current uploaded company logo"
                        className="h-14 w-14 rounded-lg object-cover border border-neutral-200 bg-white"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-orange-600 text-white font-display font-bold text-xl flex items-center justify-center">
                        B
                      </div>
                    )}
                    <div className="text-xs text-neutral-600">
                      {logoUrl ? 'Custom Uploaded Logo Active' : 'Default BossAdoly Emblem Active'}
                    </div>
                  </div>

                  {logoStatus && (
                    <p
                      className={`text-xs font-medium ${
                        logoStatus.type === 'ok' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {logoStatus.text}
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Logo From Gallery</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset to Default Emblem</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Media Library Table */}
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-900">
                  Uploaded Videos & Images ({items.length})
                </h2>
              </div>

              {items.length === 0 ? (
                <div className="p-10 text-center text-sm text-neutral-500">
                  No custom videos or images uploaded yet. Use the panels above to publish content.
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={item.title}
                            className="h-12 w-16 rounded-lg object-cover border border-neutral-200 shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-16 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                            <Film className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {item.category} · {item.placement} ·{' '}
                            {item.source === 'youtube'
                              ? 'YouTube'
                              : item.source === 'gdrive'
                              ? 'Google Drive'
                              : 'Gallery'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                            item.visible
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                          }`}
                        >
                          {item.visible ? (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              <span>Visible</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          aria-label={`Delete ${item.title}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-neutral-200 text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EDIT ANY WORDS ACROSS ALL PAGES */}
        {activeTab === 'text' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-3 rounded-2xl border border-neutral-200 bg-white p-3 space-y-1">
              <p className="px-3 py-2 text-xs font-semibold text-neutral-500">Select Page</p>
              {computedTextGroups.map((group) => (
                <button
                  key={group.pageId}
                  type="button"
                  onClick={() => {
                    setSelectedTextPage(group.pageId);
                    setTextStatus(null);
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    selectedTextPage === group.pageId
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {group.pageLabel}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSaveTextGroup}
              className="lg:col-span-9 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">
                    Edit Words — {currentTextGroup.pageLabel}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Update any headline, description, button label, or list item and save.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('sections')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-neutral-900 bg-yellow-300 hover:bg-yellow-400 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {selectedTextPage === 'team'
                        ? 'Add Team Member'
                        : selectedTextPage === 'services'
                        ? 'Add Service'
                        : selectedTextPage === 'pricing'
                        ? 'Add Pricing Plan'
                        : selectedTextPage === 'faq'
                        ? 'Add FAQ'
                        : 'Add / Delete Sections'}
                    </span>
                  </button>
                  <button
                    type="submit"
                    disabled={textSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>{textSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>

              {textStatus && (
                <p
                  className={`text-sm font-medium ${
                    textStatus.type === 'ok' ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {textStatus.text}
                </p>
              )}

              <div className="space-y-5">
                {currentTextGroup.fields.map((field) => {
                  const value = textDrafts[field.key] ?? field.defaultValue;
                  const colorKey = `${field.key}.color`;
                  const colorValue = textDrafts[colorKey] ?? '';
                  const pickerHex = /^#[0-9a-fA-F]{6}$/.test(colorValue.trim())
                    ? colorValue.trim()
                    : '#171717';
                  const isModified =
                    (siteText[field.key] !== undefined &&
                      siteText[field.key] !== field.defaultValue) ||
                    Boolean(siteText[colorKey]);

                  return (
                    <div
                      key={field.key}
                      className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`edit-${field.key}`}
                          className="text-xs font-semibold text-neutral-700"
                        >
                          {field.label}
                        </label>
                        {isModified && (
                          <button
                            type="button"
                            onClick={() => handleResetTextField(field.key, field.defaultValue)}
                            className="text-xs font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
                          >
                            Reset Default
                          </button>
                        )}
                      </div>

                      {field.multiline ? (
                        <textarea
                          id={`edit-${field.key}`}
                          rows={3}
                          value={value}
                          onChange={(e) =>
                            setTextDrafts((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <input
                          id={`edit-${field.key}`}
                          type="text"
                          value={value}
                          onChange={(e) =>
                            setTextDrafts((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      )}

                      {/* Custom Text Color Picker */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <label
                          htmlFor={`color-${field.key}`}
                          className="text-[11px] font-semibold text-neutral-600"
                        >
                          Text Color:
                        </label>
                        <input
                          id={`color-${field.key}`}
                          type="color"
                          value={pickerHex}
                          onChange={(e) =>
                            setTextDrafts((prev) => ({
                              ...prev,
                              [colorKey]: e.target.value,
                            }))
                          }
                          aria-label={`Pick color for ${field.label}`}
                          className="h-7 w-10 rounded border border-neutral-300 bg-white p-0.5 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={colorValue}
                          onChange={(e) =>
                            setTextDrafts((prev) => ({
                              ...prev,
                              [colorKey]: e.target.value,
                            }))
                          }
                          placeholder="Default (or enter #hex / color)"
                          className="w-48 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {colorValue && (
                          <>
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-neutral-200 bg-white text-[11px] font-semibold"
                              style={{ color: colorValue }}
                            >
                              Sample Color
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setTextDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[colorKey];
                                  return next;
                                })
                              }
                              className="text-[11px] font-medium text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
                            >
                              Clear Color
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: REPLACE ANY IMAGE ON ANY PAGE */}
        {activeTab === 'images' && (
          <div className="space-y-6">
            {/* Hero Background Light / Dark & Fade Control */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">
                    Hero Background Brightness &amp; Fade Control
                  </h2>
                  <p className="text-xs text-neutral-600 mt-1">
                    Make the hero carousel background images lighter, darker, or completely clear.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={heroSaving}
                    onClick={() =>
                      handleSaveHeroAppearance({
                        tone: 'light',
                        overlayOpacity: 75,
                        brightness: 100,
                      })
                    }
                    className="px-3.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                  >
                    Reset Default
                  </button>
                  <button
                    type="button"
                    disabled={heroSaving}
                    onClick={() => handleSaveHeroAppearance()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-lg cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{heroSaving ? 'Saving...' : 'Save Background Look'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-6 space-y-4">
                  {/* Light / Dark Mode Switch */}
                  <div>
                    <p className="text-xs font-semibold text-neutral-700 mb-2">
                      Fade / Shade Style
                    </p>
                    <div className="inline-flex items-center gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => setHeroDraft((prev) => ({ ...prev, tone: 'light' }))}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          heroDraft.tone === 'light'
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        Light (White Fade)
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroDraft((prev) => ({ ...prev, tone: 'dark' }))}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          heroDraft.tone === 'dark'
                            ? 'bg-neutral-900 text-white shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        Dark (Dark Shade)
                      </button>
                    </div>
                  </div>

                  {/* Hero Image Layout Style */}
                  <div>
                    <label
                      htmlFor="hero-image-style"
                      className="block text-xs font-semibold text-neutral-700 mb-1.5"
                    >
                      Hero Image Display Style
                    </label>
                    <select
                      id="hero-image-style"
                      value={getHeroImageStyle(siteText)}
                      disabled={slotBusy === 'imageStyle.home.hero'}
                      onChange={(e) =>
                        handleSaveSiteTextKey(
                          'imageStyle.home.hero',
                          e.target.value === 'carousel-fade' ? null : e.target.value,
                          'Hero image style updated!'
                        )
                      }
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {HERO_IMAGE_STYLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fade Strength Slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-1.5">
                      <span>Fade Strength Behind Text (0% = Clear Image)</span>
                      <span className="font-semibold text-neutral-900 tabular-nums">
                        {heroDraft.overlayOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={95}
                      value={heroDraft.overlayOpacity}
                      onChange={(e) =>
                        setHeroDraft((prev) => ({
                          ...prev,
                          overlayOpacity: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-orange-600 cursor-pointer"
                    />
                  </div>

                  {/* Image Brightness Slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-1.5">
                      <span>Image Brightness (Darker &harr; Lighter)</span>
                      <span className="font-semibold text-neutral-900 tabular-nums">
                        {heroDraft.brightness}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={160}
                      value={heroDraft.brightness}
                      onChange={(e) =>
                        setHeroDraft((prev) => ({
                          ...prev,
                          brightness: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-orange-600 cursor-pointer"
                    />
                  </div>

                  {heroStatus && (
                    <p
                      className={`text-xs font-medium ${
                        heroStatus.type === 'ok' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {heroStatus.text}
                    </p>
                  )}
                </div>

                {/* Live Mini Preview */}
                <div className="lg:col-span-6">
                  <div className="relative h-44 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                    <img
                      src={
                        siteImages['home.hero.slide1'] ||
                        'https://i.ibb.co/Pz6sKsgZ/Church-photography-worship-serve-team.jpg'
                      }
                      alt="Hero background preview"
                      referrerPolicy="no-referrer"
                      style={{ filter: `brightness(${heroDraft.brightness}%)` }}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to right, rgba(${
                          heroDraft.tone === 'dark' ? '10, 10, 10' : '255, 255, 255'
                        }, ${heroDraft.overlayOpacity / 100}) 0%, rgba(${
                          heroDraft.tone === 'dark' ? '10, 10, 10' : '255, 255, 255'
                        }, ${(heroDraft.overlayOpacity * 0.68) / 100}) 48%, rgba(${
                          heroDraft.tone === 'dark' ? '10, 10, 10' : '255, 255, 255'
                        }, 0) 100%)`,
                      }}
                    />
                    <div className="relative z-10 h-full flex flex-col justify-center p-5 max-w-xs">
                      <p
                        className={`text-[11px] font-semibold ${
                          heroDraft.tone === 'dark' ? 'text-yellow-300' : 'text-orange-700'
                        }`}
                      >
                        Live Hero Preview
                      </p>
                      <p
                        className={`font-display text-base font-bold leading-tight mt-1 ${
                          heroDraft.tone === 'dark' ? 'text-white' : 'text-neutral-900'
                        }`}
                      >
                        Turn Attention Into Paying Customers
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Section Display Styles */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  Gallery &amp; Showcase Display Styles
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Switch your uploaded Showcase Gallery and Team Highlights between Grid, Carousel,
                  Spotlight, or Editorial Frames.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="style-home-showcase"
                    className="block text-xs font-semibold text-neutral-700 mb-1.5"
                  >
                    Featured Reels &amp; Showcase Gallery Style
                  </label>
                  <select
                    id="style-home-showcase"
                    value={getGalleryImageStyle(siteText, 'home.showcase')}
                    disabled={slotBusy === 'imageStyle.home.showcase'}
                    onChange={(e) =>
                      handleSaveSiteTextKey(
                        'imageStyle.home.showcase',
                        e.target.value === 'grid' ? null : e.target.value,
                        'Showcase gallery style updated!'
                      )
                    }
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {GALLERY_IMAGE_STYLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="style-team-highlights"
                    className="block text-xs font-semibold text-neutral-700 mb-1.5"
                  >
                    Team Studio Highlights Style
                  </label>
                  <select
                    id="style-team-highlights"
                    value={getGalleryImageStyle(siteText, 'team.highlights')}
                    disabled={slotBusy === 'imageStyle.team.highlights'}
                    onChange={(e) =>
                      handleSaveSiteTextKey(
                        'imageStyle.team.highlights',
                        e.target.value === 'grid' ? null : e.target.value,
                        'Team highlights style updated!'
                      )
                    }
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {GALLERY_IMAGE_STYLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  Replace Any Image &amp; Change Image Style Across All Pages
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Upload a photo, paste a URL, or switch the display style (Carousel, Spotlight,
                  Rounded, Editorial, Zoom, B&amp;W, Fade) on any image.
                </p>
              </div>
              {slotStatus && (
                <p
                  className={`text-sm font-medium ${
                    slotStatus.type === 'ok' ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {slotStatus.text}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {computedImageSlots.map((slot) => {
                const activeUrl = siteImages[slot.slotKey] || slot.defaultUrl;
                const isCustom = Boolean(siteImages[slot.slotKey]);
                const isBusy = slotBusy === slot.slotKey;
                const currentStyle = getImageStyleOverride(siteText, slot.slotKey);
                const supportsSlotStyle = !slot.slotKey.startsWith('home.hero.');
                const supportsExtraSlides =
                  supportsSlotStyle && !slot.slotKey.startsWith('social.');
                const savedSlidesVal = siteText[`imageSlides.${slot.slotKey}`] || '';
                const slidesVal =
                  slidesDrafts[slot.slotKey] !== undefined
                    ? slidesDrafts[slot.slotKey]
                    : savedSlidesVal;

                return (
                  <div
                    key={slot.slotKey}
                    className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-orange-600">{slot.pageLabel}</p>
                        <h3 className="text-base font-bold text-neutral-900">{slot.label}</h3>
                      </div>
                      {isCustom && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleResetImageSlot(slot.slotKey)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>

                    <div className="aspect-[16/9] rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                      {activeUrl ? (
                        <img
                          src={activeUrl}
                          alt={slot.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-neutral-500">No photo uploaded yet</span>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-neutral-900 bg-yellow-300 hover:bg-yellow-400 rounded-lg transition-colors cursor-pointer">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{isBusy ? 'Updating...' : 'Replace With Gallery Image'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          disabled={isBusy}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            handleReplaceSlotWithFile(slot.slotKey, f);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>

                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={urlDrafts[slot.slotKey] || ''}
                          onChange={(e) =>
                            setUrlDrafts((prev) => ({
                              ...prev,
                              [slot.slotKey]: e.target.value,
                            }))
                          }
                          placeholder="Or paste replacement image URL..."
                          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                          type="button"
                          disabled={isBusy || !(urlDrafts[slot.slotKey] || '').trim()}
                          onClick={() => handleReplaceSlotWithUrl(slot.slotKey)}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-lg cursor-pointer"
                        >
                          Apply URL
                        </button>
                      </div>

                      {supportsSlotStyle && (
                        <div className="pt-2 border-t border-neutral-100 space-y-2">
                          <label
                            htmlFor={`style-${slot.slotKey}`}
                            className="block text-[11px] font-semibold text-neutral-700"
                          >
                            Image Display Style
                          </label>
                          <select
                            id={`style-${slot.slotKey}`}
                            value={currentStyle}
                            disabled={slotBusy === `imageStyle.${slot.slotKey}`}
                            onChange={(e) =>
                              handleSaveSiteTextKey(
                                `imageStyle.${slot.slotKey}`,
                                e.target.value === 'standard' ? null : e.target.value,
                                `${slot.label} style updated!`
                              )
                            }
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            {IMAGE_SLOT_STYLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          {supportsExtraSlides && currentStyle === 'carousel' && (
                            <div className="space-y-1.5 pt-1">
                              <label className="block text-[11px] font-medium text-neutral-600">
                                Extra Carousel Slide URLs (optional, one per line)
                              </label>
                              <textarea
                                rows={2}
                                value={slidesVal}
                                onChange={(e) =>
                                  setSlidesDrafts((prev) => ({
                                    ...prev,
                                    [slot.slotKey]: e.target.value,
                                  }))
                                }
                                placeholder={'https://.../slide2.jpg\nhttps://.../slide3.jpg'}
                                className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                              <button
                                type="button"
                                disabled={slotBusy === `imageSlides.${slot.slotKey}`}
                                onClick={() =>
                                  handleSaveSiteTextKey(
                                    `imageSlides.${slot.slotKey}`,
                                    slidesVal,
                                    `${slot.label} carousel slides saved!`
                                  )
                                }
                                className="px-3 py-1.5 text-[11px] font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg cursor-pointer"
                              >
                                Save Carousel Slides
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: PASSWORD SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-300 text-neutral-900 flex items-center justify-center shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Change Admin Password</h2>
                <p className="text-xs text-neutral-600">
                  Update the password required whenever you open #ADMIN.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="current-pw"
                  className="block text-sm font-medium text-neutral-800 mb-1.5"
                >
                  Current Password
                </label>
                <input
                  id="current-pw"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label htmlFor="new-pw" className="block text-sm font-medium text-neutral-800 mb-1.5">
                  New Password
                </label>
                <input
                  id="new-pw"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-pw"
                  className="block text-sm font-medium text-neutral-800 mb-1.5"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-pw"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {pwStatus && (
                <p
                  role="status"
                  className={`text-sm font-medium ${
                    pwStatus.type === 'ok' ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {pwStatus.text}
                </p>
              )}

              <button
                type="submit"
                disabled={pwSaving}
                className="w-full px-5 py-3 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {pwSaving ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
