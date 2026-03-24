import * as fs from 'fs';
import * as path from 'path';
import { TIMEFRAME_ORDER, DEFAULT_CONFIG } from './types';
import type { DetectorConfig } from './types';

const baseDir = path.resolve(process.cwd(), 'scripts/autoresearch');
const prodConfigPath = path.join(baseDir, 'production-config.json');

function main() {
  const allConfigs: Record<string, DetectorConfig> = {};

  for (const tf of TIMEFRAME_ORDER) {
    const cfgPath = path.join(baseDir, 'timeframes', tf, 'config.json');
    if (fs.existsSync(cfgPath)) {
      allConfigs[tf] = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    } else {
      allConfigs[tf] = { ...DEFAULT_CONFIG };
    }
  }

  let previous: Record<string, DetectorConfig> | null = null;
  if (fs.existsSync(prodConfigPath)) {
    previous = JSON.parse(fs.readFileSync(prodConfigPath, 'utf-8'));
  }

  fs.writeFileSync(prodConfigPath, JSON.stringify(allConfigs, null, 2));
  console.log(`Written to ${prodConfigPath}`);

  if (previous) {
    console.log('\nChanges from previous production config:');
    for (const tf of TIMEFRAME_ORDER) {
      const prev = previous[tf] ?? DEFAULT_CONFIG;
      const curr = allConfigs[tf];
      const changes: string[] = [];
      for (const key of Object.keys(curr) as (keyof DetectorConfig)[]) {
        const p = JSON.stringify(prev[key]);
        const c = JSON.stringify(curr[key]);
        if (p !== c) changes.push(`  ${key}: ${p} -> ${c}`);
      }
      if (changes.length > 0) {
        console.log(`\n[${tf}]`);
        changes.forEach(c => console.log(c));
      }
    }
  } else {
    console.log('First production config written (no previous to diff).');
  }
}

main();
