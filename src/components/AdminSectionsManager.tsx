import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Check,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { BUILT_IN_SECTIONS } from '../data/siteData';
import type {
  CustomSection,
  FaqEntry,
  PageId,
  PricingTier,
  ServiceOffering,
  TeamMember,
} from '../types/content';
import { IMAGE_SLOT_STYLE_OPTIONS } from '../utils/imageStyles';
import { readAndCompressFile } from '../utils/imageCompression';
import { markPendingCloudSync } from '../App';
import {
  isCloudAdminSignedIn,
  syncCustomSectionsToCloud,
  syncFaqsToCloud,
  syncPricingToCloud,
  syncServicesToCloud,
  syncSettingsToCloud,
  syncSlotImageToCloud,
  syncTeamMembersToCloud,
  syncTextUpdatesToCloud,
} from '../services/cmsCloud';

export type SectionEditorFocus =
  | 'team'
  | 'services'
  | 'pricing'
  | 'faqs'
  | 'custom'
  | 'builtin';

interface AdminSectionsManagerProps {
  token: string;
  teamMembers: TeamMember[];
  services: ServiceOffering[];
  pricingTiers: PricingTier[];
  faqs: FaqEntry[];
  customSections: CustomSection[];
  hiddenSections: string[];
  siteText: Record<string, string>;
  siteImages: Record<string, string>;
  initialFocus?: SectionEditorFocus;
  onRefreshContent: (token?: string) => Promise<void>;
}

const PAGE_LABELS: { value: Exclude<PageId, 'admin'>; label: string }[] = [
  { value: 'home', label: 'Home Page' },
  { value: 'services', label: 'Services Page' },
  { value: 'pricing', label: 'Pricing Page' },
  { value: 'about', label: 'About Us Page' },
  { value: 'team', label: 'Meet Our Team Page' },
  { value: 'faq', label: 'FAQ Page' },
  { value: 'contact', label: 'Contact Page' },
];

