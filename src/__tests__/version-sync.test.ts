import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectVersionInfo, getVersionMismatchMessages } from '../../scripts/check-version-sync.js';

let tmpDir: string | null = null;

afterEach(() => {
  if (tmpDir) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = null;
  }
});

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

function createVersionFixture(version: string, overrides?: {
  pluginVersion?: string;
  marketplaceVersion?: string;
  lockfileVersion?: string;
  rootPackageVersion?: string;
}): string {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omm-version-sync-'));

  writeJson(path.join(tmpDir, 'package.json'), { name: 'oh-my-mermaid', version });
  writeJson(path.join(tmpDir, '.claude-plugin', 'plugin.json'), {
    name: 'oh-my-mermaid',
    version: overrides?.pluginVersion ?? version,
  });
  writeJson(path.join(tmpDir, '.claude-plugin', 'marketplace.json'), {
    plugins: [{ name: 'oh-my-mermaid', version: overrides?.marketplaceVersion ?? version }],
  });
  writeJson(path.join(tmpDir, 'package-lock.json'), {
    name: 'oh-my-mermaid',
    version: overrides?.lockfileVersion ?? version,
    packages: {
      '': {
        name: 'oh-my-mermaid',
        version: overrides?.rootPackageVersion ?? overrides?.lockfileVersion ?? version,
      },
    },
  });

  return tmpDir;
}

describe('check-version-sync helpers', () => {
  it('accepts matching package, plugin, marketplace, and lockfile versions', () => {
    const fixture = createVersionFixture('1.2.3');
    const versions = collectVersionInfo(fixture);

    expect(versions).toEqual({
      packageVersion: '1.2.3',
      pluginVersion: '1.2.3',
      marketplaceVersion: '1.2.3',
      lockfileVersion: '1.2.3',
      lockfileRootVersion: '1.2.3',
    });
    expect(getVersionMismatchMessages(versions)).toEqual([]);
  });

  it('reports all mismatched versions, including a stale package-lock root package version', () => {
    const fixture = createVersionFixture('1.2.3', {
      pluginVersion: '1.2.4',
      marketplaceVersion: '1.2.5',
      lockfileVersion: '1.2.2',
      rootPackageVersion: '1.2.1',
    });

    const versions = collectVersionInfo(fixture);

    expect(getVersionMismatchMessages(versions)).toEqual([
      'plugin.json version (1.2.4) != package.json (1.2.3)',
      'marketplace.json version (1.2.5) != package.json (1.2.3)',
      'package-lock.json version (1.2.2) != package.json (1.2.3)',
      'package-lock.json packages[\"\"] version (1.2.1) != package.json (1.2.3)',
    ]);
  });
});
