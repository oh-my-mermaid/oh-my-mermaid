import fs from 'node:fs';
import path from 'node:path';
import type {
  StructureEntryPoint,
  StructureOutput,
  StructurePackage,
  StructureRelation,
  StructureSample,
  StructureTreeNode,
} from '../types.js';

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py']);
const TEXT_SCAN_LINE_LIMIT = 200;
const IGNORED_DIRS = new Set([
  '.git',
  '.next',
  '.omm',
  '.pytest_cache',
  '.venv',
  '.worktrees',
  '.turbo',
  '.yarn',
  '__pycache__',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'venv',
]);

const JS_IMPORT_PATTERNS = [
  /\bimport\s+[^'"]*?\sfrom\s+['"]([^'"]+)['"]/g,
  /\bimport\s+['"]([^'"]+)['"]/g,
  /\bexport\s+[^'"]*?\sfrom\s+['"]([^'"]+)['"]/g,
  /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];

const PYTHON_IMPORT_PATTERNS = [
  /^\s*from\s+([A-Za-z0-9_\.]+)\s+import\s+([A-Za-z0-9_,\s\*]+)/gm,
  /^\s*import\s+([A-Za-z0-9_\.]+(?:\s*,\s*[A-Za-z0-9_\.]+)*)/gm,
];

interface FileRecord {
  absolutePath: string;
  relativePath: string;
  dirPath: string;
  extension: string;
}

interface RelationAccumulator {
  count: number;
  samples: StructureSample[];
}

export async function buildStructure(rootDir: string = process.cwd()): Promise<StructureOutput> {
  const resolvedRoot = path.resolve(rootDir);
  const files = collectFiles(resolvedRoot);
  const fileIndex = buildFileIndex(files);
  const packages = collectPackages(resolvedRoot);
  const entryPoints = collectEntryPoints(resolvedRoot, packages, fileIndex);
  const tree = collectTree(files);
  const relations = collectRelations(files, fileIndex);

  return {
    tree,
    relations,
    entry_points: entryPoints,
    packages,
    scan_meta: {
      root: '.',
      scanned_files: files.length,
      generated_at: new Date().toISOString(),
    },
  };
}

export function formatStructureSummary(structure: StructureOutput): string {
  const lines: string[] = [];

  lines.push('Packages');
  if (structure.packages.length === 0) {
    lines.push('- none');
  } else {
    for (const pkg of structure.packages) {
      lines.push(`- ${pkg.name} (${pkg.path})`);
    }
  }

  lines.push('');
  lines.push('Entry points');
  if (structure.entry_points.length === 0) {
    lines.push('- none');
  } else {
    for (const entryPoint of structure.entry_points) {
      lines.push(`- ${entryPoint.path} [${entryPoint.kind}]`);
    }
  }

  lines.push('');
  lines.push('Directories');
  if (structure.tree.length === 0) {
    lines.push('- none');
  } else {
    for (const node of structure.tree.slice(0, 12)) {
      lines.push(`- ${node.path} (${node.files} files, ${node.languages.join(', ')})`);
    }
  }

  lines.push('');
  lines.push('Import relations');
  if (structure.relations.length === 0) {
    lines.push('- none');
  } else {
    for (const relation of structure.relations.slice(0, 12)) {
      lines.push(`- ${relation.from} -> ${relation.to} (${relation.count})`);
    }
  }

  return lines.join('\n');
}

function collectFiles(rootDir: string): FileRecord[] {
  const files: FileRecord[] = [];

  walk(rootDir, absolutePath => {
    const extension = path.extname(absolutePath);
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      return;
    }

    const relativePath = normalizePath(path.relative(rootDir, absolutePath));
    const dirPath = relativeDir(relativePath);
    files.push({ absolutePath, relativePath, dirPath, extension });
  });

  files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  return files;
}

function walk(currentDir: string, onFile: (absolutePath: string) => void): void {
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.config') {
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }
    }
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      walk(absolutePath, onFile);
      continue;
    }
    if (entry.isFile()) {
      onFile(absolutePath);
    }
  }
}

function buildFileIndex(files: FileRecord[]): Map<string, FileRecord> {
  const index = new Map<string, FileRecord>();
  for (const file of files) {
    index.set(file.relativePath, file);
  }
  return index;
}

