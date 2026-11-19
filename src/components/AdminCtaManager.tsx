import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, ExternalLink, MousePointerClick, RotateCcw } from 'lucide-react';
import type {
  CustomSection,
  PricingTier,
  ServiceOffering,
  TeamMember,
} from '../types/content';
import { WHATSAPP_DISPLAY } from '../utils/whatsapp';
import { markPendingCloudSync } from '../App';
import {
  isCloudAdminSignedIn,
  syncCustomSectionsToCloud,
  syncTextUpdatesToCloud,
} from '../services/cmsCloud';

interface AdminCtaManagerProps {
  token: string;
  siteText: Record<string, string>;
  services: ServiceOffering[];
  pricingTiers: PricingTier[];
  teamMembers: TeamMember[];
  customSections: CustomSection[];
  onRefreshContent: (token?: string) => Promise<void>;
}

interface CtaFieldRow {
  id: string;
  title: string;
  labelKey?: string;
  defaultLabel?: string;
  urlKey?: string;
  defaultDestHint: string;
  customSectionId?: string;
}

interface CtaGroup {
  groupId: string;
  groupTitle: string;
  rows: CtaFieldRow[];
}

const INTERNAL_PAGE_OPTIONS = [
  { value: '', label: 'Use Default Destination' },
  { value: '#home', label: 'Page: Home' },
  { value: '#services', label: 'Page: Services' },
  { value: '#pricing', label: 'Page: Pricing' },
  { value: '#pricing-form', label: 'Page: Pricing (Quote Form)' },
  { value: '#about', label: 'Page: About Us' },
  { value: '#team', label: 'Page: Meet Our Team' },
  { value: '#faq', label: 'Page: FAQ' },
  { value: '#contact', label: 'Page: Contact' },
  { value: 'https://wa.me/2348077780074', label: `WhatsApp (${WHATSAPP_DISPLAY})` },
];

