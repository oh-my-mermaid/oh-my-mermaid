import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { getApiUrl, getDefaultOrg } from '../lib/cloud.js';
import { ensureOmmForRead, getOmmDir } from '../lib/store.js';

export function commandShare(): void {
  if (!ensureOmmForRead()) return;

  const configPath = path.join(getOmmDir(), 'config.yaml');
  if (!fs.existsSync(configPath)) {
    process.stderr.write("error: .omm/config.yaml not found. Run /omm-scan in Claude Code first.\n");
    process.exit(1);
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  const config = YAML.parse(raw) as Record<string, unknown>;
  const cloud = config.cloud as Record<string, unknown> | undefined;
  const slug = cloud?.project_slug as string | undefined;
  const orgSlug = (cloud?.org_slug as string | undefined) ?? getDefaultOrg() ?? undefined;

  if (!slug) {
    process.stderr.write("error: no project slug set. Run 'omm link' first.\n");
    process.exit(1);
  }

  if (!orgSlug) {
    process.stderr.write("warning: no org set. URL may be incomplete. Run 'omm org switch <slug>' or 'omm link org/project'.\n");
  }
  const urlPath = orgSlug ? `/p/${orgSlug}/${slug}` : `/p/${slug}`;
  const viewUrl = `${getApiUrl()}${urlPath}`;
  process.stdout.write(`View:         ${viewUrl}\n`);
  process.stdout.write(`Public share: use the Share button on the dashboard (Personal/Team)\n`);
}
