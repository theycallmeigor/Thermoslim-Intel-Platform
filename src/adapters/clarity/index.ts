// Clarity adapter — implements IAdapter
// See docs/adapters/clarity-adapter.md for spec

import { config } from '../../core/config';
import type { IAdapter, SyncOptions, SyncResult, SyncError } from '../../core/types/adapter';
import type { NormalizedRecord } from '../../core/types/adapter';

// ─── Clarity API response types ─────────────────────────────────────────────

interface ClaritySession {
  SessionId: string;
  UserId?: string;
  StartTime: string;
  Duration: number;
  PagesViewed: number;
  Device: string;
  OS: string;
  Browser: string;
  Country: string;
  Region?: string;
  City?: string;
  Referrer?: string;
  EntryPage?: string;
  ExitPage?: string;
  HasRageClicks: boolean;
  HasDeadClicks: boolean;
  HasExcessiveScrolling: boolean;
  HasQuickBack: boolean;
  HasScriptError: boolean;
  ScrollDepthAvg?: number;
}

interface ClarityPage {
  SessionId: string;
  PageUrl: string;
  PageTitle?: string;
  TimeOnPage: number;
  ScrollDepth: number;
  ClickCount: number;
  RageClickCount: number;
  DeadClickCount: number;
  ResizeCount?: number;
}

interface ClarityJSError {
  SessionId: string;
  PageUrl: string;
  ErrorMessage: string;
  StackTrace?: string;
  Timestamp: string;
  LineNumber?: number;
  ColumnNumber?: number;
  FileName?: string;
}

interface ClarityCustomTag {
  SessionId: string;
  TagKey: string;
  TagValue: string;
  Timestamp: string;
}

// Aggregated page metrics before writing to DB
interface PageMetrics {
  sessions: number;
  pageViews: number;
  uniqueVisitors: Set<string>;
  totalTimeOnPage: number;
  totalScrollDepth: number;
  scrollDepthCount: number;
  rageClicks: number;
  deadClicks: number;
  excessiveScrollSessions: number;
  quickBacks: number;
  jsErrorCount: number;
  referrers: Map<string, number>;
  devices: Map<string, number>;
}

// ─── Adapter ────────────────────────────────────────────────────────────────

export class ClarityAdapter implements IAdapter {
  name = 'clarity';
  private baseUrl: string;
  private token: string;
  private projectId: string;

  constructor() {
    this.projectId = config.clarity.projectId;
    this.token = config.clarity.token;
    this.baseUrl = `https://www.clarity.ms/export-data/api/v1/${this.projectId}/export`;
  }

  async connect(): Promise<void> {
    // Verify token works by fetching a small window of sessions
    const res = await this.apiFetch('Sessions', { numOfDays: '1', top: '1' });
    if (!res.ok) {
      throw new Error(`Clarity connection failed: HTTP ${res.status} — check CLARITY_TOKEN`);
    }
  }

