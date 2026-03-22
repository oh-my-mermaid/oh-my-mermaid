import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { getApiUrl } from '../lib/cloud.js';
import { ensureOmm, getOmmDir } from '../lib/store.js';

export function commandShare(): void {
  ensureOmm();

  const configPath = path.join(getOmmDir(), 'config.yaml');
  if (!fs.existsSync(configPath)) {
    process.stderr.write("error: .omm/config.yaml not found. Run 'omm init' first.\n");
    process.exit(1);
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  const config = YAML.parse(raw) as Record<string, unknown>;
  const cloud = config.cloud as Record<string, unknown> | undefined;
  const slug = cloud?.project_slug as string | undefined;

  if (!slug) {
    process.stderr.write("error: no project slug set. Run 'omm link' first.\n");
    process.exit(1);
  }

  const viewUrl = `${getApiUrl()}/p/${slug}`;
  process.stdout.write(`Owner view:  ${viewUrl}\n`);
  process.stdout.write(`Public share: use the Share button on the dashboard (Pro)\n`);
}
