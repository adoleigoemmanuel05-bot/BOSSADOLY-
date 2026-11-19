import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { FAQ_DATA, PRICING_TIERS, SERVICES_DATA, TEAM_DATA } from './data/siteData';
import { auth } from './firebase';
import { AboutPage } from './pages/AboutPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ContactPage } from './pages/ContactPage';
import { FaqPage } from './pages/FaqPage';
import { HomePage } from './pages/HomePage';
import { PricingPage } from './pages/PricingPage';
import { ServicesPage } from './pages/ServicesPage';
import { TeamPage } from './pages/TeamPage';
import {
  ADMIN_EMAIL,
  loadCmsFromCloud,
  syncAllCmsToCloud,
} from './services/cmsCloud';
import { isSupabaseAdminUser } from './services/cmsSupabase';
import { supabase } from './supabase';
import type { CmsContent, HeroAppearance, PageId } from './types/content';
import {
  isCmsEdited,
  loadLocalCmsSnapshot,
  saveLocalCmsSnapshot,
} from './utils/localSnapshot';

const VALID_PAGES: PageId[] = [
  'home',
  'services',
  'pricing',
  'about',
  'team',
  'faq',
  'contact',
  'admin',
];

export const SAVED_LOGO_KEY = 'bossadoly_saved_logo';
export const SAVED_HERO_APPEARANCE_KEY = 'bossadoly_hero_appearance';
export const SAVED_DYNAMIC_SECTIONS_KEY = 'bossadoly_dynamic_sections';
export const PENDING_CLOUD_SYNC_KEY = 'bossadoly_pending_cloud_sync';

const DEFAULT_HERO_APPEARANCE: HeroAppearance = {
  tone: 'light',
  overlayOpacity: 75,
  brightness: 100,
};

const DEFAULT_COUNTS = {
  teamCount: TEAM_DATA.length,
  servicesCount: SERVICES_DATA.length,
  pricingCount: PRICING_TIERS.length,
  faqsCount: FAQ_DATA.length,
};

function getInitialPage(): PageId {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash === 'pricing-form' || hash === 'pricing#pricing-quote-form') return 'pricing';
  return VALID_PAGES.includes(hash as PageId) ? (hash as PageId) : 'home';
}

function getInitialSectionId(): string | null {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash === 'pricing-form' || hash === 'pricing#pricing-quote-form') {
    return 'pricing-quote-form';
  }
  return null;
}

function readLocalLogo(): string | null {
  try {
    return localStorage.getItem(SAVED_LOGO_KEY);
  } catch {
    return null;
  }
}

