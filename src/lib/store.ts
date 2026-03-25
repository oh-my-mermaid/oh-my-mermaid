import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { VALID_FIELDS, FIELD_FILES, type Field, type ClassMeta, type ClassData, type OmmConfig } from '../types.js';
import { updateMeta } from './meta.js';

const OMM_DIR = '.omm';
const CONFIG_FILE = 'config.yaml';
const META_FILE = 'meta.yaml';

export function getOmmDir(cwd: string = process.cwd()): string {
  return path.join(cwd, OMM_DIR);
}

export function ommExists(cwd?: string): boolean {
  return fs.existsSync(getOmmDir(cwd));
}

/**
 * Write commands: auto-create .omm/ if missing (lazy-init).
 */
export function ensureOmmForWrite(cwd?: string): void {
  if (!ommExists(cwd)) {
    initOmm(cwd);
    process.stderr.write('Created .omm/ directory. Add to .gitignore if not wanted.\n');
  }
}

/**
 * Read commands: return false if .omm/ missing (no auto-create).
 */
export function ensureOmmForRead(cwd?: string): boolean {
  if (!ommExists(cwd)) {
    process.stderr.write('No .omm/ directory found. Run /omm-scan in Claude Code to generate architecture docs.\n');
    return false;
  }
  return true;
}

export function isValidField(field: string): field is Field {
  return (VALID_FIELDS as readonly string[]).includes(field);
}

// --- Init ---

export function initOmm(cwd?: string): void {
  const dir = getOmmDir(cwd);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const configPath = path.join(dir, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    const config: OmmConfig = { version: '0.1.0' };
    fs.writeFileSync(configPath, YAML.stringify(config), 'utf-8');
  }
}

// --- Class operations ---

function classDir(className: string, cwd?: string): string {
  return path.join(getOmmDir(cwd), className);
}

function ensureClassDir(className: string, cwd?: string): string {
  const dir = classDir(className, cwd);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function classExists(className: string, cwd?: string): boolean {
  return fs.existsSync(classDir(className, cwd));
}

export function listClasses(cwd?: string): string[] {
  const dir = getOmmDir(cwd);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name)
    .sort();
}

// --- Perspective + Nested Element operations (direct nesting, no nodes/ dir) ---

/** Resolve filesystem path for a nested element: .omm/<perspective>/<child>/<grandchild> */
export function nodeDir(perspective: string, nodePath: string[], cwd?: string): string {
  return path.join(classDir(perspective, cwd), ...nodePath);
}

function ensureNodeDir(perspective: string, nodePath: string[], cwd?: string): string {
  const dir = nodeDir(perspective, nodePath, cwd);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** List top-level perspectives */
export function listPerspectives(cwd?: string): string[] {
  return listClasses(cwd);
}

/** List child elements under a perspective or nested path */
export function listNodes(perspective: string, nodePath: string[] = [], cwd?: string): string[] {
  const dir = nodePath.length === 0
    ? classDir(perspective, cwd)
    : nodeDir(perspective, nodePath, cwd);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name)
    .sort();
}