  async sync(options?: SyncOptions): Promise<SyncResult> {
    const start = Date.now();
    const errors: SyncError[] = [];

    const endDate = options?.endDate ?? new Date();
    const startDate = options?.startDate ?? new Date(Date.now() - 2 * 3600000); // default: last 2 hours

    // Calculate days to fetch (minimum 1)
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));

    console.log(`  Clarity sync: fetching ${daysDiff} day(s) of data...`);

    // ── Fetch all endpoints in parallel ──────────────────────────────────
    const [sessions, pages, jsErrors, customTags] = await Promise.all([
      this.fetchEndpoint<ClaritySession>('Sessions', daysDiff),
      this.fetchEndpoint<ClarityPage>('Pages', daysDiff),
      this.fetchEndpoint<ClarityJSError>('JavaScriptErrors', daysDiff),
      this.fetchEndpoint<ClarityCustomTag>('CustomTags', daysDiff),
    ]);

    console.log(`  Fetched: ${sessions.length} sessions, ${pages.length} pages, ${jsErrors.length} JS errors, ${customTags.length} custom tags`);

    // ── Build session → campaign tag map ─────────────────────────────────
    const sessionCampaignMap = new Map<string, string>();
    const sessionFunnelMap = new Map<string, string>();
    for (const tag of customTags) {
      if (tag.TagKey === 'campaignId') sessionCampaignMap.set(tag.SessionId, tag.TagValue);
      if (tag.TagKey === 'funnelId') sessionFunnelMap.set(tag.SessionId, tag.TagValue);
    }

    // ── Build session behavioral map ─────────────────────────────────────
    const sessionBehavior = new Map<string, ClaritySession>();
    for (const s of sessions) {
      sessionBehavior.set(s.SessionId, s);
    }

    // ── Aggregate page metrics by (pageUrl, date) ────────────────────────
    const pageMetricsMap = new Map<string, PageMetrics>();

    function getKey(pageUrl: string, date: string): string {
      return `${pageUrl}||${date}`;
    }

    function getOrCreate(pageUrl: string, date: string): PageMetrics {
      const key = getKey(pageUrl, date);
      let m = pageMetricsMap.get(key);
      if (!m) {
        m = {
          sessions: 0, pageViews: 0, uniqueVisitors: new Set(),
          totalTimeOnPage: 0, totalScrollDepth: 0, scrollDepthCount: 0,
          rageClicks: 0, deadClicks: 0, excessiveScrollSessions: 0,
          quickBacks: 0, jsErrorCount: 0,
          referrers: new Map(), devices: new Map(),
        };
        pageMetricsMap.set(key, m);
      }
      return m;
    }

    // Aggregate from pages endpoint (primary page view data)
    const sessionSeenPerPage = new Map<string, Set<string>>();
    for (const p of pages) {
      // Determine date from session start time
      const session = sessionBehavior.get(p.SessionId);
      const date = session
        ? new Date(session.StartTime).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const m = getOrCreate(p.PageUrl, date);
      m.pageViews++;
      m.rageClicks += p.RageClickCount;
      m.deadClicks += p.DeadClickCount;
      m.totalTimeOnPage += p.TimeOnPage;
      m.totalScrollDepth += p.ScrollDepth;
      m.scrollDepthCount++;

      // Track unique sessions per page
      const pageKey = getKey(p.PageUrl, date);
      if (!sessionSeenPerPage.has(pageKey)) sessionSeenPerPage.set(pageKey, new Set());
      const seen = sessionSeenPerPage.get(pageKey)!;
      if (!seen.has(p.SessionId)) {
        seen.add(p.SessionId);
        m.sessions++;
      }

      // Track unique visitors (by UserId or SessionId fallback)
      const userId = session?.UserId ?? p.SessionId;
      m.uniqueVisitors.add(userId);

      // Behavioral signals from session
      if (session) {
        if (session.HasExcessiveScrolling) m.excessiveScrollSessions++;
        if (session.HasQuickBack) m.quickBacks++;

        // Referrer tracking
        if (session.Referrer) {
          m.referrers.set(session.Referrer, (m.referrers.get(session.Referrer) ?? 0) + 1);
        }
        // Device tracking
        if (session.Device) {
          m.devices.set(session.Device, (m.devices.get(session.Device) ?? 0) + 1);
        }
      }
    }

    // Aggregate JS errors
    for (const err of jsErrors) {
      const session = sessionBehavior.get(err.SessionId);
      const date = session
        ? new Date(session.StartTime).toISOString().split('T')[0]
        : new Date(err.Timestamp).toISOString().split('T')[0];

      const m = getOrCreate(err.PageUrl, date);
      m.jsErrorCount++;
    }

    // ── Write to PageAnalytics via Prisma ────────────────────────────────
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient();

    let recordsCreated = 0;
    let recordsUpdated = 0;

    try {
      // First, load funnel page mappings to enrich with funnelId
      const funnelPages = await db.funnelPage.findMany({
        include: { funnel: true },
      });

      // Build URL → funnelId lookup
      const urlToFunnelId = new Map<string, string>();
      for (const fp of funnelPages) {
        if (fp.externalUrl) {
          // Normalize: strip protocol, trailing slash, query params
          const normalized = normalizeUrl(fp.externalUrl);
          urlToFunnelId.set(normalized, fp.funnel.ccReferenceId);
        }
        if (fp.slug) {
          urlToFunnelId.set(fp.slug.toLowerCase(), fp.funnel.ccReferenceId);
        }
      }

      for (const [key, m] of pageMetricsMap.entries()) {
        const [pageUrl, dateStr] = key.split('||');
        const date = new Date(dateStr + 'T00:00:00Z');

        // Top 5 referrers
        const topReferrers = [...m.referrers.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([ref, count]) => ({ referrer: ref, count }));

        // Device breakdown
        const deviceBreakdown: Record<string, number> = {};
        for (const [device, count] of m.devices) {
          deviceBreakdown[device] = count;
        }

        // Match funnelId from URL
        const normalizedPageUrl = normalizeUrl(pageUrl);
        const funnelId = urlToFunnelId.get(normalizedPageUrl) ?? null;

        try {
          await db.pageAnalytics.upsert({
            where: { pageUrl_date: { pageUrl, date } },
            create: {
              pageUrl,
              date,
              sessions: m.sessions,
              pageViews: m.pageViews,
              uniqueVisitors: m.uniqueVisitors.size,
              avgTimeOnPage: m.scrollDepthCount > 0 ? m.totalTimeOnPage / m.scrollDepthCount : null,
              avgScrollDepth: m.scrollDepthCount > 0 ? m.totalScrollDepth / m.scrollDepthCount : null,
              rageClicks: m.rageClicks,
              deadClicks: m.deadClicks,
              excessiveScrollSessions: m.excessiveScrollSessions,
              quickBacks: m.quickBacks,
              jsErrorCount: m.jsErrorCount,
              topReferrers: topReferrers.length > 0 ? topReferrers : undefined,
              deviceBreakdown: Object.keys(deviceBreakdown).length > 0 ? deviceBreakdown : undefined,
              funnelId,
            },
            update: {
              sessions: m.sessions,
              pageViews: m.pageViews,
              uniqueVisitors: m.uniqueVisitors.size,
              avgTimeOnPage: m.scrollDepthCount > 0 ? m.totalTimeOnPage / m.scrollDepthCount : null,
              avgScrollDepth: m.scrollDepthCount > 0 ? m.totalScrollDepth / m.scrollDepthCount : null,
              rageClicks: m.rageClicks,
              deadClicks: m.deadClicks,
              excessiveScrollSessions: m.excessiveScrollSessions,
              quickBacks: m.quickBacks,
              jsErrorCount: m.jsErrorCount,
              topReferrers: topReferrers.length > 0 ? topReferrers : undefined,
              deviceBreakdown: Object.keys(deviceBreakdown).length > 0 ? deviceBreakdown : undefined,
              funnelId,
            },
          });
          recordsCreated++;
        } catch (err) {
          errors.push({
            recordId: key,
            message: err instanceof Error ? err.message : 'Unknown error writing PageAnalytics',
          });
        }
      }
    } finally {
      await db.$disconnect();
    }

    console.log(`  Wrote ${recordsCreated} PageAnalytics records (${errors.length} errors)`);

    return {
      source: this.name,
      recordsProcessed: pages.length,
      recordsCreated,
      recordsUpdated,
      errors,
      duration: Date.now() - start,
    };
  }

  mapToSchema(_raw: unknown): NormalizedRecord[] {
    // Clarity doesn't go through the standard ingestion pipeline —
    // it writes directly to PageAnalytics in sync()
    return [];
  }

  async disconnect(): Promise<void> {
    // Stateless HTTP
  }

  // ─── Private: API helpers ───────────────────────────────────────────────────

  private async apiFetch(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<Response> {
    const qs = new URLSearchParams(params);
    const url = `${this.baseUrl}/${endpoint}?${qs}`;
    return fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
    });
  }

  private async fetchEndpoint<T>(endpoint: string, days: number): Promise<T[]> {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await this.apiFetch(endpoint, {
          numOfDays: String(days),
        });

        if (res.status === 401) {
          throw new Error('Clarity token expired or invalid (HTTP 401)');
        }

        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('Retry-After') ?? '30', 10);
          console.log(`  Clarity rate limited on ${endpoint}, waiting ${retryAfter}s...`);
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          continue;
        }

        if (!res.ok) {
          throw new Error(`Clarity API HTTP ${res.status} on ${endpoint}`);
        }

        const data = await res.json();
        // API may return array directly or wrapped in a data property
        return Array.isArray(data) ? data : (data.data ?? data.value ?? []);
      } catch (err) {
        if (attempt === maxRetries) throw err;
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`  Clarity ${endpoint} attempt ${attempt} failed, retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://placeholder.com${url}`);
    return (parsed.hostname === 'placeholder.com' ? '' : parsed.hostname) + parsed.pathname.replace(/\/$/, '').toLowerCase();
  } catch {
    return url.replace(/\?.*$/, '').replace(/\/$/, '').toLowerCase();
  }
}
