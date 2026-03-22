import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ensureOmm, getOmmDir } from '../lib/store.js';

export function commandLink(slug?: string): void {
  ensureOmm();

  const resolvedSlug = slug || path.basename(process.cwd());

  const configPath = path.join(getOmmDir(), 'config.yaml');
  let config: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    config = (YAML.parse(raw) as Record<string, unknown>) || {};
  }

  config.cloud = {
    ...(config.cloud as Record<string, unknown> | undefined),
    project_slug: resolvedSlug,
  };

  fs.writeFileSync(configPath, YAML.stringify(config), 'utf-8');
  process.stderr.write(`Linked to ${resolvedSlug}. Run 'omm push' to upload.\n`);
}
