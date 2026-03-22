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

export function ensureOmm(cwd?: string): void {
  if (!ommExists(cwd)) {
    process.stderr.write(`error: .omm/ not found. Run 'omm init' first.\n`);
    process.exit(1);
  }
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
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();
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
