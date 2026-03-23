import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ensureOmmForWrite, getOmmDir } from '../lib/store.js';
import { getDefaultOrg } from '../lib/cloud.js';

export function commandLink(input?: string): void {
  ensureOmmForWrite();

  let orgSlug: string | undefined;
  let projectSlug: string;

  if (input && input.includes('/')) {
    // Format: org_slug/project_slug
    const parts = input.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      process.stderr.write("error: format must be 'org_slug/project_slug'\n");
      process.exit(1);
    }
    orgSlug = parts[0];
    projectSlug = parts[1];
  } else {
    // Just project slug — use default org
    projectSlug = input || path.basename(process.cwd());
    orgSlug = getDefaultOrg() ?? undefined;
  }

  const configPath = path.join(getOmmDir(), 'config.yaml');
  let config: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    config = (YAML.parse(raw) as Record<string, unknown>) || {};
  }

  const cloudConfig: Record<string, unknown> = {
    ...(config.cloud as Record<string, unknown> | undefined),
    project_slug: projectSlug,
  };
  if (orgSlug) {
    cloudConfig.org_slug = orgSlug;
  }
  config.cloud = cloudConfig;

  fs.writeFileSync(configPath, YAML.stringify(config), 'utf-8');

  const display = orgSlug ? `${orgSlug}/${projectSlug}` : projectSlug;
  process.stderr.write(`Linked to ${display}. Run 'omm push' to upload.\n`);
}
