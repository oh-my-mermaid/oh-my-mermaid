import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { StructureOutput } from '../types.js';
import { buildStructure, formatStructureSummary } from '../lib/structure.js';
import { commandStructure } from '../commands/structure.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omm-structure-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('structure output', () => {
  it('describes a machine-readable structure payload', () => {
    const sample: StructureOutput = {
      tree: [],
      relations: [],
      entry_points: [],
      packages: [],
      scan_meta: {
        root: '.',
        scanned_files: 0,
        generated_at: '2026-03-24T00:00:00.000Z',
      },
    };

    expect(sample.scan_meta.scanned_files).toBe(0);
  });

  it('aggregates directories, packages, entry points, and import relations', async () => {
    fs.mkdirSync(path.join(tmpDir, 'src', 'auth'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'src', 'db'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'fixture-app' }));
    fs.writeFileSync(path.join(tmpDir, 'src', 'cli.ts'), "import './auth/service.js';\n");
    fs.writeFileSync(path.join(tmpDir, 'src', 'auth', 'service.ts'), "import '../db/repo.js';\n");
    fs.writeFileSync(path.join(tmpDir, 'src', 'db', 'repo.ts'), "export const repo = true;\n");

    const result = await buildStructure(tmpDir);

    expect(result.packages).toContainEqual({ path: '.', name: 'fixture-app' });
    expect(result.entry_points).toContainEqual({ path: 'src/cli.ts', kind: 'cli' });
    expect(result.tree).toContainEqual(expect.objectContaining({ path: 'src/auth/', files: 1 }));
    expect(result.tree).toContainEqual(expect.objectContaining({ path: 'src/db/', files: 1 }));
    expect(result.relations).toContainEqual(expect.objectContaining({
      from: 'src/',
      to: 'src/auth/',
      kind: 'import',
      count: 1,
      samples: [{ from: 'src/cli.ts', to: 'src/auth/service.ts' }],
    }));
    expect(result.relations).toContainEqual(expect.objectContaining({
      from: 'src/auth/',
      to: 'src/db/',
      kind: 'import',
      count: 1,
      samples: [{ from: 'src/auth/service.ts', to: 'src/db/repo.ts' }],
    }));
  });

  it('captures python import relations', async () => {
    fs.mkdirSync(path.join(tmpDir, 'pkg', 'api'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'pkg', 'db'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'pkg', 'api', 'handler.py'), 'from pkg.db import repo\n');
    fs.writeFileSync(path.join(tmpDir, 'pkg', 'db', 'repo.py'), 'value = 1\n');

    const result = await buildStructure(tmpDir);

    expect(result.relations).toContainEqual(expect.objectContaining({
      from: 'pkg/api/',
      to: 'pkg/db/',
      kind: 'import',
      count: 1,
      samples: [{ from: 'pkg/api/handler.py', to: 'pkg/db/repo.py' }],
    }));
  });

  it('detects common app entry points even without package bin metadata', async () => {
    fs.mkdirSync(path.join(tmpDir, 'src', 'main'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'src', 'renderer', 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'src', 'main', 'index.ts'), 'export {};\n');
    fs.writeFileSync(path.join(tmpDir, 'src', 'renderer', 'src', 'main.tsx'), 'export {};\n');

    const result = await buildStructure(tmpDir);

    expect(result.entry_points).toContainEqual({ path: 'src/main/index.ts', kind: 'module' });
    expect(result.entry_points).toContainEqual({ path: 'src/renderer/src/main.tsx', kind: 'web' });
  });

  it('formats a human summary', async () => {
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'fixture-app' }));
    fs.writeFileSync(path.join(tmpDir, 'src', 'cli.ts'), 'console.log("hi")\n');

    const result = await buildStructure(tmpDir);
    const summary = formatStructureSummary(result);

    expect(summary).toContain('Packages');
    expect(summary).toContain('Entry points');
    expect(summary).toContain('Import relations');
  });
});

describe('commandStructure', () => {
  it('prints json by default', async () => {
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'fixture-app' }));
    fs.writeFileSync(path.join(tmpDir, 'src', 'cli.ts'), 'console.log("hi")\n');

    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await commandStructure({ rootDir: tmpDir, summary: false });

    const output = stdout.mock.calls.map(([value]) => String(value)).join('');
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('prints a summary with --summary mode', async () => {
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'fixture-app' }));
    fs.writeFileSync(path.join(tmpDir, 'src', 'cli.ts'), 'console.log("hi")\n');

    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await commandStructure({ rootDir: tmpDir, summary: true });

    const output = stdout.mock.calls.map(([value]) => String(value)).join('');
    expect(output).toContain('Entry points');
    expect(output).toContain('Import relations');
  });
});

describe('omm-scan skill contract', () => {
  it('uses omm structure as a one-shot prepass without approval phase', () => {
    const skillPath = path.join(process.cwd(), 'skills', 'omm-scan', 'SKILL.md');
    const source = fs.readFileSync(skillPath, 'utf8');

    expect(source).toContain('omm structure');
    expect(source).toContain('one-shot');
    expect(source).toContain('overall-architecture');
    expect(source).toContain('omm validate');
    expect(source).not.toContain('approval');
    expect(source).not.toContain('scan-plan');
  });
});
