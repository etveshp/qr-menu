import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DIRS = ['app', 'components', 'hooks', 'lib'];
const FORBIDDEN = ['svitkavyvisk@gmail.com', 'ADMIN_EMAILS', 'isUserAdmin'];

function collect(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collect(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\./.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('no hardcoded admin email in source', () => {
  it('does not contain the owner email, ADMIN_EMAILS or isUserAdmin', () => {
    const offenders: string[] = [];
    for (const dir of DIRS) {
      for (const file of collect(join(ROOT, dir))) {
        const src = readFileSync(file, 'utf8');
        for (const needle of FORBIDDEN) {
          if (src.includes(needle)) offenders.push(`${file} → ${needle}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
