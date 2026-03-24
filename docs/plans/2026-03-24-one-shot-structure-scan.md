# One-Shot Structure Scan Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep `omm scan` as a one-shot command while adding a structural prepass that improves class selection and diagram grounding.

**Architecture:** Add a small, dependency-free `omm structure` command that emits JSON about the repo tree, import relations, entry points, and packages. Update the `omm-scan` skill to call `omm structure` first, use that output to choose classes and `source_paths`, then immediately generate classes without any approval or planner phase.

**Tech Stack:** TypeScript, Node built-ins (`fs`, `path`), existing CLI command architecture, existing Vitest test setup, skill docs in Markdown.

---

### Task 1: Add `StructureOutput` types

**Files:**
- Modify: `src/types.ts`
- Modify: `src/index.ts`
- Test: `src/__tests__/structure.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/structure.test.ts` with a first test that imports the new structure types and a placeholder builder function:

```ts
import { describe, expect, it } from 'vitest';
import type { StructureOutput } from '../types.js';

describe('structure types', () => {
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
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/structure.test.ts`

Expected: FAIL with `StructureOutput` not exported or missing.

**Step 3: Write minimal implementation**

In `src/types.ts`, add:

- `StructureTreeNode`
- `StructureRelationSample`
- `StructureRelation`
- `StructureEntryPoint`
- `StructurePackage`
- `StructureScanMeta`
- `StructureOutput`

Use this shape:

```ts
export interface StructureTreeNode {
  path: string;
  files: number;
  languages: string[];
}

export interface StructureRelationSample {
  from: string;
  to: string;
}

export interface StructureRelation {
  from: string;
  to: string;
  kind: 'import';
  count: number;
  samples: StructureRelationSample[];
}

export interface StructureEntryPoint {
  path: string;
  kind: 'cli' | 'node' | 'web' | 'unknown';
}

export interface StructurePackage {
  path: string;
  name: string;
}

export interface StructureScanMeta {
  root: string;
  scanned_files: number;
  generated_at: string;
}

export interface StructureOutput {
  tree: StructureTreeNode[];
  relations: StructureRelation[];
  entry_points: StructureEntryPoint[];
  packages: StructurePackage[];
  scan_meta: StructureScanMeta;
}
```

In `src/index.ts`, export the new types:

```ts
export type {
  StructureTreeNode,
  StructureRelationSample,
  StructureRelation,
  StructureEntryPoint,
  StructurePackage,
  StructureScanMeta,
  StructureOutput,
} from './types.js';
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/structure.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/types.ts src/index.ts src/__tests__/structure.test.ts
git commit -m "feat: add structure output types"
```

### Task 2: Implement `src/lib/structure.ts`

**Files:**
- Create: `src/lib/structure.ts`
- Modify: `src/__tests__/structure.test.ts`

**Step 1: Write the failing tests**

Extend `src/__tests__/structure.test.ts` with temp-dir fixture tests covering:

1. tree aggregation
2. import relation aggregation with samples
3. entry point detection
4. package detection

Use a fixture created inside the test:

```ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildStructure } from '../lib/structure.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omm-structure-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

it('aggregates directories and import relations', async () => {
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
  expect(result.relations).toContainEqual(expect.objectContaining({
    from: 'src/auth/',
    to: 'src/db/',
    kind: 'import',
    count: 1,
  }));
});
```

Add another test for Python imports:

```ts
it('captures python import relations', async () => {
  fs.mkdirSync(path.join(tmpDir, 'pkg', 'api'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'pkg', 'db'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'pkg', 'api', 'handler.py'), "from pkg.db import repo\n");
  fs.writeFileSync(path.join(tmpDir, 'pkg', 'db', 'repo.py'), "value = 1\n");

  const result = await buildStructure(tmpDir);

  expect(result.relations).toContainEqual(expect.objectContaining({
    kind: 'import',
    count: 1,
  }));
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/structure.test.ts`

Expected: FAIL because `buildStructure` does not exist.

**Step 3: Write minimal implementation**

Create `src/lib/structure.ts` with these exported functions:

```ts
export async function buildStructure(rootDir: string = process.cwd()): Promise<StructureOutput>
export function formatStructureSummary(output: StructureOutput): string
```

Implementation requirements:

- Use only Node built-ins
- Skip `node_modules`, `.git`, `.omm`, `dist`, `coverage`
- Read only supported source files: `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.py`
- Parse import-like statements from at most the first 200 lines
- Aggregate file counts by directory with trailing slash paths like `src/auth/`
- Resolve only local relative imports for relation edges
- Emit relation `samples` with original relative file paths
- Detect entry points using simple heuristics:
  - `src/cli.ts` or `src/cli.js` => `cli`
  - `src/index.ts` or `src/index.js` => `node`
  - `app/` or `src/server/` entry root can still be listed as `unknown` if no better signal
- Detect packages from `package.json` files
- Emit stable sorted arrays for deterministic output

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/structure.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/structure.ts src/__tests__/structure.test.ts
git commit -m "feat: add structure prepass generator"
```

### Task 3: Add `omm structure` CLI command

**Files:**
- Create: `src/commands/structure.ts`
- Modify: `src/cli.ts`
- Modify: `src/index.ts`
- Test: `src/__tests__/structure.test.ts`

**Step 1: Write the failing tests**

Add tests for command formatting to `src/__tests__/structure.test.ts`:

```ts
import { commandStructure } from '../commands/structure.js';

