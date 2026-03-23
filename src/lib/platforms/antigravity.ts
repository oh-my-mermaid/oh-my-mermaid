import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import type { Platform } from './types.js';
import { getSkillsSource } from './utils.js';

const SKILLS_TARGET = path.join(os.homedir(), '.gemini', 'antigravity', 'skills', 'oh-my-mermaid');

export const antigravity: Platform = {
  name: 'Antigravity',
  id: 'antigravity',

  detect(): boolean {
    try {
      execSync('which antigravity', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  },

  isSetup(): boolean {
    return fs.existsSync(SKILLS_TARGET);
  },

  async setup(): Promise<void> {
    const source = getSkillsSource();
    if (!source) {
      process.stderr.write('  Could not locate skills directory.\n');
      return;
    }

    fs.mkdirSync(path.dirname(SKILLS_TARGET), { recursive: true });

    if (fs.existsSync(SKILLS_TARGET)) {
      fs.rmSync(SKILLS_TARGET, { recursive: true });
    }
    fs.symlinkSync(source, SKILLS_TARGET, 'dir');
    process.stderr.write(`  Symlinked skills → ${SKILLS_TARGET}\n`);
  },

  teardown(): void {
    if (fs.existsSync(SKILLS_TARGET)) {
      fs.rmSync(SKILLS_TARGET, { recursive: true });
    }
  },
};
