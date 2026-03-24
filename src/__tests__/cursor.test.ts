import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getPackageVersion = vi.fn();

vi.mock('../lib/platforms/utils.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/platforms/utils.js')>('../lib/platforms/utils.js');
  return {
    ...actual,
    getPackageVersion,
  };
});

describe('cursor platform version-aware setup detection', () => {
  const originalCwd = process.cwd();
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omm-cursor-'));
    process.chdir(tmpDir);
    getPackageVersion.mockReset();
    getPackageVersion.mockReturnValue('0.1.5');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns false when the cursor plugin manifest is missing', async () => {
    const { cursor } = await import('../lib/platforms/cursor.js');

    expect(cursor.isSetup()).toBe(false);
  });

  it('returns false when the installed cursor plugin manifest version is stale', async () => {
    fs.mkdirSync(path.join(tmpDir, '.cursor-plugin'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.cursor-plugin', 'plugin.json'),
      JSON.stringify({ name: 'oh-my-mermaid', version: '0.1.4' }, null, 2) + '\n',
    );

    const { cursor } = await import('../lib/platforms/cursor.js');

    expect(cursor.isSetup()).toBe(false);
  });

  it('returns true when the installed cursor plugin manifest matches the current package version', async () => {
    fs.mkdirSync(path.join(tmpDir, '.cursor-plugin'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.cursor-plugin', 'plugin.json'),
      JSON.stringify({ name: 'oh-my-mermaid', version: '0.1.5' }, null, 2) + '\n',
    );

    const { cursor } = await import('../lib/platforms/cursor.js');

    expect(cursor.isSetup()).toBe(true);
  });
});