export function AdminSectionsManager({
  token,
  teamMembers,
  services,
  pricingTiers,
  faqs,
  customSections,
  hiddenSections,
  siteText,
  siteImages,
  onRefreshContent,
}: AdminSectionsManagerProps) {
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Team Form State
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamRole, setTeamRole] = useState('');
  const [teamSpecialty, setTeamSpecialty] = useState('');
  const [teamBio, setTeamBio] = useState('');
  const [teamImage, setTeamImage] = useState('');
  const [teamImageStyle, setTeamImageStyle] = useState('standard');
  const [teamCtaLabel, setTeamCtaLabel] = useState('');
  const [teamCtaUrl, setTeamCtaUrl] = useState('');

  // Service Form State
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [srvTitle, setSrvTitle] = useState('');
  const [srvSubtitle, setSrvSubtitle] = useState('');
  const [srvModeLabel, setSrvModeLabel] = useState('Single Service or Full Setup');
  const [srvDescription, setSrvDescription] = useState('');
  const [srvDeliverables, setSrvDeliverables] = useState('');
  const [srvWhatsappIntent, setSrvWhatsappIntent] = useState('');
  const [srvImage, setSrvImage] = useState('');
  const [srvImageStyle, setSrvImageStyle] = useState('standard');
  const [srvCtaLabel, setSrvCtaLabel] = useState('');
  const [srvCtaUrl, setSrvCtaUrl] = useState('');

  // Pricing Form State
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [tierName, setTierName] = useState('');
  const [tierTag, setTierTag] = useState('Single Service');
  const [tierPrice, setTierPrice] = useState('');
  const [tierBilling, setTierBilling] = useState('');
  const [tierSummary, setTierSummary] = useState('');
  const [tierFeatures, setTierFeatures] = useState('');
  const [tierFeatured, setTierFeatured] = useState(false);
  const [tierWhatsapp, setTierWhatsapp] = useState('');
  const [tierCtaLabel, setTierCtaLabel] = useState('');
  const [tierCtaUrl, setTierCtaUrl] = useState('');

  // FAQ Form State
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  // Custom Section Form State
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [secPageId, setSecPageId] = useState<Exclude<PageId, 'admin'>>('home');
  const [secKicker, setSecKicker] = useState('');
  const [secTitle, setSecTitle] = useState('');
  const [secDescription, setSecDescription] = useState('');
  const [secBullets, setSecBullets] = useState('');
  const [secCtaLabel, setSecCtaLabel] = useState('');
  const [secCtaUrl, setSecCtaUrl] = useState('');
  const [secImage, setSecImage] = useState('');
  const [secImageStyle, setSecImageStyle] = useState('standard');
  const [secTone, setSecTone] = useState<'white' | 'light' | 'accent'>('white');

  const readFileAsDataUrl = (file: File | undefined, onDone: (dataUrl: string) => void) => {
    if (!file) return;
    void readAndCompressFile(file)
      .then((dataUrl) => onDone(dataUrl))
      .catch(() => setStatusMsg({ type: 'err', text: 'Unable to read image file.' }));
  };

  const clearLegacyTextOverrides = async (keys: string[]) => {
    const updates: Record<string, null> = {};
    let hasAny = false;
    for (const k of keys) {
      if (siteText[k] !== undefined) {
        updates[k] = null;
        hasAny = true;
      }
    }
    if (hasAny) {
      await fetch('/api/admin/site-text', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ updates }),
      });
      if (isCloudAdminSignedIn()) {
        await syncTextUpdatesToCloud(updates);
      } else {
        markPendingCloudSync(true);
      }
    }
  };

  const clearLegacyImageOverride = async (slotKey: string) => {
    if (siteImages[slotKey] !== undefined) {
      await fetch('/api/admin/replace-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ slotKey, reset: true }),
      });
      if (isCloudAdminSignedIn()) {
        await syncSlotImageToCloud(slotKey, null);
      } else {
        markPendingCloudSync(true);
      }
    }
  };

  const saveList = async (
    endpoint: string,
    payload: Record<string, unknown>,
    successText: string
  ): Promise<boolean> => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatusMsg({ type: 'err', text: data.error || 'Failed to save changes.' });
        return false;
      }
      if (isCloudAdminSignedIn()) {
        if (endpoint === '/api/admin/team' && Array.isArray(payload.teamMembers)) {
          await syncTeamMembersToCloud(payload.teamMembers as TeamMember[]);
        } else if (endpoint === '/api/admin/services' && Array.isArray(payload.services)) {
          await syncServicesToCloud(payload.services as ServiceOffering[]);
        } else if (endpoint === '/api/admin/pricing' && Array.isArray(payload.pricingTiers)) {
          await syncPricingToCloud(payload.pricingTiers as PricingTier[]);
        } else if (endpoint === '/api/admin/faqs' && Array.isArray(payload.faqs)) {
          await syncFaqsToCloud(payload.faqs as FaqEntry[]);
        } else if (
          endpoint === '/api/admin/custom-sections' &&
          Array.isArray(payload.customSections)
        ) {
          await syncCustomSectionsToCloud(payload.customSections as CustomSection[]);
        } else if (
          endpoint === '/api/admin/hidden-sections' &&
          Array.isArray(payload.hiddenSections)
        ) {
          await syncSettingsToCloud({
            hiddenSections: payload.hiddenSections as string[],
          });
        }
        markPendingCloudSync(false);
      } else {
        markPendingCloudSync(true);
      }
      setStatusMsg({ type: 'ok', text: successText });
      await onRefreshContent(token);
      return true;
    } catch {
      setStatusMsg({ type: 'err', text: 'Network error saving section.' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  // --- TEAM HANDLERS ---
  const openAddTeam = () => {
    setEditingTeamId(null);
    setTeamName('');
    setTeamRole('');
    setTeamSpecialty('');
    setTeamBio('');
    setTeamImage('');
    setTeamImageStyle('standard');
    setTeamCtaLabel('');
    setTeamCtaUrl('');
    setShowTeamForm(true);
  };

  const openEditTeam = (m: TeamMember) => {
    setEditingTeamId(m.id);
    setTeamName(siteText[`team.${m.id}.name`] || m.name);
    setTeamRole(siteText[`team.${m.id}.role`] || m.role);
    setTeamSpecialty(siteText[`team.${m.id}.specialty`] || m.specialty);
    setTeamBio(siteText[`team.${m.id}.bio`] || m.bio);
    setTeamImage(siteImages[`team.${m.id}.image`] || m.image || '');
    setTeamImageStyle(siteText[`imageStyle.team.${m.id}.image`] || m.imageStyle || 'standard');
    setTeamCtaLabel(siteText[`team.${m.id}.ctaLabel`] || m.ctaLabel || '');
    setTeamCtaUrl(siteText[`team.${m.id}.ctaUrl`] || m.ctaUrl || '');
    setShowTeamForm(true);
  };

  const handleSaveTeamMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    const id = editingTeamId || `member-${Date.now()}`;
    const entry: TeamMember = {
      id,
      name: teamName.trim(),
      role: teamRole.trim() || 'Digital Specialist',
      specialty: teamSpecialty.trim(),
      bio: teamBio.trim(),
      image: teamImage.trim(),
      imageStyle: teamImageStyle,
      ctaLabel: teamCtaLabel.trim(),
      ctaUrl: teamCtaUrl.trim(),
    };
    const nextList = editingTeamId
      ? teamMembers.map((m) => (m.id === editingTeamId ? entry : m))
      : [...teamMembers, entry];

    if (editingTeamId) {
      await clearLegacyTextOverrides([
        `team.${id}.name`,
        `team.${id}.role`,
        `team.${id}.specialty`,
        `team.${id}.bio`,
        `team.${id}.ctaLabel`,
        `team.${id}.ctaUrl`,
        `imageStyle.team.${id}.image`,
      ]);
      await clearLegacyImageOverride(`team.${id}.image`);
    }

    const ok = await saveList(
      '/api/admin/team',
      { teamMembers: nextList },
      editingTeamId ? 'Team member updated!' : 'New team member added!'
    );
    if (ok) setShowTeamForm(false);
  };

  const handleDeleteTeamMember = async (id: string) => {
    const nextList = teamMembers.filter((m) => m.id !== id);
    await saveList('/api/admin/team', { teamMembers: nextList }, 'Team member deleted.');
  };

  // --- SERVICE HANDLERS ---
  const openAddService = () => {
    setEditingServiceId(null);
    setSrvTitle('');
    setSrvSubtitle('');
    setSrvModeLabel('Single Service or Full Setup');
    setSrvDescription('');
    setSrvDeliverables('');
    setSrvWhatsappIntent('');
    setSrvImage('');
    setSrvImageStyle('standard');
    setSrvCtaLabel('');
    setSrvCtaUrl('');
    setShowServiceForm(true);
  };

  const openEditService = (s: ServiceOffering) => {
    setEditingServiceId(s.id);
    setSrvTitle(siteText[`services.${s.id}.title`] || s.title);
    setSrvSubtitle(siteText[`services.${s.id}.subtitle`] || s.subtitle);
    setSrvModeLabel(siteText[`services.${s.id}.modeLabel`] || s.modeLabel);
    setSrvDescription(siteText[`services.${s.id}.description`] || s.description);
    setSrvDeliverables(siteText[`services.${s.id}.deliverables`] || s.deliverables.join('\n'));
    setSrvWhatsappIntent(s.whatsappIntent);
    setSrvImage(siteImages[`services.${s.id}.image`] || s.image || '');
    setSrvImageStyle(siteText[`imageStyle.services.${s.id}.image`] || s.imageStyle || 'standard');
    setSrvCtaLabel(siteText[`services.${s.id}.ctaLabel`] || s.ctaLabel || '');
    setSrvCtaUrl(siteText[`services.${s.id}.ctaUrl`] || s.ctaUrl || '');
    setShowServiceForm(true);
  };

  const handleSaveService = async (e: FormEvent) => {
    e.preventDefault();
    if (!srvTitle.trim()) return;
    const id = editingServiceId || `service-${Date.now()}`;
    const deliverables = srvDeliverables
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const existingSrv = editingServiceId ? services.find((x) => x.id === editingServiceId) : undefined;
    const entry: ServiceOffering = {
      id,
      number: '01',
      title: srvTitle.trim(),
      subtitle: srvSubtitle.trim(),
      modeLabel: srvModeLabel.trim() || 'Single Service or Full Setup',
      description: srvDescription.trim(),
      deliverables,
      whatsappIntent: srvWhatsappIntent.trim() || srvTitle.trim(),
      image: srvImage.trim(),
      imageStyle: srvImageStyle,
      ctaLabel: srvCtaLabel.trim(),
      ctaUrl: srvCtaUrl.trim(),
      secondaryCtaLabel: existingSrv?.secondaryCtaLabel || '',
      secondaryCtaUrl: existingSrv?.secondaryCtaUrl || '',
    };
    const nextList = editingServiceId
      ? services.map((s) => (s.id === editingServiceId ? entry : s))
      : [...services, entry];

    if (editingServiceId) {
      await clearLegacyTextOverrides([
        `services.${id}.title`,
        `services.${id}.subtitle`,
        `services.${id}.modeLabel`,
        `services.${id}.description`,
        `services.${id}.deliverables`,
        `services.${id}.ctaLabel`,
        `services.${id}.ctaUrl`,
        `imageStyle.services.${id}.image`,
      ]);
      await clearLegacyImageOverride(`services.${id}.image`);
    }

    const ok = await saveList(
      '/api/admin/services',
      { services: nextList },
      editingServiceId ? 'Service updated!' : 'New service added!'
    );
    if (ok) setShowServiceForm(false);
  };

  const handleDeleteService = async (id: string) => {
    const nextList = services.filter((s) => s.id !== id);
    await saveList('/api/admin/services', { services: nextList }, 'Service deleted.');
  };

  // --- PRICING HANDLERS ---
  const openAddPricing = () => {
    setEditingPricingId(null);
    setTierName('');
    setTierTag('Single Service');
    setTierPrice('');
    setTierBilling('');
    setTierSummary('');
    setTierFeatures('');
    setTierFeatured(false);
    setTierWhatsapp('');
    setTierCtaLabel('');
    setTierCtaUrl('');
    setShowPricingForm(true);
  };

  const openEditPricing = (p: PricingTier) => {
    setEditingPricingId(p.id);
    setTierName(siteText[`pricing.${p.id}.name`] || p.name);
    setTierTag(siteText[`pricing.${p.id}.tag`] || p.tag);
    setTierPrice(siteText[`pricing.${p.id}.priceDisplay`] || p.priceDisplay);
    setTierBilling(siteText[`pricing.${p.id}.billingNote`] || p.billingNote);
    setTierSummary(siteText[`pricing.${p.id}.summary`] || p.summary);
    setTierFeatures(siteText[`pricing.${p.id}.features`] || p.features.join('\n'));
    setTierFeatured(Boolean(p.featured));
    setTierWhatsapp(p.whatsappService);
    setTierCtaLabel(siteText[`pricing.${p.id}.ctaLabel`] || p.ctaLabel || '');
    setTierCtaUrl(siteText[`pricing.${p.id}.ctaUrl`] || p.ctaUrl || '');
    setShowPricingForm(true);
  };

  const handleSavePricing = async (e: FormEvent) => {
    e.preventDefault();
    if (!tierName.trim()) return;
    const id = editingPricingId || `tier-${Date.now()}`;
    const features = tierFeatures
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const entry: PricingTier = {
      id,
      name: tierName.trim(),
      tag: tierTag.trim() || 'Package',
      priceDisplay: tierPrice.trim() || 'Custom Quote',
      billingNote: tierBilling.trim(),
      summary: tierSummary.trim(),
      features,
      featured: tierFeatured,
      whatsappService: tierWhatsapp.trim() || tierName.trim(),
      ctaLabel: tierCtaLabel.trim(),
      ctaUrl: tierCtaUrl.trim(),
    };
    const nextList = editingPricingId
      ? pricingTiers.map((p) => (p.id === editingPricingId ? entry : p))
      : [...pricingTiers, entry];

    if (editingPricingId) {
      await clearLegacyTextOverrides([
        `pricing.${id}.name`,
        `pricing.${id}.tag`,
        `pricing.${id}.priceDisplay`,
        `pricing.${id}.billingNote`,
        `pricing.${id}.summary`,
        `pricing.${id}.features`,
        `pricing.${id}.ctaLabel`,
        `pricing.${id}.ctaUrl`,
      ]);
    }

    const ok = await saveList(
      '/api/admin/pricing',
      { pricingTiers: nextList },
      editingPricingId ? 'Pricing package updated!' : 'New pricing package added!'
    );
    if (ok) setShowPricingForm(false);
  };

  const handleDeletePricing = async (id: string) => {
    const nextList = pricingTiers.filter((p) => p.id !== id);
    await saveList('/api/admin/pricing', { pricingTiers: nextList }, 'Pricing package deleted.');
  };

  // --- FAQ HANDLERS ---
  const openAddFaq = () => {
    setEditingFaqId(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setShowFaqForm(true);
  };

  const openEditFaq = (f: FaqEntry, idx: number) => {
    setEditingFaqId(f.id);
    setFaqQuestion(siteText[`faq.${idx}.question`] || f.question);
    setFaqAnswer(siteText[`faq.${idx}.answer`] || f.answer);
    setShowFaqForm(true);
  };

  const handleSaveFaq = async (e: FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim()) return;
    const id = editingFaqId || `faq-${Date.now()}`;
    const entry: FaqEntry = {
      id,
      question: faqQuestion.trim(),
      answer: faqAnswer.trim(),
    };
    const nextList = editingFaqId
      ? faqs.map((f) => (f.id === editingFaqId ? entry : f))
      : [...faqs, entry];

    if (editingFaqId) {
      const idx = faqs.findIndex((f) => f.id === editingFaqId);
      if (idx >= 0) {
        await clearLegacyTextOverrides([`faq.${idx}.question`, `faq.${idx}.answer`]);
      }
    }

    const ok = await saveList(
      '/api/admin/faqs',
      { faqs: nextList },
      editingFaqId ? 'FAQ updated!' : 'New FAQ added!'
    );
    if (ok) setShowFaqForm(false);
  };

  const handleDeleteFaq = async (id: string) => {
    const nextList = faqs.filter((f) => f.id !== id);
    await saveList('/api/admin/faqs', { faqs: nextList }, 'FAQ deleted.');
  };

  // --- CUSTOM SECTION HANDLERS ---
  const openAddCustomSection = () => {
    setEditingCustomId(null);
    setSecPageId('home');
    setSecKicker('');
    setSecTitle('');
    setSecDescription('');
    setSecBullets('');
    setSecCtaLabel('');
    setSecCtaUrl('');
    setSecImage('');
    setSecImageStyle('standard');
    setSecTone('white');
    setShowCustomForm(true);
  };

  const openEditCustomSection = (sec: CustomSection) => {
    setEditingCustomId(sec.id);
    setSecPageId(sec.pageId);
    setSecKicker(siteText[`custom.${sec.id}.kicker`] || sec.kicker || '');
    setSecTitle(siteText[`custom.${sec.id}.title`] || sec.title);
    setSecDescription(siteText[`custom.${sec.id}.description`] || sec.description);
    setSecBullets(siteText[`custom.${sec.id}.bullets`] || sec.bullets.join('\n'));
    setSecCtaLabel(siteText[`custom.${sec.id}.ctaLabel`] || sec.ctaLabel || '');
    setSecCtaUrl(sec.ctaUrl || '');
    setSecImage(siteImages[`custom.${sec.id}.image`] || sec.image || '');
    setSecImageStyle(siteText[`imageStyle.custom.${sec.id}.image`] || sec.imageStyle || 'standard');
    setSecTone(sec.tone || 'white');
    setShowCustomForm(true);
  };

  const handleSaveCustomSection = async (e: FormEvent) => {
    e.preventDefault();
    if (!secTitle.trim()) return;
    const id = editingCustomId || `section-${Date.now()}`;
    const entry: CustomSection = {
      id,
      pageId: secPageId,
      kicker: secKicker.trim(),
      title: secTitle.trim(),
      description: secDescription.trim(),
      bullets: secBullets
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      ctaLabel: secCtaLabel.trim(),
      ctaUrl: secCtaUrl.trim(),
      image: secImage.trim(),
      imageStyle: secImageStyle,
      tone: secTone,
    };
    const nextList = editingCustomId
      ? customSections.map((s) => (s.id === editingCustomId ? entry : s))
      : [...customSections, entry];

    if (editingCustomId) {
      await clearLegacyTextOverrides([
        `custom.${id}.kicker`,
        `custom.${id}.title`,
        `custom.${id}.description`,
        `custom.${id}.bullets`,
        `custom.${id}.ctaLabel`,
        `imageStyle.custom.${id}.image`,
      ]);
      await clearLegacyImageOverride(`custom.${id}.image`);
    }

    const ok = await saveList(
      '/api/admin/custom-sections',
      { customSections: nextList },
      editingCustomId ? 'Section updated!' : 'New page section added!'
    );
    if (ok) setShowCustomForm(false);
  };

  const handleDeleteCustomSection = async (id: string) => {
    const nextList = customSections.filter((s) => s.id !== id);
    await saveList(
      '/api/admin/custom-sections',
      { customSections: nextList },
      'Custom section deleted.'
    );
  };

  const handleToggleBuiltInSection = async (sectionId: string) => {
    const isCurrentlyHidden = hiddenSections.includes(sectionId);
    const nextHidden = isCurrentlyHidden
      ? hiddenSections.filter((id) => id !== sectionId)
      : [...hiddenSections, sectionId];
    await saveList(
      '/api/admin/hidden-sections',
      { hiddenSections: nextHidden },
      isCurrentlyHidden ? 'Section restored to page.' : 'Section removed from page.'
    );
  };

  return (
    <div className="space-y-8">
      {statusMsg && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm font-medium flex items-center justify-between gap-3 ${
            statusMsg.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. TEAM MEMBERS SECTION (+ ADD / EDIT / DELETE) */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Meet Our Team ({teamMembers.length})
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Click the + button to add as many team members with any role as you want.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddTeam}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Team Member</span>
          </button>
        </div>

        {showTeamForm && (
          <form
            onSubmit={handleSaveTeamMember}
            className="p-6 bg-orange-50/40 border-b border-neutral-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingTeamId ? 'Edit Team Member' : 'Add New Team Member'}
              </h3>
              <button
                type="button"
                onClick={() => setShowTeamForm(false)}
                className="text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Tunde Adebayo"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Role / Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={teamRole}
                  onChange={(e) => setTeamRole(e.target.value)}
                  placeholder="e.g. TikTok Ads Strategist / Video Editor"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Specialty Tag
                </label>
                <input
                  type="text"
                  value={teamSpecialty}
                  onChange={(e) => setTeamSpecialty(e.target.value)}
                  placeholder="e.g. E-Commerce · Meta Pixel"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Short Bio</label>
              <textarea
                rows={2}
                value={teamBio}
                onChange={(e) => setTeamBio(e.target.value)}
                placeholder="Write a brief bio about this team member..."
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Button Word (CTA Text)
                </label>
                <input
                  type="text"
                  value={teamCtaLabel}
                  onChange={(e) => setTeamCtaLabel(e.target.value)}
                  placeholder="Default: Connect on WhatsApp"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Button Destination (Website, WhatsApp, or Page)
                </label>
                <input
                  type="text"
                  value={teamCtaUrl}
                  onChange={(e) => setTeamCtaUrl(e.target.value)}
                  placeholder="Leave blank for WhatsApp, or paste https://... / #contact"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Photo URL (or upload from gallery)
                </label>
                <input
                  type="text"
                  value={teamImage}
                  onChange={(e) => setTeamImage(e.target.value)}
                  placeholder="https://... or upload below"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Image Style
                </label>
                <select
                  value={teamImageStyle}
                  onChange={(e) => setTeamImageStyle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {IMAGE_SLOT_STYLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-900 bg-yellow-300 hover:bg-yellow-400 rounded-lg cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => {
                      readFileAsDataUrl(e.target.files?.[0], (url) => setTeamImage(url));
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-lg cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{editingTeamId ? 'Save Team Member' : 'Add Member to Team Page'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="divide-y divide-neutral-200">
          {teamMembers.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500">
              No team members yet. Click &ldquo;+ Add Team Member&rdquo; above to add one.
            </p>
          ) : (
            teamMembers.map((m) => (
              <div
                key={m.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {m.image ? (
                    <img
                      src={siteImages[`team.${m.id}.image`] || m.image}
                      alt={m.name}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-xl object-cover border border-neutral-200 shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {(siteText[`team.${m.id}.name`] || m.name).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">
                      {siteText[`team.${m.id}.name`] || m.name}
                    </p>
                    <p className="text-xs text-neutral-600 truncate">
                      {siteText[`team.${m.id}.role`] || m.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditTeam(m)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDeleteTeamMember(m.id)}
                    aria-label={`Delete ${m.name}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. SERVICES SECTION (+ ADD / EDIT / DELETE) */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Services List ({services.length})
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Click the + button to add a new service offering or delete existing ones.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddService}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Service</span>
          </button>
        </div>

        {showServiceForm && (
          <form
            onSubmit={handleSaveService}
            className="p-6 bg-orange-50/40 border-b border-neutral-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingServiceId ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                type="button"
                onClick={() => setShowServiceForm(false)}
                className="text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={srvTitle}
                  onChange={(e) => setSrvTitle(e.target.value)}
                  placeholder="e.g. Brand Identity & Copywriting"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={srvSubtitle}
                  onChange={(e) => setSrvSubtitle(e.target.value)}
                  placeholder="e.g. High-Converting Sales Messaging"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Mode Label
                </label>
                <input
                  type="text"
                  value={srvModeLabel}
                  onChange={(e) => setSrvModeLabel(e.target.value)}
                  placeholder="Single Service or Full Setup"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={srvDescription}
                  onChange={(e) => setSrvDescription(e.target.value)}
                  placeholder="Describe what clients get with this service..."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Deliverables (one per line)
                </label>
                <textarea
                  rows={3}
                  value={srvDeliverables}
                  onChange={(e) => setSrvDeliverables(e.target.value)}
                  placeholder={'Deliverable 1\nDeliverable 2\nDeliverable 3'}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Primary Button Word (CTA Text)
                </label>
                <input
                  type="text"
                  value={srvCtaLabel}
                  onChange={(e) => setSrvCtaLabel(e.target.value)}
                  placeholder="Default: Hire for Service"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Primary Button Destination (Website, WhatsApp, or Page)
                </label>
                <input
                  type="text"
                  value={srvCtaUrl}
                  onChange={(e) => setSrvCtaUrl(e.target.value)}
                  placeholder="Leave blank for WhatsApp, or paste https://... / #pricing"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Service Image URL (or upload)
                </label>
                <input
                  type="text"
                  value={srvImage}
                  onChange={(e) => setSrvImage(e.target.value)}
                  placeholder="https://... or upload from gallery"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Image Style
                </label>
                <select
                  value={srvImageStyle}
                  onChange={(e) => setSrvImageStyle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {IMAGE_SLOT_STYLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-900 bg-yellow-300 hover:bg-yellow-400 rounded-lg cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => {
                      readFileAsDataUrl(e.target.files?.[0], (url) => setSrvImage(url));
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-lg cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{editingServiceId ? 'Save Service' : 'Add Service to Website'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="divide-y divide-neutral-200">
          {services.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500">
              No services yet. Click &ldquo;+ Add Service&rdquo; above to add one.
            </p>
          ) : (
            services.map((s, idx) => (
              <div
                key={s.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-orange-600">
                    {String(idx + 1).padStart(2, '0')} · {siteText[`services.${s.id}.modeLabel`] || s.modeLabel}
                  </p>
                  <p className="text-sm font-bold text-neutral-900 truncate">
                    {siteText[`services.${s.id}.title`] || s.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditService(s)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDeleteService(s.id)}
                    aria-label={`Delete ${s.title}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. PRICING PACKAGES SECTION (+ ADD / EDIT / DELETE) */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Pricing List &amp; Packages ({pricingTiers.length})
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Click the + button to add another pricing plan or remove packages anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddPricing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Pricing Plan</span>
          </button>
        </div>

        {showPricingForm && (
          <form
            onSubmit={handleSavePricing}
            className="p-6 bg-orange-50/40 border-b border-neutral-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingPricingId ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPricingForm(false)}
                className="text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  placeholder="e.g. E-Commerce Starter"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Top Tag
                </label>
                <input
                  type="text"
                  value={tierTag}
                  onChange={(e) => setTierTag(e.target.value)}
                  placeholder="e.g. Most Popular / Single Service"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Price Display
                </label>
                <input
                  type="text"
                  value={tierPrice}
                  onChange={(e) => setTierPrice(e.target.value)}
                  placeholder="e.g. ₦150,000 or Custom Quote"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Billing Note
                </label>
                <input
                  type="text"
                  value={tierBilling}
                  onChange={(e) => setTierBilling(e.target.value)}
                  placeholder="e.g. One-Time or Monthly"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Summary</label>
                <textarea
                  rows={3}
                  value={tierSummary}
                  onChange={(e) => setTierSummary(e.target.value)}
                  placeholder="Who is this plan best for?"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Included Features (one per line)
                </label>
                <textarea
                  rows={3}
                  value={tierFeatures}
                  onChange={(e) => setTierFeatures(e.target.value)}
                  placeholder={'Feature 1\nFeature 2\nFeature 3'}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Button Word (CTA Text)
                </label>
                <input
                  type="text"
                  value={tierCtaLabel}
                  onChange={(e) => setTierCtaLabel(e.target.value)}
                  placeholder="Default: Hire via WhatsApp"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Button Destination (Website, WhatsApp, or Page)
                </label>
                <input
                  type="text"
                  value={tierCtaUrl}
                  onChange={(e) => setTierCtaUrl(e.target.value)}
                  placeholder="Leave blank for WhatsApp, or paste https://... / #contact"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tierFeatured}
                  onChange={(e) => setTierFeatured(e.target.checked)}
                  className="h-4 w-4 accent-orange-600 rounded"
                />
                <span>Highlight as Featured Orange Card</span>
              </label>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-lg cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{editingPricingId ? 'Save Pricing Plan' : 'Add Plan to Pricing Page'}</span>
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-neutral-200">
          {pricingTiers.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500">
              No pricing plans yet. Click &ldquo;+ Add Pricing Plan&rdquo; above to add one.
            </p>
          ) : (
            pricingTiers.map((p) => (
              <div
                key={p.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-orange-600">
                    {siteText[`pricing.${p.id}.tag`] || p.tag} ·{' '}
                    {siteText[`pricing.${p.id}.priceDisplay`] || p.priceDisplay}
                  </p>
                  <p className="text-sm font-bold text-neutral-900 truncate">
                    {siteText[`pricing.${p.id}.name`] || p.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditPricing(p)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDeletePricing(p.id)}
                    aria-label={`Delete ${p.name}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. FAQ SECTION (+ ADD / EDIT / DELETE) */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">FAQ List ({faqs.length})</h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Click the + button to add more questions &amp; answers or delete existing ones.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddFaq}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add FAQ</span>
          </button>
        </div>

        {showFaqForm && (
          <form
            onSubmit={handleSaveFaq}
            className="p-6 bg-orange-50/40 border-b border-neutral-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingFaqId ? 'Edit FAQ' : 'Add New FAQ'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFaqForm(false)}
                className="text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Question *
              </label>
              <input
                type="text"
                required
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="e.g. Do you offer payment installments?"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Answer *</label>
              <textarea
                rows={2}
                required
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="Clear, confident answer for clients..."
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-lg cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{editingFaqId ? 'Save FAQ' : 'Add FAQ to Page'}</span>
            </button>
          </form>
        )}

        <div className="divide-y divide-neutral-200">
          {faqs.map((f, idx) => (
            <div
              key={f.id || idx}
              className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {siteText[`faq.${idx}.question`] || f.question}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditFaq(f, idx)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDeleteFaq(f.id)}
                  aria-label={`Delete FAQ ${idx + 1}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. ADD ANOTHER CUSTOM SECTION / DELETE ANY SECTION */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Custom Page Sections ({customSections.length})
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Add brand-new sections to any page on your website or delete sections you no longer need.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddCustomSection}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Section</span>
          </button>
        </div>

        {showCustomForm && (
          <form
            onSubmit={handleSaveCustomSection}
            className="p-6 bg-orange-50/40 border-b border-neutral-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingCustomId ? 'Edit Custom Section' : 'Create New Page Section'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Show On Page *
                </label>
                <select
                  value={secPageId}
                  onChange={(e) => setSecPageId(e.target.value as Exclude<PageId, 'admin'>)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {PAGE_LABELS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Section Style
                </label>
                <select
                  value={secTone}
                  onChange={(e) => setSecTone(e.target.value as 'white' | 'light' | 'accent')}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="white">Clean White</option>
                  <option value="light">Soft Gray Band</option>
                  <option value="accent">Orange Highlight Band</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Small Top Label (Kicker)
                </label>
                <input
                  type="text"
                  value={secKicker}
                  onChange={(e) => setSecKicker(e.target.value)}
                  placeholder="e.g. Client Results / New Offer"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Section Heading *
                </label>
                <input
                  type="text"
                  required
                  value={secTitle}
                  onChange={(e) => setSecTitle(e.target.value)}
                  placeholder="e.g. Why Brands Across Lagos Trust BossAdoly"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Optional Button Word (CTA Text)
                </label>
                <input
                  type="text"
                  value={secCtaLabel}
                  onChange={(e) => setSecCtaLabel(e.target.value)}
                  placeholder="e.g. Visit Website or Chat Now"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Button Destination (Website, WhatsApp, or Page)
                </label>
                <input
                  type="text"
                  value={secCtaUrl}
                  onChange={(e) => setSecCtaUrl(e.target.value)}
                  placeholder="Default: WhatsApp, or paste https://..."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={secDescription}
                  onChange={(e) => setSecDescription(e.target.value)}
                  placeholder="Write the main text for this section..."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Optional Bullet Points (one per line)
                </label>
                <textarea
                  rows={3}
                  value={secBullets}
                  onChange={(e) => setSecBullets(e.target.value)}
                  placeholder={'Point 1\nPoint 2\nPoint 3'}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Optional Section Image URL (or upload)
                </label>
                <input
                  type="text"
                  value={secImage}
                  onChange={(e) => setSecImage(e.target.value)}
                  placeholder="Leave empty for text-only section"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Image Style
                </label>
                <select
                  value={secImageStyle}
                  onChange={(e) => setSecImageStyle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {IMAGE_SLOT_STYLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-900 bg-yellow-300 hover:bg-yellow-400 rounded-lg cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => {
                      readFileAsDataUrl(e.target.files?.[0], (url) => setSecImage(url));
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-lg cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{editingCustomId ? 'Save Section' : 'Publish New Section'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="divide-y divide-neutral-200">
          {customSections.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500">
              No extra custom sections added yet. Click &ldquo;+ Add New Section&rdquo; above to add one to any page.
            </p>
          ) : (
            customSections.map((sec) => {
              const pageName =
                PAGE_LABELS.find((p) => p.value === sec.pageId)?.label || sec.pageId;
              return (
                <div
                  key={sec.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-orange-600">{pageName}</p>
                    <p className="text-sm font-bold text-neutral-900 truncate">{sec.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditCustomSection(sec)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDeleteCustomSection(sec.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Section</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. BUILT-IN PAGE SECTIONS (DELETE OR RESTORE DEFAULT SECTIONS) */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">Built-In Page Sections</h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Remove any built-in section from your pages or restore it anytime.
          </p>
        </div>

        <div className="divide-y divide-neutral-200">
          {BUILT_IN_SECTIONS.map((sec) => {
            const isHidden = hiddenSections.includes(sec.id);
            return (
              <div
                key={sec.id}
                className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <p className="text-xs font-semibold text-orange-600">{sec.pageLabel}</p>
                  <p
                    className={`text-sm font-semibold ${
                      isHidden ? 'text-neutral-400 line-through' : 'text-neutral-900'
                    }`}
                  >
                    {sec.sectionName}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleToggleBuiltInSection(sec.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                    isHidden
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  {isHidden ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restore Section</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Section</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