it('prints json by default', async () => {
  const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  await commandStructure({ rootDir: tmpDir, summary: false });
  expect(stdout).toHaveBeenCalled();
  const output = stdout.mock.calls.map(([value]) => String(value)).join('');
  expect(() => JSON.parse(output)).not.toThrow();
});

it('prints a human summary with --summary', async () => {
  const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  await commandStructure({ rootDir: tmpDir, summary: true });
  const output = stdout.mock.calls.map(([value]) => String(value)).join('');
  expect(output).toContain('Entry points');
  expect(output).toContain('Import relations');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/structure.test.ts`

Expected: FAIL because `commandStructure` does not exist.

**Step 3: Write minimal implementation**

Create `src/commands/structure.ts`:

```ts
import { buildStructure, formatStructureSummary } from '../lib/structure.js';

export async function commandStructure(options?: { rootDir?: string; summary?: boolean }): Promise<void> {
  const output = await buildStructure(options?.rootDir);
  const rendered = options?.summary
    ? formatStructureSummary(output)
    : JSON.stringify(output, null, 2);
  process.stdout.write(rendered + '\n');
}
```

Modify `src/cli.ts`:

- Add `structure` to `GLOBAL_COMMANDS`
- Add help lines:

```txt
  omm structure                     Print structural scan JSON
  omm structure --summary           Print structural scan summary
```

- Add command case:

```ts
case 'structure':
  await commandStructure({ summary: args[1] === '--summary' });
  return;
```

Modify `src/index.ts`:

```ts
export { buildStructure, formatStructureSummary } from './lib/structure.js';
export { commandStructure } from './commands/structure.js';
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/structure.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/commands/structure.ts src/cli.ts src/index.ts src/__tests__/structure.test.ts
git commit -m "feat: add omm structure command"
```

### Task 4: Rewrite `skills/omm-scan/SKILL.md` to use the structure prepass

**Files:**
- Modify: `skills/omm-scan/SKILL.md`

**Step 1: Write the failing contract test**

Because the skill file is documentation, add a source-contract test to `src/__tests__/structure.test.ts` that reads the skill file:

```ts
it('omm-scan skill uses the structure prepass before class generation', () => {
  const skillPath = path.join(process.cwd(), 'skills', 'omm-scan', 'SKILL.md');
  const source = fs.readFileSync(skillPath, 'utf8');
  expect(source).toContain('omm structure');
  expect(source).not.toContain('approval');
  expect(source).toContain('one-shot');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/structure.test.ts`

Expected: FAIL because the current skill still describes direct scan without the prepass.

**Step 3: Write minimal implementation**

Update `skills/omm-scan/SKILL.md` so it explicitly says:

- `omm scan` remains one-shot
- `omm structure` runs first in both full and focused mode
- structure output is used to choose classes and reading scope
- no approval or scan-plan phase exists
- edge grounding rules:
  - import evidence preferred
  - route/handler, command dispatch, config wiring allowed
  - phantom edges forbidden

Keep the public command surface unchanged.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/structure.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add skills/omm-scan/SKILL.md src/__tests__/structure.test.ts
git commit -m "docs: update omm-scan to use structure prepass"
```

### Task 5: End-to-end verification against the CLI

**Files:**
- No new files unless verification exposes a bug

**Step 1: Run focused structure verification**

Run:

```bash
npm test -- src/__tests__/structure.test.ts
```

Expected: PASS

**Step 2: Run the full CLI test suite**

Run:

```bash
npm test
```

Expected: PASS, with no new failing suites

**Step 3: Run the build**

Run:

```bash
npm run build
```

Expected: PASS

**Step 4: Smoke-test the new command**

Run:

```bash
node dist/cli.js structure --summary
node dist/cli.js structure | head -n 20
```

Expected:
- summary includes `Entry points`, `Packages`, and `Import relations`
- JSON output parses and contains `tree`, `relations`, `entry_points`, `packages`, `scan_meta`

**Step 5: Commit if any verification-only fixes were needed**

```bash
git add <files>
git commit -m "chore: polish structure scan verification"
```

### Task 6: Manual evaluation on representative repos

**Files:**
- No mandatory code changes

**Step 1: Run `omm structure` on the target repos**

Run on:

```bash
omm structure --summary
omm structure > /tmp/omm-structure.json
```

in:

- `oh-my-mermaid`
- `OpenClaw`
- `agito`

**Step 2: Run `omm scan` and compare results to baseline concerns**

Check:

- `oh-my-mermaid`: phantom nodes reduced
- `OpenClaw`: config-infra over-grouping reduced, major subtrees surfaced
- `agito`: false top-level edges reduced, auth/shared areas surfaced

**Step 3: Document residual gaps**

If a repo still fails due to runtime wiring not visible from imports:

- do not widen `structure.ts` yet
- capture the failure mode in notes for a later v2

**Step 4: Final commit only if code or skill text changed**

```bash
git add <files>
git commit -m "chore: refine structure scan heuristics"
```
