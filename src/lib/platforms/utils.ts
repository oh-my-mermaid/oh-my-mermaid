import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Locate the skills/ directory shipped with the npm package.
 * Works from both dist/ (production) and src/ (dev).
 */
export function getSkillsSource(): string | null {
  const candidates = [
    path.join(__dirname, '..', 'skills'),                  // from dist/ (flat build via tsup)
    path.join(__dirname, '..', '..', 'skills'),            // from dist/lib/platforms/
    path.join(__dirname, '..', '..', '..', 'skills'),      // from src/lib/platforms/
  ];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }
  return null;
}

/**
 * Locate the agents/ directory shipped with the npm package.
 * Works from both dist/ (production) and src/ (dev).
 * Returns null if agents/ does not exist yet.
 */
export function getAgentsSource(): string | null {
  const candidates = [
    path.join(__dirname, '..', 'agents'),                  // from dist/ (flat build via tsup)
    path.join(__dirname, '..', '..', 'agents'),            // from dist/lib/platforms/
    path.join(__dirname, '..', '..', '..', 'agents'),      // from src/lib/platforms/
  ];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }
  return null;
}

/**
 * Cross-platform check whether a binary is available on PATH.
 * Uses `where` on Windows, `which` on Unix/macOS.
 */
export function hasCommand(bin: string): boolean {
  const cmd = process.platform === 'win32' ? `where ${bin}` : `which ${bin}`;
  try {
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Read the current package version from plugin.json or package.json.
 * Works from both dist/ (production) and src/lib/platforms/ (dev).
 */
export function getPackageVersion(): string | null {
  const candidates = [
    path.join(__dirname, '..', '.claude-plugin', 'plugin.json'),       // from dist/
    path.join(__dirname, '..', '..', '..', '.claude-plugin', 'plugin.json'), // from src/lib/platforms/
    path.join(__dirname, '..', 'package.json'),                        // from dist/
    path.join(__dirname, '..', '..', '..', 'package.json'),            // from src/lib/platforms/
  ];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) {
      try {
        const data = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
        if (data.version) return data.version;
      } catch { /* ignore */ }
    }
  }
  return null;
}
