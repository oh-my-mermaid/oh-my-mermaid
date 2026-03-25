import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import YAML from 'yaml';
import { ensureOmmForWrite, getOmmDir } from '../lib/store.js';
import { getToken, getDefaultOrg, getApiUrl, apiRequest } from '../lib/cloud.js';

interface OrgInfo {
  slug: string;
  name: string;
  plan: string;
  role: string;
  is_personal: boolean;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function fetchOrgs(): Promise<OrgInfo[]> {
  const res = await apiRequest('GET', '/api/cli/orgs');
  if (!res.ok) {
    process.stderr.write(`error: failed to fetch organizations (${res.status})\n`);
    process.exit(1);
  }
  const data = await res.json() as { orgs?: OrgInfo[] };
  return data.orgs ?? [];
}

async function selectOrg(): Promise<string> {
  const orgs = await fetchOrgs();

  if (orgs.length === 0) {
    const apiUrl = getApiUrl();
    process.stderr.write(
      `error: no organizations found.\n` +
      `Set your handle at ${apiUrl}/auth/login to create your personal organization.\n`
    );
    process.exit(1);
  }

  if (orgs.length === 1) {
    process.stderr.write(`Using org: ${orgs[0].slug}\n`);
    return orgs[0].slug;
  }

  // Multiple orgs — let user pick
  const defaultOrg = getDefaultOrg();
  process.stderr.write(`\nSelect an organization:\n\n`);
  for (let i = 0; i < orgs.length; i++) {
    const org = orgs[i];
    const marker = org.slug === defaultOrg ? '*' : ' ';
    const label = org.is_personal ? ' (personal)' : '';
    process.stderr.write(`  ${marker} ${i + 1}) ${org.slug}${label} [${org.plan}]\n`);
  }
  process.stderr.write('\n');

  const answer = await prompt(`Enter number (1-${orgs.length}): `);
  const idx = parseInt(answer, 10) - 1;

  if (isNaN(idx) || idx < 0 || idx >= orgs.length) {
    process.stderr.write('error: invalid selection.\n');
    process.exit(1);
  }

  return orgs[idx].slug;
}

export async function commandLink(input?: string): Promise<void> {
  ensureOmmForWrite();

  const token = getToken();
  if (!token) {
    process.stderr.write("error: not logged in. Run 'omm login' first.\n");
    process.exit(1);
  }

  let orgSlug: string;
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
    // Project slug from input or cwd name
    projectSlug = input || path.basename(process.cwd());
    // Select org interactively
    orgSlug = await selectOrg();
  }

  const configPath = path.join(getOmmDir(), 'config.yaml');
  let config: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    config = (YAML.parse(raw) as Record<string, unknown>) || {};
  }

  config.cloud = {
    ...(config.cloud as Record<string, unknown> | undefined),
    project_slug: projectSlug,
    org_slug: orgSlug,
  };

  fs.writeFileSync(configPath, YAML.stringify(config), 'utf-8');

  process.stderr.write(`Linked to ${orgSlug}/${projectSlug}. Run 'omm push' to upload.\n`);
}
