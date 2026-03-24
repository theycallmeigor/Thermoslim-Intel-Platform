import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  const anomaly = await prisma.anomaly.findUnique({ where: { id } });
  if (!anomaly) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.anomaly.update({
    where: { id },
    data: { acknowledged: true },
  });

  return NextResponse.json({ ok: true });
}
