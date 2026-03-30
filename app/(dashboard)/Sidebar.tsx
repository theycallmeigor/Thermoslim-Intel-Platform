'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Analytics', href: '/analytics' },
    ],
  },
  {
    title: 'Subscriptions',
    items: [
      { label: 'MRR Waterfall', href: '/subscriptions/mrr' },
      { label: 'Churn Analytics', href: '/subscriptions/churn' },
      { label: 'Cohort Retention', href: '/subscriptions/cohorts' },
      { label: 'Frequency Analysis', href: '/subscriptions/frequency' },
    ],
  },
  {
    title: 'Orders',
    items: [
      { label: 'All Orders', href: '/orders' },
      { label: 'Upcoming Rebills', href: '/orders/rebills' },
      { label: 'Refunds & Chargebacks', href: '/orders/refunds' },
      { label: 'Payment Health', href: '/orders/payments' },
    ],
  },
  {
    title: 'Performance',
    items: [
      { label: 'Campaigns', href: '/performance/campaigns' },
      { label: 'Products', href: '/performance/products' },
      { label: 'Upsell & AOV', href: '/performance/upsells' },
      { label: 'Attribution', href: '/performance/attribution' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Customer Lookup', href: '/operations/customers' },
      { label: 'Order QA', href: '/operations/qa' },
      { label: 'Ingestion Health', href: '/operations/health' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[#0f1117] border-r border-gray-800 flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-800">
        <div className="text-[15px] font-bold text-white tracking-tight">ThermoSlim</div>
        <div className="text-[10px] text-gray-500 mt-0.5">Commerce Intelligence</div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-3 px-3 space-y-5">
        {NAV.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1.5">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                        active
                          ? 'bg-gray-800/80 text-blue-400 font-medium'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-800 px-5 py-3">
        <Link href="/settings" className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
          Settings
        </Link>
      </div>
    </aside>
  );
}
