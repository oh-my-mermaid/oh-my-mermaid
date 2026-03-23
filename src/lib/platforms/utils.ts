import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Locate the skills/ directory shipped with the npm package.
 * Works from both dist/ (production) and src/ (dev).
 */
export function getSkillsSource(): string | null {
  const candidates = [
    path.join(__dirname, '..', '..', 'skills'),          // from dist/lib/platforms/
    path.join(__dirname, '..', '..', '..', 'skills'),     // from src/lib/platforms/
  ];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }
  return null;
}
