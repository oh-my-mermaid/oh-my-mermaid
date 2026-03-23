import { getToken, getHandle, getDefaultOrg, saveDefaultOrg, apiRequest } from '../lib/cloud.js';

export async function commandOrg(subcommand?: string, arg?: string): Promise<void> {
  const token = getToken();
  if (!token) {
    process.stderr.write("error: not logged in. Run 'omm login' first.\n");
    process.exit(1);
  }

  switch (subcommand) {
    case 'list':
      await orgList();
      return;
    case 'switch':
      await orgSwitch(arg);
      return;
    case 'members':
      await orgMembers(arg);
      return;
    default:
      printOrgHelp();
      return;
  }
}

async function orgList(): Promise<void> {
  const res = await apiRequest('GET', '/api/cli/orgs');
  if (!res.ok) {
    process.stderr.write(`error: failed to fetch orgs (${res.status})\n`);
    process.exit(1);
  }

  const data = await res.json() as {
    orgs?: Array<{ slug: string; name: string; plan: string; role: string; is_personal: boolean }>
    handle?: string
  };

  const orgs = data.orgs ?? [];
  const defaultOrg = getDefaultOrg();

  if (orgs.length === 0) {
    process.stderr.write('No organizations found.\n');
    return;
  }

  for (const org of orgs) {
    const isDefault = org.slug === defaultOrg;
    const marker = isDefault ? '* ' : '  ';
    const label = org.is_personal ? ' (personal)' : '';
    process.stdout.write(`${marker}${org.slug}${label} [${org.plan}] — ${org.role}\n`);
  }

  process.stderr.write(`\n* = active org. Use 'omm org switch <slug>' to change.\n`);
}

async function orgSwitch(slug?: string): Promise<void> {
  if (!slug) {
    process.stderr.write("error: omm org switch <slug>\n");
    process.exit(1);
  }

  // Validate the org exists and user has access
  const res = await apiRequest('GET', '/api/cli/orgs');
  if (res.ok) {
    const data = await res.json() as { orgs?: Array<{ slug: string }> };
    const orgs = data.orgs ?? [];
    if (!orgs.some(o => o.slug === slug)) {
      process.stderr.write(`error: org '${slug}' not found or you don't have access.\n`);
      process.exit(1);
    }
  }

  saveDefaultOrg(slug);
  process.stderr.write(`Switched to org: ${slug}\n`);
}

async function orgMembers(slug?: string): Promise<void> {
  const orgSlug = slug ?? getDefaultOrg();
  if (!orgSlug) {
    process.stderr.write("error: specify an org or set a default with 'omm org switch <slug>'\n");
    process.exit(1);
  }

  // This endpoint requires Supabase session token, not CLI token.
  // For now, show a message directing to the web UI.
  process.stderr.write(`View members at: ${process.env.OMM_API_URL || 'https://ohmymermaid.com'}/org/${orgSlug}/settings\n`);
}

function printOrgHelp(): void {
  const help = `
omm org — Manage organizations

Usage:
  omm org list               List your organizations
  omm org switch <slug>      Set default organization for push/pull
  omm org members [slug]     View members (opens web)
`;
  process.stdout.write(help.trim() + '\n');
}