function readLocalHeroAppearance(): HeroAppearance | null {
  try {
    const raw = localStorage.getItem(SAVED_HERO_APPEARANCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HeroAppearance>;
    if (
      (parsed.tone === 'light' || parsed.tone === 'dark') &&
      typeof parsed.overlayOpacity === 'number' &&
      typeof parsed.brightness === 'number'
    ) {
      return {
        tone: parsed.tone,
        overlayOpacity: parsed.overlayOpacity,
        brightness: parsed.brightness,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function markPendingCloudSync(pending: boolean): void {
  try {
    if (pending) {
      localStorage.setItem(PENDING_CLOUD_SYNC_KEY, '1');
    } else {
      localStorage.removeItem(PENDING_CLOUD_SYNC_KEY);
    }
  } catch {
    // Ignore storage issues
  }
}

function hasPendingCloudSync(): boolean {
  try {
    return localStorage.getItem(PENDING_CLOUD_SYNC_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>(getInitialPage);
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(getInitialSectionId);
  const [cms, setCms] = useState<CmsContent>(() => ({
    logoUrl: readLocalLogo(),
    items: [],
    siteText: {},
    siteImages: {},
    heroAppearance: readLocalHeroAppearance() || DEFAULT_HERO_APPEARANCE,
    teamMembers: TEAM_DATA,
    services: SERVICES_DATA,
    pricingTiers: PRICING_TIERS,
    faqs: FAQ_DATA,
    customSections: [],
    hiddenSections: [],
  }));
  const cmsRef = useRef(cms);
  cmsRef.current = cms;

  const fetchContent = useCallback(async (adminToken?: string) => {
    let serverContent: CmsContent | null = null;
    const isStaticSession = Boolean(adminToken && adminToken.startsWith('static_'));
    if (!isStaticSession) {
      try {
        const headers: Record<string, string> = {};
        if (adminToken) {
          headers['x-admin-token'] = adminToken;
        }
        const res = await fetch('/api/content', { headers });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = (await res.json()) as Partial<CmsContent>;
          serverContent = {
            logoUrl: data.logoUrl ?? null,
            items: Array.isArray(data.items) ? data.items : [],
            siteText: data.siteText ?? {},
            siteImages: data.siteImages ?? {},
            heroAppearance: data.heroAppearance || DEFAULT_HERO_APPEARANCE,
            teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : TEAM_DATA,
            services: Array.isArray(data.services) ? data.services : SERVICES_DATA,
            pricingTiers: Array.isArray(data.pricingTiers) ? data.pricingTiers : PRICING_TIERS,
            faqs: Array.isArray(data.faqs) ? data.faqs : FAQ_DATA,
            customSections: Array.isArray(data.customSections) ? data.customSections : [],
            hiddenSections: Array.isArray(data.hiddenSections) ? data.hiddenSections : [],
          };
        }
      } catch {
        // Server may be offline or hosted statically (e.g. Netlify)
      }
    }

    let cloudResult: Awaited<ReturnType<typeof loadCmsFromCloud>> = { hasCloudData: false };
    try {
      cloudResult = await loadCmsFromCloud();
    } catch {
      // Keep running with local/server state if offline
    }

    const localSnapshot = await loadLocalCmsSnapshot();
    const pendingCloud = hasPendingCloudSync();

    let resolved: CmsContent = serverContent ||
      localSnapshot?.content || {
        logoUrl: readLocalLogo(),
        items: [],
        siteText: {},
        siteImages: {},
        heroAppearance: readLocalHeroAppearance() || DEFAULT_HERO_APPEARANCE,
        teamMembers: TEAM_DATA,
        services: SERVICES_DATA,
        pricingTiers: PRICING_TIERS,
        faqs: FAQ_DATA,
        customSections: [],
        hiddenSections: [],
      };

    if (cloudResult.hasCloudData && !pendingCloud) {
      const visibleItems = (cloudResult.items || []).filter((it) => adminToken || it.visible);
      resolved = {
        logoUrl:
          cloudResult.logoUrl !== undefined
            ? cloudResult.logoUrl
            : resolved.logoUrl || readLocalLogo(),
        items: cloudResult.items !== undefined ? visibleItems : resolved.items,
        siteText: cloudResult.siteText !== undefined ? cloudResult.siteText : resolved.siteText,
        siteImages:
          cloudResult.siteImages !== undefined ? cloudResult.siteImages : resolved.siteImages,
        heroAppearance: cloudResult.heroAppearance || resolved.heroAppearance,
        teamMembers: cloudResult.teamMembers ?? resolved.teamMembers,
        services: cloudResult.services ?? resolved.services,
        pricingTiers: cloudResult.pricingTiers ?? resolved.pricingTiers,
        faqs: cloudResult.faqs ?? resolved.faqs,
        customSections:
          cloudResult.customSections !== undefined
            ? cloudResult.customSections
            : resolved.customSections,
        hiddenSections:
          cloudResult.hiddenSections !== undefined
            ? cloudResult.hiddenSections
            : resolved.hiddenSections,
      };
    } else if (
      serverContent &&
      !isCmsEdited(serverContent, DEFAULT_COUNTS) &&
      localSnapshot?.content &&
      isCmsEdited(localSnapshot.content, DEFAULT_COUNTS)
    ) {
      // Server container restarted to defaults while browser holds user's saved snapshot
      resolved = {
        ...localSnapshot.content,
        items: adminToken
          ? localSnapshot.content.items
          : localSnapshot.content.items.filter((i) => i.visible),
      };
    } else if (serverContent) {
      const localLogo = readLocalLogo();
      const localHero = readLocalHeroAppearance();
      resolved = {
        ...serverContent,
        logoUrl: serverContent.logoUrl || localLogo,
        heroAppearance:
          serverContent.heroAppearance.tone === 'light' &&
          serverContent.heroAppearance.overlayOpacity === 75 &&
          serverContent.heroAppearance.brightness === 100 &&
          localHero
            ? localHero
            : serverContent.heroAppearance,
      };
    }

    if (resolved.logoUrl) {
      try {
        localStorage.setItem(SAVED_LOGO_KEY, resolved.logoUrl);
      } catch {
        // Ignore storage quota errors
      }
    }
    try {
      localStorage.setItem(SAVED_HERO_APPEARANCE_KEY, JSON.stringify(resolved.heroAppearance));
    } catch {
      // Ignore storage quota errors
    }

    setCms(resolved);
    if (isCmsEdited(resolved, DEFAULT_COUNTS)) {
      void saveLocalCmsSnapshot(resolved);
    }
  }, []);

  useEffect(() => {
    void fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified && user.email === ADMIN_EMAIL && hasPendingCloudSync()) {
        try {
          await syncAllCmsToCloud(cmsRef.current);
          markPendingCloudSync(false);
        } catch {
          // Will retry on next admin action
        }
      }
    });

    const supaSub = supabase
      ? supabase.auth.onAuthStateChange(async (_event, session) => {
          if (isSupabaseAdminUser(session?.user) && hasPendingCloudSync()) {
            try {
              await syncAllCmsToCloud(cmsRef.current);
              markPendingCloudSync(false);
            } catch {
              // Will retry on next admin action
            }
          }
        })
      : null;

    return () => {
      unsubscribe();
      supaSub?.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'pricing-form' || hash === 'pricing#pricing-quote-form') {
        setActivePage('pricing');
        setPendingSectionId('pricing-quote-form');
        return;
      }
      if (VALID_PAGES.includes(hash as PageId)) {
        setActivePage(hash as PageId);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!pendingSectionId) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(pendingSectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setPendingSectionId(null);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activePage, pendingSectionId]);

  const handleNavigate = (page: PageId, sectionId?: string) => {
    setActivePage(page);
    setPendingSectionId(sectionId || null);
    const targetHash =
      page === 'admin'
        ? '#ADMIN'
        : sectionId === 'pricing-quote-form' && page === 'pricing'
        ? '#pricing-form'
        : `#${page}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        logoUrl={cms.logoUrl}
        siteText={cms.siteText}
      />

      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            items={cms.items}
            siteText={cms.siteText}
            siteImages={cms.siteImages}
            heroAppearance={cms.heroAppearance}
            customSections={cms.customSections}
            hiddenSections={cms.hiddenSections}
            onNavigate={handleNavigate}
          />
        )}
        {activePage === 'services' && (
          <ServicesPage
            items={cms.items}
            siteText={cms.siteText}
            siteImages={cms.siteImages}
            services={cms.services}
            customSections={cms.customSections}
            hiddenSections={cms.hiddenSections}
            onNavigate={handleNavigate}
          />
        )}
        {activePage === 'pricing' && (
          <PricingPage
            siteText={cms.siteText}
            siteImages={cms.siteImages}
            pricingTiers={cms.pricingTiers}
            services={cms.services}
            customSections={cms.customSections}
            hiddenSections={cms.hiddenSections}
            onNavigate={handleNavigate}
          />
        )}
        {activePage === 'about' && (
          <AboutPage
            siteText={cms.siteText}
            siteImages={cms.siteImages}
            customSections={cms.customSections}
            hiddenSections={cms.hiddenSections}
            onNavigate={handleNavigate}
          />
        )}
        {activePage === 'team' && (
          <TeamPage
            items={cms.items}
            siteText={cms.siteText}
            siteImages={cms.siteImages}
            teamMembers={cms.teamMembers}
            customSections={cms.customSections}
            hiddenSections={cms.hiddenSections}
            onNavigate={handleNavigate}
          />
        )}
        {activePage === 'faq' && (
          <FaqPage
            siteText={cms.siteText}
            siteImages={cms.siteImages}
            faqs={cms.faqs}
            customSections={cms.customSections}
            hiddenSections={cms.hiddenSections}
            onNavigate={handleNavigate}
          />
        )}
        {activePage === 'contact' && (
          <ContactPage
            siteText={cms.siteText}
            siteImages={cms.siteImages}
            customSections={cms.customSections}
            hiddenSections={cms.hiddenSections}
            onNavigate={handleNavigate}
          />
        )}
        {activePage === 'admin' && (
          <AdminDashboardPage
            cms={cms}
            logoUrl={cms.logoUrl}
            items={cms.items}
            siteText={cms.siteText}
            siteImages={cms.siteImages}
            heroAppearance={cms.heroAppearance}
            teamMembers={cms.teamMembers}
            services={cms.services}
            pricingTiers={cms.pricingTiers}
            faqs={cms.faqs}
            customSections={cms.customSections}
            hiddenSections={cms.hiddenSections}
            onRefreshContent={fetchContent}
          />
        )}
      </main>

      <Footer
        logoUrl={cms.logoUrl}
        siteText={cms.siteText}
        siteImages={cms.siteImages}
        onNavigate={handleNavigate}
      />
      <FloatingWhatsAppButton siteText={cms.siteText} onNavigate={handleNavigate} />
    </div>
  );
}
