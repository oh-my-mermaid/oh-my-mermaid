import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import type { Platform } from './types.js';
import { getSkillsSource, getPackageVersion } from './utils.js';

const PLUGIN_DIR = '.cursor-plugin';
const PLUGIN_FILE = 'plugin.json';

function getCwd(): string {
  return process.cwd();
}

function getInstalledVersion(): string | null {
  const manifestPath = path.join(getCwd(), PLUGIN_DIR, PLUGIN_FILE);
  if (!fs.existsSync(manifestPath)) return null;

  try {
    const json = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    return typeof json.version === 'string' ? json.version : null;
  } catch {
    return null;
  }
}

export const cursor: Platform = {
  name: 'Cursor',
  id: 'cursor',

  detect(): boolean {
    // Cursor is detected if the binary exists or we're inside a Cursor workspace
    try {
      execSync('which cursor', { stdio: 'ignore' });
      return true;
    } catch {
      // Also detect if .cursor/ directory exists in project
      return fs.existsSync(path.join(getCwd(), '.cursor'));
    }
  },

  isSetup(): boolean {
    const installed = getInstalledVersion();
    if (!installed) return false;
    const current = getPackageVersion();
    if (!current) return true;
    return installed === current;
  },

  async setup(): Promise<void> {
    const skillsSource = getSkillsSource();
    if (!skillsSource) {
      process.stderr.write('  Could not locate skills directory.\n');
      return;
    }

    const pluginDir = path.join(getCwd(), PLUGIN_DIR);
    fs.mkdirSync(pluginDir, { recursive: true });

    const manifest = {
      name: 'oh-my-mermaid',
      displayName: 'oh-my-mermaid',
      description: 'Turn complex codebases into clear, navigable architecture diagrams',
      version: getPackageVersion() || '0.0.0',
      author: { name: 'oh-my-mermaid' },
      homepage: 'https://github.com/oh-my-mermaid/oh-my-mermaid',
      license: 'MIT',
      skills: skillsSource,
    };

    fs.writeFileSync(
      path.join(pluginDir, PLUGIN_FILE),
      JSON.stringify(manifest, null, 2) + '\n',
    );
    process.stderr.write(`  Created ${PLUGIN_DIR}/${PLUGIN_FILE} in project\n`);
  },

  teardown(): void {
    const pluginDir = path.join(getCwd(), PLUGIN_DIR);
    if (fs.existsSync(pluginDir)) {
      fs.rmSync(pluginDir, { recursive: true });
    }
  },
};
