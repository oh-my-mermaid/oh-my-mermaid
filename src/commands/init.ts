import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initOmm, ommExists } from '../lib/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copySkills(cwd: string): void {
  // Skills are at ../skills/ relative to dist/ (or src/ in dev)
  const candidates = [
    path.join(__dirname, '..', 'skills'),       // from dist/cli.js
    path.join(__dirname, '..', '..', 'skills'), // from src/commands/init.ts (dev)
  ];

  let skillsSource: string | null = null;
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      skillsSource = candidate;
      break;
    }
  }

  if (!skillsSource) {
    process.stderr.write('warning: skills directory not found, skipping skill installation\n');
    return;
  }

  const targetDir = path.join(cwd, '.claude', 'skills');
  const skillDirs = fs.readdirSync(skillsSource, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const skillDir of skillDirs) {
    const src = path.join(skillsSource, skillDir.name);
    const dst = path.join(targetDir, skillDir.name);

    if (fs.existsSync(dst)) {
      process.stderr.write(`  skill ${skillDir.name} already exists, skipping\n`);
      continue;
    }

    fs.mkdirSync(dst, { recursive: true });
    const files = fs.readdirSync(src);
    for (const file of files) {
      fs.copyFileSync(path.join(src, file), path.join(dst, file));
    }
    process.stderr.write(`  installed skill: ${skillDir.name}\n`);
  }
}

export function commandInit(): void {
  const cwd = process.cwd();

  if (ommExists(cwd)) {
    process.stderr.write('.omm/ already exists\n');
  } else {
    initOmm(cwd);
    process.stderr.write('created .omm/\n');
  }

  copySkills(cwd);
  process.stderr.write('omm initialized.\n');
}
