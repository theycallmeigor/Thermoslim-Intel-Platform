export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { fmt$ } from '@/lib/dashboard/formatting';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchForm } from './SearchForm';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? '';

  const customers =
    q.length >= 2
      ? await prisma.customer.findMany({
          where: {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { fullName: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
            ],
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            totalOrders: true,
            totalRevenue: true,
            createdAt: true,
          },
          take: 25,
          orderBy: { totalRevenue: 'desc' },
        })
      : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Lookup" subtitle="Search customers by email, name, or phone" />

      <Suspense>
        <SearchForm />
      </Suspense>

      {q.length < 2 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-16 text-center">
          <p className="text-gray-500 text-sm">
            Search for a customer by email, name, or phone number
          </p>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-16 text-center">
          <p className="text-gray-500 text-sm">No customers found for &ldquo;{q}&rdquo;</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Results</h2>
            <span className="text-xs text-gray-500">{customers.length} customer{customers.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Customer</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Email</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Phone</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Orders</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/operations/customers/${customer.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        {customer.fullName ?? '—'}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-gray-300 font-mono text-xs">{customer.email}</td>
                    <td className="px-6 py-3.5 text-gray-400 text-xs">{customer.phone ?? '—'}</td>
                    <td className="px-6 py-3.5 text-right text-gray-300 tabular-nums">{customer.totalOrders}</td>
                    <td className="px-6 py-3.5 text-right text-gray-200 tabular-nums font-medium">
                      {fmt$(customer.totalRevenue)}
                    </td>
                    <td className="px-6 py-3.5 text-gray-400 text-xs">
                      {new Date(customer.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