export function AdminCtaManager({
  token,
  siteText,
  services,
  pricingTiers,
  teamMembers,
  customSections,
  onRefreshContent,
}: AdminCtaManagerProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [customSecDrafts, setCustomSecDrafts] = useState<
    Record<string, { ctaLabel: string; ctaUrl: string }>
  >({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setDrafts(siteText);
  }, [siteText]);

  useEffect(() => {
    const map: Record<string, { ctaLabel: string; ctaUrl: string }> = {};
    for (const sec of customSections) {
      map[sec.id] = {
        ctaLabel: sec.ctaLabel || '',
        ctaUrl: sec.ctaUrl || '',
      };
    }
    setCustomSecDrafts(map);
  }, [customSections]);

  const groups: CtaGroup[] = [
    {
      groupId: 'global',
      groupTitle: 'Header & Floating Button',
      rows: [
        {
          id: 'nav-cta',
          title: 'Top Navigation Hire Button (Desktop)',
          labelKey: 'nav.cta',
          defaultLabel: 'Hire Me',
          urlKey: 'nav.cta.url',
          defaultDestHint: `Default: WhatsApp (${WHATSAPP_DISPLAY})`,
        },
        {
          id: 'nav-cta-mobile',
          title: 'Mobile Drawer Hire Button',
          labelKey: 'nav.cta.mobile',
          defaultLabel: 'Hire Me on WhatsApp',
          defaultDestHint: 'Uses Top Navigation destination above',
        },
        {
          id: 'floating-cta',
          title: 'Floating Bottom-Right Button',
          labelKey: 'floating.cta.title',
          defaultLabel: `Chat on WhatsApp (${WHATSAPP_DISPLAY})`,
          urlKey: 'floating.cta.url',
          defaultDestHint: `Default: WhatsApp (${WHATSAPP_DISPLAY})`,
        },
      ],
    },
    {
      groupId: 'home',
      groupTitle: 'Home Page Buttons',
      rows: [
        {
          id: 'home-hero-1',
          title: 'Hero Primary Button',
          labelKey: 'home.hero.ctaPrimary',
          defaultLabel: 'Hire Me on WhatsApp',
          urlKey: 'home.hero.ctaPrimary.url',
          defaultDestHint: `Default: WhatsApp (${WHATSAPP_DISPLAY})`,
        },
        {
          id: 'home-hero-2',
          title: 'Hero Secondary Button',
          labelKey: 'home.hero.ctaSecondary',
          defaultLabel: 'Build Custom Quote',
          urlKey: 'home.hero.ctaSecondary.url',
          defaultDestHint: 'Default: Pricing Quote Form (#pricing-form)',
        },
        {
          id: 'home-bento-left-1',
          title: 'Featured Ads & Web Card — Button 1',
          labelKey: 'home.bento.left.cta',
          defaultLabel: 'Hire for Ads or Web',
          urlKey: 'home.bento.left.cta.url',
          defaultDestHint: `Default: WhatsApp (${WHATSAPP_DISPLAY})`,
        },
        {
          id: 'home-bento-left-2',
          title: 'Featured Ads & Web Card — Button 2',
          labelKey: 'home.bento.left.ctaSecondary',
          defaultLabel: 'Explore Deliverables',
          urlKey: 'home.bento.left.ctaSecondary.url',
          defaultDestHint: 'Default: Services Page (#services)',
        },
        {
          id: 'home-bento-right',
          title: 'Featured AI UGC Card Button',
          labelKey: 'home.bento.right.cta',
          defaultLabel: 'Book AI UGC Videos',
          urlKey: 'home.bento.right.cta.url',
          defaultDestHint: `Default: WhatsApp (${WHATSAPP_DISPLAY})`,
        },
        {
          id: 'home-banner-1',
          title: 'Bottom Conversion Banner — Button 1',
          labelKey: 'home.banner.ctaPrimary',
          defaultLabel: 'Fill Project Brief',
          urlKey: 'home.banner.ctaPrimary.url',
          defaultDestHint: 'Default: Pricing Page (#pricing)',
        },
        {
          id: 'home-banner-2',
          title: 'Bottom Conversion Banner — Button 2',
          labelKey: 'home.banner.ctaSecondary',
          defaultLabel: 'Chat on WhatsApp',
          urlKey: 'home.banner.ctaSecondary.url',
          defaultDestHint: `Default: WhatsApp (${WHATSAPP_DISPLAY})`,
        },
      ],
    },
    {
      groupId: 'services',
      groupTitle: 'Services Page Buttons',
      rows: services.flatMap((srv, idx) => [
        {
          id: `srv-${srv.id}-1`,
          title: `Service ${idx + 1} (${srv.title}) — Primary Button`,
          labelKey: `services.${srv.id}.ctaLabel`,
          defaultLabel: srv.ctaLabel || `Hire for ${srv.title.split(' ')[0]}`,
          urlKey: `services.${srv.id}.ctaUrl`,
          defaultDestHint: srv.ctaUrl || `Default: WhatsApp (${WHATSAPP_DISPLAY})`,
        },
        {
          id: `srv-${srv.id}-2`,
          title: `Service ${idx + 1} (${srv.title}) — Secondary Button`,
          labelKey: `services.${srv.id}.secondaryCtaLabel`,
          defaultLabel: srv.secondaryCtaLabel || 'Request Custom Pricing',
          urlKey: `services.${srv.id}.secondaryCtaUrl`,
          defaultDestHint: srv.secondaryCtaUrl || 'Default: Pricing Page (#pricing)',
        },
      ]),
    },
    {
      groupId: 'pricing',
      groupTitle: 'Pricing Page Buttons',
      rows: [
        ...pricingTiers.map((tier, idx) => ({
          id: `tier-${tier.id}`,
          title: `Pricing Card ${idx + 1} (${tier.name})`,
          labelKey: `pricing.${tier.id}.ctaLabel`,
          defaultLabel: tier.ctaLabel || 'Hire via WhatsApp',
          urlKey: `pricing.${tier.id}.ctaUrl`,
          defaultDestHint: tier.ctaUrl || `Default: WhatsApp (${WHATSAPP_DISPLAY})`,
        })),
        {
          id: 'pricing-form-submit',
          title: 'Project Brief Form Submit Button',
          labelKey: 'pricing.form.submitLabel',
          defaultLabel: 'Submit & Send to WhatsApp',
          defaultDestHint: 'Submits form details straight to WhatsApp',
        },
      ],
    },
    {
      groupId: 'about',
      groupTitle: 'About Us Page Buttons',
      rows: [
        {
          id: 'about-1',
          title: 'About Us Primary Button',
          labelKey: 'about.ctaPrimary',
          defaultLabel: 'Hire BossAdoly',
          urlKey: 'about.ctaPrimary.url',
          defaultDestHint: `Default: WhatsApp (${WHATSAPP_DISPLAY})`,
        },
        {
          id: 'about-2',
          title: 'About Us Secondary Button',
          labelKey: 'about.ctaSecondary',
          defaultLabel: 'Explore Services',
          urlKey: 'about.ctaSecondary.url',
          defaultDestHint: 'Default: Services Page (#services)',
        },
      ],
    },
    {
      groupId: 'team',
      groupTitle: 'Meet Our Team Page Buttons',
      rows: teamMembers.map((member, idx) => ({
        id: `team-${member.id}`,
        title: `Member ${idx + 1} (${member.name})`,
        labelKey: `team.${member.id}.ctaLabel`,
        defaultLabel: member.ctaLabel || 'Connect on WhatsApp',
        urlKey: `team.${member.id}.ctaUrl`,
        defaultDestHint: member.ctaUrl || `Default: WhatsApp (${WHATSAPP_DISPLAY})`,
      })),
    },
    {
      groupId: 'faq',
      groupTitle: 'FAQ Page Buttons',
      rows: [
        {
          id: 'faq-1',
          title: 'FAQ Banner Primary Button',
          labelKey: 'faq.cta.primary',
          defaultLabel: 'Ask on WhatsApp',
          urlKey: 'faq.cta.primary.url',
          defaultDestHint: `Default: WhatsApp (${WHATSAPP_DISPLAY})`,
        },
        {
          id: 'faq-2',
          title: 'FAQ Banner Secondary Button',
          labelKey: 'faq.cta.secondary',
          defaultLabel: 'Go to Pricing',
          urlKey: 'faq.cta.secondary.url',
          defaultDestHint: 'Default: Pricing Page (#pricing)',
        },
      ],
    },
    {
      groupId: 'contact',
      groupTitle: 'Contact Page Buttons',
      rows: [
        {
          id: 'contact-wa',
          title: 'Direct WhatsApp Card Link & Subtext',
          labelKey: 'contact.whatsapp.subtext',
          defaultLabel: 'Tap here to chat & hire BossAdoly instantly',
          urlKey: 'contact.whatsapp.url',
          defaultDestHint: `Default: WhatsApp (${WHATSAPP_DISPLAY})`,
        },
        {
          id: 'contact-form',
          title: 'Quick Message Form Submit Button',
          labelKey: 'contact.form.submitLabel',
          defaultLabel: `Send on WhatsApp (${WHATSAPP_DISPLAY})`,
          defaultDestHint: 'Sends composer note directly to WhatsApp',
        },
      ],
    },
  ];

  const handleSaveAll = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    const updates: Record<string, string | null> = {};
    for (const grp of groups) {
      for (const row of grp.rows) {
        if (row.labelKey) {
          const val = drafts[row.labelKey];
          if (val === undefined || val === '' || val === row.defaultLabel) {
            updates[row.labelKey] = null;
          } else {
            updates[row.labelKey] = val;
          }
        }
        if (row.urlKey) {
          const urlVal = (drafts[row.urlKey] || '').trim();
          updates[row.urlKey] = urlVal ? urlVal : null;
        }
      }
    }

    try {
      const res = await fetch('/api/admin/site-text', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setStatus({ type: 'err', text: data.error || 'Failed to save button changes.' });
        return;
      }

      let updatedCustom: CustomSection[] | null = null;
      if (customSections.length > 0) {
        updatedCustom = customSections.map((sec) => {
          const d = customSecDrafts[sec.id];
          if (!d) return sec;
          return {
            ...sec,
            ctaLabel: d.ctaLabel.trim(),
            ctaUrl: d.ctaUrl.trim(),
          };
        });
        await fetch('/api/admin/custom-sections', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': token,
          },
          body: JSON.stringify({ customSections: updatedCustom }),
        });
      }

      if (isCloudAdminSignedIn()) {
        await syncTextUpdatesToCloud(updates);
        if (updatedCustom) {
          await syncCustomSectionsToCloud(updatedCustom);
        }
        markPendingCloudSync(false);
      } else {
        markPendingCloudSync(true);
      }

      setStatus({ type: 'ok', text: 'All CTA button words and destinations saved!' });
      await onRefreshContent(token);
    } catch {
      setStatus({ type: 'err', text: 'Network error while saving CTA settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetRow = async (row: CtaFieldRow) => {
    const updates: Record<string, null> = {};
    setDrafts((prev) => {
      const next = { ...prev };
      if (row.labelKey) {
        delete next[row.labelKey];
        updates[row.labelKey] = null;
      }
      if (row.urlKey) {
        delete next[row.urlKey];
        updates[row.urlKey] = null;
      }
      return next;
    });

    await fetch('/api/admin/site-text', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ updates }),
    });
    if (isCloudAdminSignedIn()) {
      await syncTextUpdatesToCloud(updates);
      markPendingCloudSync(false);
    } else {
      markPendingCloudSync(true);
    }
    await onRefreshContent(token);
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-8">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <MousePointerClick className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Edit Call-to-Action Words &amp; Destinations
            </h2>
            <p className="text-xs text-neutral-600 mt-1 max-w-2xl">
              Change the word on any button across any page, and set where it takes clients—a
              website link (e.g. <span className="font-semibold">https://...</span>), WhatsApp
              (<span className="font-semibold">https://wa.me/...</span> or phone number), or
              another page (<span className="font-semibold">#pricing</span>,{' '}
              <span className="font-semibold">#services</span>,{' '}
              <span className="font-semibold">#contact</span>).
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
        >
          <Check className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save All Buttons & Links'}</span>
        </button>
      </div>

      {status && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            status.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {status.text}
        </div>
      )}

      {groups.map((grp) => (
        <div
          key={grp.groupId}
          className="rounded-2xl border border-neutral-200 bg-white overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/70">
            <h3 className="text-lg font-bold text-neutral-900">{grp.groupTitle}</h3>
          </div>

          <div className="divide-y divide-neutral-200">
            {grp.rows.map((row) => {
              const labelVal = row.labelKey
                ? drafts[row.labelKey] ?? row.defaultLabel ?? ''
                : '';
              const urlVal = row.urlKey ? drafts[row.urlKey] ?? '' : '';
              const hasChanges =
                (row.labelKey &&
                  siteText[row.labelKey] !== undefined &&
                  siteText[row.labelKey] !== row.defaultLabel) ||
                Boolean(row.urlKey && siteText[row.urlKey]);

              return (
                <div key={row.id} className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-neutral-900">{row.title}</p>
                    {hasChanges && (
                      <button
                        type="button"
                        onClick={() => handleResetRow(row)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reset Default</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {row.labelKey && (
                      <div className={row.urlKey ? 'lg:col-span-5' : 'lg:col-span-12'}>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          Button Word / Text
                        </label>
                        <input
                          type="text"
                          value={labelVal}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [row.labelKey!]: e.target.value,
                            }))
                          }
                          placeholder={row.defaultLabel}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    )}

                    {row.urlKey && (
                      <div className="lg:col-span-7 space-y-1">
                        <label className="block text-xs font-semibold text-neutral-700">
                          Destination (Website URL, WhatsApp Link/Number, or Page)
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={urlVal}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [row.urlKey!]: e.target.value,
                              }))
                            }
                            placeholder={row.defaultDestHint}
                            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <select
                            aria-label={`Quick destination preset for ${row.title}`}
                            value={
                              INTERNAL_PAGE_OPTIONS.some((opt) => opt.value === urlVal)
                                ? urlVal
                                : ''
                            }
                            onChange={(e) => {
                              const chosen = e.target.value;
                              setDrafts((prev) => ({
                                ...prev,
                                [row.urlKey!]: chosen,
                              }));
                            }}
                            className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            {INTERNAL_PAGE_OPTIONS.map((opt) => (
                              <option key={opt.label} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          <span>
                            Leave blank for {row.defaultDestHint.replace(/^Default:\s*/i, '')}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {customSections.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/70">
            <h3 className="text-lg font-bold text-neutral-900">Custom Added Sections Buttons</h3>
          </div>
          <div className="divide-y divide-neutral-200">
            {customSections.map((sec) => {
              const draft = customSecDrafts[sec.id] || {
                ctaLabel: sec.ctaLabel || '',
                ctaUrl: sec.ctaUrl || '',
              };
              return (
                <div key={sec.id} className="p-6 space-y-3">
                  <p className="text-sm font-bold text-neutral-900">
                    {sec.title} <span className="text-xs font-normal text-orange-600">({sec.pageId})</span>
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-5">
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Button Word / Text
                      </label>
                      <input
                        type="text"
                        value={draft.ctaLabel}
                        onChange={(e) =>
                          setCustomSecDrafts((prev) => ({
                            ...prev,
                            [sec.id]: { ...draft, ctaLabel: e.target.value },
                          }))
                        }
                        placeholder="Leave blank to hide button"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="lg:col-span-7">
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Destination (Website URL, WhatsApp Link/Number, or Page)
                      </label>
                      <input
                        type="text"
                        value={draft.ctaUrl}
                        onChange={(e) =>
                          setCustomSecDrafts((prev) => ({
                            ...prev,
                            [sec.id]: { ...draft, ctaUrl: e.target.value },
                          }))
                        }
                        placeholder={`Default: WhatsApp (${WHATSAPP_DISPLAY})`}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </form>
  );
}