/** Read a field from a nested element */
export function readNodeField(perspective: string, nodePath: string[], field: Field, cwd?: string): string | null {
  const dir = nodeDir(perspective, nodePath, cwd);
  const filePath = path.join(dir, FIELD_FILES[field]);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/** Write a field to a nested element */
export function writeNodeField(
  perspective: string,
  nodePath: string[],
  field: Field,
  content: string,
  cwd?: string,
): number {
  ensureOmmForWrite(cwd);
  ensureClassDir(perspective, cwd);
  const dir = ensureNodeDir(perspective, nodePath, cwd);
  const filePath = path.join(dir, FIELD_FILES[field]);

  if (field === 'diagram') {
    const prev = readNodeField(perspective, nodePath, 'diagram', cwd);
    if (prev !== null) {
      const meta = readNodeMeta(perspective, nodePath, cwd);
      if (meta) {
        meta.prev_diagram = prev;
        writeNodeMeta(perspective, nodePath, meta, cwd);
      }
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');

  const fullPath = [perspective, ...nodePath].join('/');
  const meta = readNodeMeta(perspective, nodePath, cwd) ?? createNodeMeta(
    nodePath.length === 0 ? 'perspective' : 'nested-class',
    nodePath[nodePath.length - 1] ?? perspective,
    field,
    nodePath.length > 0 ? nodePath.slice(0, -1) : undefined,
  );
  meta.updated = new Date().toISOString();
  meta.update_count = (meta.update_count ?? 0) + 1;
  meta.last_field = field;
  writeNodeMeta(perspective, nodePath, meta, cwd);

  if (nodePath.length > 0) {
    const parentNodePath = nodePath.slice(0, -1);
    const childName = nodePath[nodePath.length - 1];
    const parentMeta = readNodeMeta(perspective, parentNodePath, cwd) ?? createNodeMeta(
      parentNodePath.length === 0 ? 'perspective' : 'nested-class',
      parentNodePath.length === 0 ? perspective : parentNodePath[parentNodePath.length - 1],
      field,
      parentNodePath.length > 0 ? parentNodePath.slice(0, -1) : undefined,
    );
    if (!parentMeta.children) parentMeta.children = [];
    if (!parentMeta.children.includes(childName)) {
      parentMeta.children.push(childName);
      parentMeta.children.sort();
      writeNodeMeta(perspective, parentNodePath, parentMeta, cwd);
    }
  }

  const bytes = Buffer.byteLength(content, 'utf-8');
  process.stderr.write(`wrote ${fullPath}/${FIELD_FILES[field]} (${bytes} bytes)\n`);
  return bytes;
}

function createNodeMeta(kind: import('../types.js').NodeKind, title: string, field: Field, parentPath?: string[]): ClassMeta {
  const now = new Date().toISOString();
  return {
    created: now,
    updated: now,
    update_count: 0,
    last_field: field,
    kind,
    title,
    children: [],
    parentPath: parentPath,
  };
}

export function readNodeMeta(perspective: string, nodePath: string[], cwd?: string): ClassMeta | null {
  const dir = nodePath.length === 0
    ? classDir(perspective, cwd)
    : nodeDir(perspective, nodePath, cwd);
  const filePath = path.join(dir, META_FILE);
  if (!fs.existsSync(filePath)) return null;
  return YAML.parse(fs.readFileSync(filePath, 'utf-8')) as ClassMeta;
}

function writeNodeMeta(perspective: string, nodePath: string[], meta: ClassMeta, cwd?: string): void {
  const dir = nodePath.length === 0
    ? ensureClassDir(perspective, cwd)
    : ensureNodeDir(perspective, nodePath, cwd);
  const filePath = path.join(dir, META_FILE);
  fs.writeFileSync(filePath, YAML.stringify(meta), 'utf-8');
}

/** Show all fields for a nested element */
export function showNode(perspective: string, nodePath: string[], cwd?: string): ClassData | null {
  const dir = nodePath.length === 0
    ? classDir(perspective, cwd)
    : nodeDir(perspective, nodePath, cwd);
  if (!fs.existsSync(dir)) return null;
  const name = nodePath.length === 0 ? perspective : nodePath.join('/');
  return {
    name,
    description: readNodeField(perspective, nodePath, 'description', cwd) ?? undefined,
    diagram: readNodeField(perspective, nodePath, 'diagram', cwd) ?? undefined,
    constraint: readNodeField(perspective, nodePath, 'constraint', cwd) ?? undefined,
    concern: readNodeField(perspective, nodePath, 'concern', cwd) ?? undefined,
    context: readNodeField(perspective, nodePath, 'context', cwd) ?? undefined,
    todo: readNodeField(perspective, nodePath, 'todo', cwd) ?? undefined,
    note: readNodeField(perspective, nodePath, 'note', cwd) ?? undefined,
    meta: readNodeMeta(perspective, nodePath, cwd) ?? undefined,
  };
}

export function deleteClass(className: string, cwd?: string): boolean {
  const dir = classDir(className, cwd);
  if (!fs.existsSync(dir)) return false;
  fs.rmSync(dir, { recursive: true });
  return true;
}

// --- Field read/write ---

export function readField(className: string, field: Field, cwd?: string): string | null {
  const filePath = path.join(classDir(className, cwd), FIELD_FILES[field]);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

export function writeField(className: string, field: Field, content: string, cwd?: string): number {
  ensureOmmForWrite(cwd);
  const dir = ensureClassDir(className, cwd);
  const filePath = path.join(dir, FIELD_FILES[field]);

  // If writing diagram, save previous version to meta
  if (field === 'diagram') {
    const prev = readField(className, 'diagram', cwd);
    if (prev !== null) {
      const meta = readMeta(className, cwd);
      if (meta) {
        meta.prev_diagram = prev;
        writeMeta(className, meta, cwd);
      }
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  updateMeta(className, field, cwd);

  const bytes = Buffer.byteLength(content, 'utf-8');
  process.stderr.write(`wrote ${className}/${FIELD_FILES[field]} (${bytes} bytes)\n`);
  return bytes;
}

// --- Meta ---

export function readMeta(className: string, cwd?: string): ClassMeta | null {
  const filePath = path.join(classDir(className, cwd), META_FILE);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return YAML.parse(raw) as ClassMeta;
}

export function writeMeta(className: string, meta: ClassMeta, cwd?: string): void {
  const dir = ensureClassDir(className, cwd);
  const filePath = path.join(dir, META_FILE);
  fs.writeFileSync(filePath, YAML.stringify(meta), 'utf-8');
}

// --- Show (all fields) ---

export function showClass(className: string, cwd?: string): ClassData | null {
  if (!classExists(className, cwd)) return null;
  return {
    name: className,
    description: readField(className, 'description', cwd) ?? undefined,
    diagram: readField(className, 'diagram', cwd) ?? undefined,
    constraint: readField(className, 'constraint', cwd) ?? undefined,
    concern: readField(className, 'concern', cwd) ?? undefined,
    context: readField(className, 'context', cwd) ?? undefined,
    todo: readField(className, 'todo', cwd) ?? undefined,
    note: readField(className, 'note', cwd) ?? undefined,
    meta: readMeta(className, cwd) ?? undefined,
  };
}
