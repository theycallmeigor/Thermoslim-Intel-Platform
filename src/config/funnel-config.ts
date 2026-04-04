/**
 * Manual funnel configuration.
 * Maps funnel reference IDs to their page structure with expected products.
 *
 * Each OTO page lists the ccCrmIds that can appear on that page.
 * UPSALE items are matched to pages by ccCrmId, not by productSlot.
 *
 * To add/update a funnel: edit this file and redeploy.
 */

export type FunnelPageConfig = {
  name: string;
  type: 'checkout' | 'oto' | 'downsell' | 'thankyou';
  /** CC CRM product IDs that appear on this page */
  productCrmIds: string[];
  /** Human-readable product description */
  productLabel: string;
};

export type FunnelConfig = {
  name: string;
  /** CC funnel reference ID */
  referenceId: string;
  /** Checkout page slugs that belong to this funnel */
  checkoutSlugs: string[];
  pages: FunnelPageConfig[];
};

export const FUNNEL_CONFIGS: FunnelConfig[] = [
  {
    name: 'BSD Quiz Funnel',
    referenceId: '5D0E497B070541498BE92C9CA2C49F6E',
    checkoutSlugs: ['checkout-bsd-quiz'],
    pages: [
      {
        name: 'Checkout',
        type: 'checkout',
        productCrmIds: ['273', '191', '261'], // Body Sculpting Device variants
        productLabel: 'Body Sculpting Device',
      },
      {
        name: 'OTO1 — Sculpt+ Gel',
        type: 'oto',
        productCrmIds: ['239', '28', '293', '297', '255'], // All Gel variants
        productLabel: 'Sculpt+ Conductive Gel (1mo/3mo/6mo)',
      },
      {
        name: 'DS1 — Gel One-Time',
        type: 'downsell',
        productCrmIds: ['219'], // Gel downsell (discounted single tube)
        productLabel: 'Sculpt+ Conductive Gel (1-tube)',
      },
      {
        name: 'OTO2 — Maintenance Cream',
        type: 'oto',
        productCrmIds: ['241', '309', '311', '307', '313'], // All Cream variants
        productLabel: 'Maintenance Cream (1mo/3mo/6mo)',
      },
      {
        name: 'DS2 — Cream Downsell',
        type: 'downsell',
        productCrmIds: ['243'], // Cream downsell
        productLabel: 'Maintenance Cream (discounted)',
      },
      {
        name: 'OTO3 — Smooth Skin+',
        type: 'oto',
        productCrmIds: ['267', '269', '301', '303', '305'], // All Smooth Skin variants
        productLabel: 'Smooth Skin+ (1mo/3mo/6mo)',
      },
    ],
  },
  {
    name: 'BSD Top5 Funnel',
    referenceId: 'F684F3F4CAF9401D8415700C21F593C1',
    checkoutSlugs: ['checkout-bsd-top5'],
    pages: [
      {
        name: 'Checkout',
        type: 'checkout',
        productCrmIds: ['273', '191', '261'],
        productLabel: 'Body Sculpting Device',
      },
      {
        name: 'OTO1 — Sculpt+ Gel',
        type: 'oto',
        productCrmIds: ['239', '28', '293', '297', '255'],
        productLabel: 'Sculpt+ Conductive Gel (1mo/3mo/6mo)',
      },
      {
        name: 'DS1 — Gel One-Time',
        type: 'downsell',
        productCrmIds: ['219'],
        productLabel: 'Sculpt+ Conductive Gel (1-tube)',
      },
      {
        name: 'OTO2 — Maintenance Cream',
        type: 'oto',
        productCrmIds: ['241', '309', '311', '307', '313'],
        productLabel: 'Maintenance Cream (1mo/3mo/6mo)',
      },
      {
        name: 'DS2 — Cream Downsell',
        type: 'downsell',
        productCrmIds: ['243'],
        productLabel: 'Maintenance Cream (discounted)',
      },
      {
        name: 'OTO3 — Smooth Skin+',
        type: 'oto',
        productCrmIds: ['267', '269', '301', '303', '305'],
        productLabel: 'Smooth Skin+ (1mo/3mo/6mo)',
      },
    ],
  },
  {
    name: 'Main Funnel',
    referenceId: '8B0924CCB5C644E580792695AC560643',
    checkoutSlugs: ['secure-checkout', 'checkout', 'checkout2', 'checkout2-new', 'checkout2-old'],
    pages: [
      {
        name: 'Checkout',
        type: 'checkout',
        productCrmIds: ['273', '191', '261'],
        productLabel: 'Body Sculpting Device',
      },
      {
        name: 'OTO1 — Sculpt+ Gel',
        type: 'oto',
        productCrmIds: ['239', '28', '293', '297', '255'],
        productLabel: 'Sculpt+ Conductive Gel',
      },
      {
        name: 'DS1 — Gel One-Time',
        type: 'downsell',
        productCrmIds: ['219'],
        productLabel: 'Sculpt+ Conductive Gel (1-tube)',
      },
      {
        name: 'OTO2 — Maintenance Cream',
        type: 'oto',
        productCrmIds: ['241', '309', '311', '307', '313'],
        productLabel: 'Maintenance Cream',
      },
      {
        name: 'DS2 — Cream Downsell',
        type: 'downsell',
        productCrmIds: ['243'],
        productLabel: 'Maintenance Cream (discounted)',
      },
      {
        name: 'OTO3 — Smooth Skin+',
        type: 'oto',
        productCrmIds: ['267', '269', '301', '303', '305'],
        productLabel: 'Smooth Skin+',
      },
    ],
  },
];

/** Find funnel config by reference ID or checkout slug */
export function findFunnelConfig(refId: string | null, checkoutSlug: string): FunnelConfig | null {
  // Try by reference ID first
  if (refId) {
    const byRef = FUNNEL_CONFIGS.find(f => f.referenceId === refId);
    if (byRef) return byRef;
  }
  // Try by checkout slug
  return FUNNEL_CONFIGS.find(f => f.checkoutSlugs.includes(checkoutSlug)) ?? null;
}