function collectPackages(rootDir: string): StructurePackage[] {
  const packages: StructurePackage[] = [];

  walk(rootDir, absolutePath => {
    if (path.basename(absolutePath) !== 'package.json') {
      return;
    }
    try {
      const raw = fs.readFileSync(absolutePath, 'utf8');
      const parsed = JSON.parse(raw) as { name?: string };
      if (!parsed.name) {
        return;
      }
      const pkgDir = path.dirname(absolutePath);
      const relativePath = normalizePath(path.relative(rootDir, pkgDir)) || '.';
      packages.push({ path: relativePath, name: parsed.name });
    } catch {
      // Skip malformed package files.
    }
  });

  packages.sort((left, right) => left.path.localeCompare(right.path));
  return packages;
}

function collectEntryPoints(
  rootDir: string,
  packages: StructurePackage[],
  fileIndex: Map<string, FileRecord>,
): StructureEntryPoint[] {
  const seen = new Map<string, StructureEntryPoint>();

  for (const pkg of packages) {
    const packagePath = pkg.path === '.' ? rootDir : path.join(rootDir, pkg.path);
    const packageJsonPath = path.join(packagePath, 'package.json');
    try {
      const raw = fs.readFileSync(packageJsonPath, 'utf8');
      const parsed = JSON.parse(raw) as { bin?: string | Record<string, string>; main?: string };
      if (typeof parsed.bin === 'string') {
        addEntryPointFromSpecifier(rootDir, parsed.bin, 'cli', seen, fileIndex, packagePath);
      } else if (parsed.bin && typeof parsed.bin === 'object') {
        for (const value of Object.values(parsed.bin)) {
          addEntryPointFromSpecifier(rootDir, value, 'cli', seen, fileIndex, packagePath);
        }
      }
      if (typeof parsed.main === 'string') {
        addEntryPointFromSpecifier(rootDir, parsed.main, 'module', seen, fileIndex, packagePath);
      }
    } catch {
      // Ignore malformed package files.
    }
  }

  for (const candidate of [
    'src/cli.ts',
    'src/index.ts',
    'src/main/index.ts',
    'src/main.ts',
    'src/main.tsx',
    'src/renderer/src/main.ts',
    'src/renderer/src/main.tsx',
    'src/app.ts',
    'src/app.tsx',
    'cli.ts',
    'main.py',
    'app.py',
  ]) {
    const resolved = resolveLocalPath(candidate, rootDir, fileIndex);
    if (!resolved) {
      continue;
    }
    const kind = candidate.includes('cli')
      ? 'cli'
      : candidate.includes('renderer')
        ? 'web'
        : candidate.endsWith('.py')
          ? 'script'
          : 'module';
    seen.set(resolved.relativePath, { path: resolved.relativePath, kind });
  }

  return [...seen.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function addEntryPointFromSpecifier(
  rootDir: string,
  specifier: string,
  kind: StructureEntryPoint['kind'],
  seen: Map<string, StructureEntryPoint>,
  fileIndex: Map<string, FileRecord>,
  baseDir: string,
): void {
  const candidate = normalizePath(path.relative(rootDir, path.resolve(baseDir, specifier)));
  const resolved = resolveLocalPath(candidate, rootDir, fileIndex);
  if (!resolved) {
    return;
  }
  seen.set(resolved.relativePath, { path: resolved.relativePath, kind });
}

function collectTree(files: FileRecord[]): StructureTreeNode[] {
  const nodes = new Map<string, { files: number; languages: Set<string> }>();

  for (const file of files) {
    if (!file.dirPath) {
      continue;
    }
    let node = nodes.get(file.dirPath);
    if (!node) {
      node = { files: 0, languages: new Set<string>() };
      nodes.set(file.dirPath, node);
    }
    node.files += 1;
    node.languages.add(languageForExtension(file.extension));
  }

  return [...nodes.entries()]
    .map(([dirPath, value]) => ({
      path: dirPath,
      files: value.files,
      languages: [...value.languages].sort(),
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function collectRelations(files: FileRecord[], fileIndex: Map<string, FileRecord>): StructureRelation[] {
  const relations = new Map<string, RelationAccumulator>();

  for (const file of files) {
    const content = readHead(file.absolutePath);
    const imports = file.extension === '.py'
      ? extractPythonImports(content)
      : extractJsImports(content);

    for (const specifier of imports) {
      const target = file.extension === '.py'
        ? resolvePythonImport(specifier, fileIndex)
        : resolveJsImport(specifier, file, fileIndex);

      if (!target || target.relativePath === file.relativePath) {
        continue;
      }

      const from = file.dirPath || '.';
      const to = target.dirPath || '.';
      const key = `${from}::${to}`;
      let accumulator = relations.get(key);
      if (!accumulator) {
        accumulator = { count: 0, samples: [] };
        relations.set(key, accumulator);
      }
      accumulator.count += 1;
      if (accumulator.samples.length < 3) {
        accumulator.samples.push({ from: file.relativePath, to: target.relativePath });
      }
    }
  }

  return [...relations.entries()]
    .map(([key, value]) => {
      const [from, to] = key.split('::');
      return {
        from,
        to,
        kind: 'import' as const,
        count: value.count,
        samples: value.samples,
      };
    })
    .sort((left, right) => (
      left.from.localeCompare(right.from)
      || left.to.localeCompare(right.to)
    ));
}

function readHead(filePath: string): string {
  const source = fs.readFileSync(filePath, 'utf8');
  return source.split(/\r?\n/).slice(0, TEXT_SCAN_LINE_LIMIT).join('\n');
}

function extractJsImports(source: string): string[] {
  const imports = new Set<string>();
  for (const pattern of JS_IMPORT_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier) {
        imports.add(specifier);
      }
    }
  }
  return [...imports];
}

function extractPythonImports(source: string): string[] {
  const imports = new Set<string>();

  for (const match of source.matchAll(PYTHON_IMPORT_PATTERNS[0])) {
    const modulePath = match[1];
    const imported = match[2];
    if (!modulePath) {
      continue;
    }
    const firstImport = imported
      .split(',')
      .map(value => value.trim())
      .find(value => value && value !== '*');
    if (firstImport) {
      imports.add(`${modulePath}.${firstImport}`);
    } else {
      imports.add(modulePath);
    }
  }

  for (const match of source.matchAll(PYTHON_IMPORT_PATTERNS[1])) {
    const group = match[1];
    if (!group) {
      continue;
    }
    for (const item of group.split(',')) {
      const cleaned = item.trim();
      if (cleaned) {
        imports.add(cleaned);
      }
    }
  }

  return [...imports];
}

function resolveJsImport(specifier: string, sourceFile: FileRecord, fileIndex: Map<string, FileRecord>): FileRecord | null {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const sourceDir = sourceFile.dirPath ? sourceFile.dirPath.slice(0, -1) : '.';
  const absoluteLike = normalizePath(path.join(sourceDir, specifier));
  return resolveLocalPath(absoluteLike, process.cwd(), fileIndex);
}

function resolvePythonImport(specifier: string, fileIndex: Map<string, FileRecord>): FileRecord | null {
  const dotted = specifier.replace(/\./g, '/');
  const direct = `${dotted}.py`;
  const index = `${dotted}/__init__.py`;
  return fileIndex.get(direct) ?? fileIndex.get(index) ?? null;
}

function resolveLocalPath(candidate: string, _rootDir: string, fileIndex: Map<string, FileRecord>): FileRecord | null {
  const normalized = normalizePath(candidate);
  const extension = path.extname(normalized);

  if (extension) {
    const stripped = normalized.slice(0, -extension.length);
    for (const possibleExtension of SUPPORTED_EXTENSIONS) {
      const direct = `${stripped}${possibleExtension}`;
      const hit = fileIndex.get(direct);
      if (hit) {
        return hit;
      }
    }
  }

  const directHit = fileIndex.get(normalized);
  if (directHit) {
    return directHit;
  }

  for (const possibleExtension of SUPPORTED_EXTENSIONS) {
    const hit = fileIndex.get(`${normalized}${possibleExtension}`);
    if (hit) {
      return hit;
    }
    const indexHit = fileIndex.get(`${normalized}/index${possibleExtension}`);
    if (indexHit) {
      return indexHit;
    }
  }

  return null;
}

function relativeDir(relativePathValue: string): string {
  const dir = normalizePath(path.dirname(relativePathValue));
  if (!dir || dir === '.') {
    return '';
  }
  return dir.endsWith('/') ? dir : `${dir}/`;
}

function normalizePath(value: string): string {
  return value.split(path.sep).join('/').replace(/^\.\//, '');
}

function languageForExtension(extension: string): string {
  switch (extension) {
    case '.py':
      return 'py';
    case '.tsx':
    case '.ts':
      return 'ts';
    case '.jsx':
    case '.js':
    case '.mjs':
    case '.cjs':
      return 'js';
    default:
      return extension.replace(/^\./, '');
  }
}
