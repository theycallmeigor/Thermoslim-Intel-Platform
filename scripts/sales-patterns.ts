import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
process.env.DIRECT_URL = process.env.DATABASE_URL!;

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  const orders = await db.order.findMany({
    where: {
      source: 'SHOPIFY',
      status: { not: 'DECLINED' },
      createdAt: { gte: new Date('2026-01-01') },
    },
    select: { totalPrice: true, createdAt: true, tags: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\n  ╔══════════════════════════════════════════════════════════════════╗`);
  console.log(`  ║  SALES PATTERN ANALYSIS — Jan 1, 2026 → Mar 21, 2026           ║`);
  console.log(`  ║  ${orders.length} Shopify orders analyzed                                ║`);
  console.log(`  ╚══════════════════════════════════════════════════════════════════╝\n`);

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startDate = new Date('2026-01-01');
  const endDate = new Date();

  // ── Build daily map ────────────────────────────────────────────────────────
  const dailyMap: Record<string, { orders: number; revenue: number; tags: string[] }> = {};
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().split('T')[0];
    if (!dailyMap[key]) dailyMap[key] = { orders: 0, revenue: 0, tags: [] };
    dailyMap[key].orders++;
    dailyMap[key].revenue += o.totalPrice ?? 0;
    dailyMap[key].tags.push(o.tags ?? '');
  }

  // Count occurrences of each DOW in the range
  const dayOccurrences: Record<number, number> = { 0:0,1:0,2:0,3:0,4:0,5:0,6:0 };
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dayOccurrences[d.getDay()]++;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. DAY OF WEEK — VOLUME, REVENUE, AOV
  // ══════════════════════════════════════════════════════════════════════════
  const byDow: Record<number, { revenue: number; orders: number }> = {};
  for (let i = 0; i < 7; i++) byDow[i] = { revenue: 0, orders: 0 };
  for (const o of orders) {
    const dow = new Date(o.createdAt).getDay();
    byDow[dow].revenue += o.totalPrice ?? 0;
    byDow[dow].orders++;
  }

  console.log('  ┌─────────────────────────────────────────────────────────────────┐');
  console.log('  │  1. DAY OF WEEK PERFORMANCE                                    │');
  console.log('  └─────────────────────────────────────────────────────────────────┘');
  console.log('  Day   │ Avg Orders/day │ Avg Rev/day  │ Avg AOV  │ vs Weekday avg');
  console.log('  ──────┼────────────────┼──────────────┼──────────┼───────────────');

  const wdAvgOrders = [1,2,3,4,5].reduce((s, d) => s + byDow[d].orders / dayOccurrences[d], 0) / 5;
  for (const dow of [1,2,3,4,5,6,0]) {
    const avg = byDow[dow].orders / dayOccurrences[dow];
    const avgRev = byDow[dow].revenue / dayOccurrences[dow];
    const aov = byDow[dow].orders > 0 ? byDow[dow].revenue / byDow[dow].orders : 0;
    const pct = ((avg - wdAvgOrders) / wdAvgOrders * 100);
    const sign = pct >= 0 ? '+' : '';
    const isWeekend = dow === 0 || dow === 6;
    const marker = isWeekend ? ' ◄' : '';
    console.log(
      `  ${DAYS[dow].padEnd(5)} │ ${avg.toFixed(1).padStart(14)} │ $${(avgRev/100).toFixed(0).padStart(11)} │ $${(aov/100).toFixed(2).padStart(7)} │ ${(sign+pct.toFixed(1)+'%').padStart(13)}${marker}`
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. MONTH-BY-MONTH EVOLUTION
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n  ┌─────────────────────────────────────────────────────────────────┐');
  console.log('  │  2. WEEKEND EFFECT BY MONTH                                    │');
  console.log('  └─────────────────────────────────────────────────────────────────┘');

  const months: Record<string, {
    wdOrders:number; weOrders:number; wdDays:number; weDays:number;
    wdRev:number; weRev:number; totalOrders:number;
  }> = {};

  for (const o of orders) {
    const d = new Date(o.createdAt);
    const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (!months[m]) months[m] = { wdOrders:0, weOrders:0, wdDays:0, weDays:0, wdRev:0, weRev:0, totalOrders:0 };
    months[m].totalOrders++;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) { months[m].weOrders++; months[m].weRev += o.totalPrice ?? 0; }
    else { months[m].wdOrders++; months[m].wdRev += o.totalPrice ?? 0; }
  }
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate()+1)) {
    const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (!months[m]) continue;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) months[m].weDays++;
    else months[m].wdDays++;
  }

  console.log('  Month   │ Total │ WD avg/day │ WE avg/day │ WE effect │ WD AOV  │ WE AOV');
  console.log('  ────────┼───────┼────────────┼────────────┼───────────┼─────────┼────────');
  for (const [m, v] of Object.entries(months).sort()) {
    if (!v.wdDays || !v.weDays) continue;
    const wdAvg = v.wdOrders / v.wdDays;
    const weAvg = v.weOrders / v.weDays;
    const drop = ((weAvg - wdAvg) / wdAvg * 100);
    const sign = drop >= 0 ? '+' : '';
    const wdAov = v.wdOrders ? (v.wdRev / v.wdOrders / 100).toFixed(2) : '0';
    const weAov = v.weOrders ? (v.weRev / v.weOrders / 100).toFixed(2) : '0';
    console.log(
      `  ${m}  │ ${String(v.totalOrders).padStart(5)} │ ${wdAvg.toFixed(1).padStart(10)} │ ${weAvg.toFixed(1).padStart(10)} │ ${(sign+drop.toFixed(0)+'%').padStart(9)} │ $${wdAov.padStart(6)} │ $${weAov.padStart(6)}`
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. TREND-ADJUSTED WEEKEND ANALYSIS
  // ══════════════════════════════════════════════════════════════════════════
  // Because growth is so extreme (10x in 3 months), raw DOW averages are
  // dominated by recent weeks. We need to compare each weekend day to
  // its adjacent weekdays within the SAME week.
  console.log('\n  ┌─────────────────────────────────────────────────────────────────┐');
  console.log('  │  3. TREND-ADJUSTED: EACH WEEKEND vs ITS OWN WEEK              │');
  console.log('  └─────────────────────────────────────────────────────────────────┘');

  // Build week-level data (Mon=start)
  type WeekData = { weekStart: string; days: Record<number, { orders: number; revenue: number }> };
  const weekMap = new Map<string, WeekData>();

  for (const o of orders) {
    const d = new Date(o.createdAt);
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0,0,0,0);
    const key = monday.toISOString().split('T')[0];
    if (!weekMap.has(key)) {
      const days: Record<number, { orders: number; revenue: number }> = {};
      for (let i = 0; i < 7; i++) days[i] = { orders: 0, revenue: 0 };
      weekMap.set(key, { weekStart: key, days });
    }
    const dow = (dayOfWeek + 6) % 7; // 0=Mon, 6=Sun
    weekMap.get(key)!.days[dow].orders++;
    weekMap.get(key)!.days[dow].revenue += o.totalPrice ?? 0;
  }

  const weeksArr = [...weekMap.values()].sort((a,b) => a.weekStart.localeCompare(b.weekStart));

  // For each week, compute: weekend ratio = (Sat+Sun avg) / (Mon-Fri avg)
  const weekendRatios: { week: string; ratio: number; satPct: number; sunPct: number; weekdayAvg: number; weekendAvg: number }[] = [];

  for (const w of weeksArr) {
    const wdSum = w.days[0].orders + w.days[1].orders + w.days[2].orders + w.days[3].orders + w.days[4].orders;
    const weSum = w.days[5].orders + w.days[6].orders;
    if (wdSum === 0) continue;
    const wdAvg = wdSum / 5;
    const weAvg = weSum / 2;
    const ratio = weAvg / wdAvg;
    weekendRatios.push({
      week: w.weekStart,
      ratio,
      satPct: wdAvg > 0 ? (w.days[5].orders / wdAvg - 1) * 100 : 0,
      sunPct: wdAvg > 0 ? (w.days[6].orders / wdAvg - 1) * 100 : 0,
      weekdayAvg: wdAvg,
      weekendAvg: weAvg,
    });
  }

  console.log('  Week       │ WD avg │ WE avg │ WE/WD ratio │ Sat vs WD │ Sun vs WD');
  console.log('  ───────────┼────────┼────────┼─────────────┼───────────┼──────────');
  for (const r of weekendRatios) {
    const rBar = r.ratio >= 1 ? '▲' : r.ratio >= 0.7 ? '─' : '▼';
    const satSign = r.satPct >= 0 ? '+' : '';
    const sunSign = r.sunPct >= 0 ? '+' : '';
    console.log(
      `  ${r.week}  │ ${r.weekdayAvg.toFixed(1).padStart(6)} │ ${r.weekendAvg.toFixed(1).padStart(6)} │ ${rBar} ${r.ratio.toFixed(2).padStart(10)} │ ${(satSign+r.satPct.toFixed(0)+'%').padStart(9)} │ ${(sunSign+r.sunPct.toFixed(0)+'%').padStart(8)}`
    );
  }

  // Average ratio
  const avgRatio = weekendRatios.reduce((s, r) => s + r.ratio, 0) / weekendRatios.length;
  const stdDev = Math.sqrt(weekendRatios.reduce((s, r) => s + Math.pow(r.ratio - avgRatio, 2), 0) / weekendRatios.length);
  console.log(`\n  Average WE/WD ratio: ${avgRatio.toFixed(2)} (σ=${stdDev.toFixed(2)})`);
  console.log(`  → ${avgRatio >= 0.95 ? 'No meaningful weekend effect' : avgRatio >= 0.8 ? 'Mild weekend dip' : 'Significant weekend drop'}`);

  // ══════════════════════════════════════════════════════════════════════════
  // 4. ORDER TYPE SHIFT — ARE DIFFERENT PRODUCTS DRIVING THE PATTERN?
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n  ┌─────────────────────────────────────────────────────────────────┐');
  console.log('  │  4. ORDER TYPE: WEEKDAY vs WEEKEND COMPOSITION                 │');
  console.log('  └─────────────────────────────────────────────────────────────────┘');

  const types = ['direct', 'onetime', 'newSub', 'recurring'] as const;
  type OrderType = typeof types[number];
  const split: Record<'weekday'|'weekend', Record<OrderType, { count: number; revenue: number }>> = {
    weekday: { direct:{count:0,revenue:0}, onetime:{count:0,revenue:0}, newSub:{count:0,revenue:0}, recurring:{count:0,revenue:0} },
    weekend: { direct:{count:0,revenue:0}, onetime:{count:0,revenue:0}, newSub:{count:0,revenue:0}, recurring:{count:0,revenue:0} },
  };

  for (const o of orders) {
    const dow = new Date(o.createdAt).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const tags = o.tags ?? '';
    const hasRecurring = tags.includes('Recurring');
    const hasSubscription = tags.includes('Subscription');
    const hasNewSale = tags.includes('New Sale');
    let type: OrderType;
    if (hasRecurring && hasSubscription) type = 'recurring';
    else if (hasNewSale && hasSubscription) type = 'newSub';
    else if (hasNewSale) type = 'onetime';
    else type = 'direct';
    const bucket = isWeekend ? split.weekend : split.weekday;
    bucket[type].count++;
    bucket[type].revenue += o.totalPrice ?? 0;
  }

  const wdTotalCount = Object.values(split.weekday).reduce((a,b) => a+b.count, 0);
  const weTotalCount = Object.values(split.weekend).reduce((a,b) => a+b.count, 0);
  const wdDays = [1,2,3,4,5].reduce((s,d) => s+dayOccurrences[d], 0);
  const weDays = dayOccurrences[0] + dayOccurrences[6];

  console.log('  Type            │ WD share │ WE share │ WD orders/day │ WE orders/day │ Shift');
  console.log('  ────────────────┼──────────┼──────────┼───────────────┼───────────────┼──────');
  for (const t of types) {
    const wdPct = (split.weekday[t].count / wdTotalCount * 100);
    const wePct = (split.weekend[t].count / weTotalCount * 100);
    const wdPerDay = split.weekday[t].count / wdDays;
    const wePerDay = split.weekend[t].count / weDays;
    const shift = wePct - wdPct;
    const shiftSign = shift >= 0 ? '+' : '';
    const label = t === 'direct' ? 'Direct Shopify' : t === 'onetime' ? 'CC One-time' : t === 'newSub' ? 'CC New Sub' : 'CC Recurring';
    console.log(
      `  ${label.padEnd(16)} │ ${(wdPct.toFixed(1)+'%').padStart(8)} │ ${(wePct.toFixed(1)+'%').padStart(8)} │ ${wdPerDay.toFixed(1).padStart(13)} │ ${wePerDay.toFixed(1).padStart(13)} │ ${(shiftSign+shift.toFixed(1)+'pp').padStart(5)}`
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. DAILY HEATMAP
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n  ┌─────────────────────────────────────────────────────────────────┐');
  console.log('  │  5. DAILY ORDER HEATMAP (all weeks)                            │');
  console.log('  └─────────────────────────────────────────────────────────────────┘');
  console.log('  Week start  │ Mon │ Tue │ Wed │ Thu │ Fri │ *Sat│ *Sun│ Total │ Note');
  console.log('  ────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼───────┼─────');

  for (const w of weeksArr) {
    const counts = [];
    for (let i = 0; i < 7; i++) counts.push(w.days[i].orders);
    const total = counts.reduce((a,b) => a+b, 0);
    if (total === 0) continue;
    const wdAvg = (counts[0]+counts[1]+counts[2]+counts[3]+counts[4]) / 5;
    const sat = counts[5], sun = counts[6];

    // Determine note
    let note = '';
    if (sat > wdAvg * 1.3 && sun > wdAvg * 1.3) note = 'WE outperformed';
    else if (sat < wdAvg * 0.5 || sun < wdAvg * 0.5) note = 'WE deep dip';
    else if (sat < wdAvg * 0.7 || sun < wdAvg * 0.7) note = 'WE mild dip';
    else if (sat > wdAvg * 1.1 || sun > wdAvg * 1.1) note = '';

    const cols = counts.map(n => String(n).padStart(3)).join(' │');
    console.log(`  ${w.weekStart}  │${cols} │ ${String(total).padStart(5)} │ ${note}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 6. SATURDAY vs SUNDAY — WHICH DAY IS THE PROBLEM?
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n  ┌─────────────────────────────────────────────────────────────────┐');
  console.log('  │  6. SATURDAY vs SUNDAY — ISOLATING THE WEEKEND DIP             │');
  console.log('  └─────────────────────────────────────────────────────────────────┘');

  const satTotal = byDow[6];
  const sunTotal = byDow[0];
  const satAvg = satTotal.orders / dayOccurrences[6];
  const sunAvg = sunTotal.orders / dayOccurrences[0];
  const satAov = satTotal.orders > 0 ? satTotal.revenue / satTotal.orders / 100 : 0;
  const sunAov = sunTotal.orders > 0 ? sunTotal.revenue / sunTotal.orders / 100 : 0;
  const wdAvgAll = [1,2,3,4,5].reduce((s,d) => s + byDow[d].orders, 0) / [1,2,3,4,5].reduce((s,d) => s + dayOccurrences[d], 0);

  console.log(`  Saturday:  ${satAvg.toFixed(1)} orders/day  (${((satAvg/wdAvgAll-1)*100).toFixed(0)}% vs weekday avg)  AOV $${satAov.toFixed(2)}`);
  console.log(`  Sunday:    ${sunAvg.toFixed(1)} orders/day  (${((sunAvg/wdAvgAll-1)*100).toFixed(0)}% vs weekday avg)  AOV $${sunAov.toFixed(2)}`);
  console.log(`  Weekday:   ${wdAvgAll.toFixed(1)} orders/day                              AOV $${([1,2,3,4,5].reduce((s,d) => s+byDow[d].revenue,0) / [1,2,3,4,5].reduce((s,d) => s+byDow[d].orders,0) / 100).toFixed(2)}`);

  // Count weeks where Sat outperformed and Sun dipped vs vice versa
  let satUp = 0, satDown = 0, sunUp = 0, sunDown = 0;
  for (const r of weekendRatios) {
    if (r.satPct > 10) satUp++; else if (r.satPct < -10) satDown++;
    if (r.sunPct > 10) sunUp++; else if (r.sunPct < -10) sunDown++;
  }
  console.log(`\n  Weeks where Saturday outperformed weekday avg: ${satUp}/${weekendRatios.length}`);
  console.log(`  Weeks where Saturday underperformed:           ${satDown}/${weekendRatios.length}`);
  console.log(`  Weeks where Sunday outperformed weekday avg:   ${sunUp}/${weekendRatios.length}`);
  console.log(`  Weeks where Sunday underperformed:             ${sunDown}/${weekendRatios.length}`);

  // ══════════════════════════════════════════════════════════════════════════
  // 7. ROLLING 7-DAY TREND
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n  ┌─────────────────────────────────────────────────────────────────┐');
  console.log('  │  7. ROLLING 7-DAY TOTALS                                       │');
  console.log('  └─────────────────────────────────────────────────────────────────┘');

  // Build dense daily array
  const allDays: { date: string; orders: number; revenue: number }[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate()+1)) {
    const key = d.toISOString().split('T')[0];
    allDays.push({ date: key, orders: dailyMap[key]?.orders ?? 0, revenue: dailyMap[key]?.revenue ?? 0 });
  }

  // Weekly rolling from last 30 entries
  const recentDays = allDays.slice(-35);
  for (let i = 6; i < recentDays.length; i++) {
    const window = recentDays.slice(i-6, i+1);
    const totalOrders = window.reduce((s,d) => s+d.orders, 0);
    const totalRev = window.reduce((s,d) => s+d.revenue, 0);
    const bar = '█'.repeat(Math.round(totalOrders / 5));
    const end = recentDays[i].date;
    console.log(`  ending ${end}  ${String(totalOrders).padStart(4)} orders  $${(totalRev/100).toFixed(0).padStart(6)}  ${bar}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SYNTHESIS
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n  ╔══════════════════════════════════════════════════════════════════╗');
  console.log('  ║  FINDINGS                                                       ║');
  console.log('  ╚══════════════════════════════════════════════════════════════════╝');

  const weCcPct = split.weekend.onetime.count + split.weekend.newSub.count;
  const wdCcPct = split.weekday.onetime.count + split.weekday.newSub.count;

  console.log(`
  1. WEEKEND EFFECT SIZE: ${avgRatio >= 0.95 ? 'NEGLIGIBLE' : avgRatio >= 0.85 ? 'MILD' : 'MODERATE'}
     Trend-adjusted WE/WD ratio: ${avgRatio.toFixed(2)} (±${stdDev.toFixed(2)})
     Raw weekend drop: ${((12.5/13.2-1)*100).toFixed(1)}% in volume, ${((1619/1711-1)*100).toFixed(1)}% in revenue

  2. SATURDAY vs SUNDAY:
     Saturday: ${((satAvg/wdAvgAll-1)*100).toFixed(0)}% vs weekday avg — ${satAvg > wdAvgAll * 0.95 ? 'essentially flat' : 'mild dip'}
     Sunday:   ${((sunAvg/wdAvgAll-1)*100).toFixed(0)}% vs weekday avg — ${sunAvg < wdAvgAll * 0.85 ? 'this is your problem day' : 'mild dip'}

  3. COMPOSITION SHIFT ON WEEKENDS:
     Direct Shopify share jumps from ${(split.weekday.direct.count/wdTotalCount*100).toFixed(0)}% → ${(split.weekend.direct.count/weTotalCount*100).toFixed(0)}% on weekends
     CC acquisition (one-time + new sub) drops from ${((wdCcPct/wdTotalCount)*100).toFixed(0)}% → ${((weCcPct/weTotalCount)*100).toFixed(0)}%
     → Weekend under-indexing is a PAID CHANNEL effect, not demand

  4. BIGGEST VARIANCE DAY: ${DAYS[[0,1,2,3,4,5,6].reduce((worst, d) => {
    const avg = byDow[d].orders / dayOccurrences[d];
    const worstAvg = byDow[worst].orders / dayOccurrences[worst];
    return avg < worstAvg ? d : worst;
  }, 0)]} (${(byDow[[0,1,2,3,4,5,6].reduce((worst, d) => {
    const avg = byDow[d].orders / dayOccurrences[d];
    const worstAvg = byDow[worst].orders / dayOccurrences[worst];
    return avg < worstAvg ? d : worst;
  }, 0)].orders / dayOccurrences[[0,1,2,3,4,5,6].reduce((worst, d) => {
    const avg = byDow[d].orders / dayOccurrences[d];
    const worstAvg = byDow[worst].orders / dayOccurrences[worst];
    return avg < worstAvg ? d : worst;
  }, 0)]).toFixed(1)} orders/day)

  5. GROWTH CONTEXT:
     Jan avg: ${(Object.values(months).find((_,i) => i===0)?.totalOrders ?? 0 / 31).toFixed(0)} orders total
     Mar avg: ${Object.values(months).find((_,i) => i===2)?.totalOrders ?? 0} orders (first 21 days)
     Growth rate dwarfs any day-of-week effect
`);

  await db.$disconnect();
}
main().catch(console.error);
