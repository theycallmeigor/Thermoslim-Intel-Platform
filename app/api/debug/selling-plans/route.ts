import { NextResponse } from 'next/server';
import { shopifyGraphQL } from '@/adapters/shopify';

const QUERY = `
  query SampleSellingPlanOrders($first: Int!) {
    orders(first: $first, sortKey: CREATED_AT, reverse: true, query: "selling_plan_id:*") {
      edges {
        node {
          id
          name
          createdAt
          customer { email }
          lineItems(first: 3) {
            edges {
              node {
                title
                quantity
                originalUnitPriceSet { shopMoney { amount currencyCode } }
                sellingPlan { name sellingPlanId }
                product { id }
                variant { id }
              }
            }
          }
        }
      }
    }
  }
`;

export async function GET(req: Request) {
  // Temporary debug endpoint — remove after validation
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url, headers } = shopifyGraphQL();
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: QUERY, variables: { first: 5 } }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 500 });
    }

    const json = await res.json();
    return NextResponse.json(json, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
