// Field mapping for Clarity adapter
// Maps Clarity Data Export API fields to PageAnalytics schema

export const sessionBehaviorFields = {
  HasRageClicks: 'rageClicks',
  HasDeadClicks: 'deadClicks',
  HasExcessiveScrolling: 'excessiveScrollSessions',
  HasQuickBack: 'quickBacks',
  HasScriptError: 'jsErrorCount',
} as const;

export const pageMetricFields = {
  TimeOnPage: 'avgTimeOnPage',
  ScrollDepth: 'avgScrollDepth',
  RageClickCount: 'rageClicks',
  DeadClickCount: 'deadClicks',
} as const;

// Custom tag keys we care about for session attribution
export const customTagKeys = [
  'campaignId',
  'funnelId',
  'productLine',
  'channel',
] as const;
