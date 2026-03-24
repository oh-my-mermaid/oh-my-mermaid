import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { getToken, getDefaultOrg, apiRequest } from '../lib/cloud.js';
import { ensureOmmForWrite, getOmmDir } from '../lib/store.js';
import { resolvePullDestination } from '../lib/cloud-paths.js';

export async function commandPull(): Promise<void> {
  ensureOmmForWrite();

  const token = getToken();
  if (!token) {
    process.stderr.write("error: not logged in. Run 'omm login' first.\n");
    process.exit(1);
  }

  const ommDir = getOmmDir();
  const configPath = path.join(ommDir, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    process.stderr.write("error: .omm/config.yaml not found.\n");
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

  let queryParams = `slug=${encodeURIComponent(slug)}`;
  if (orgSlug) {
    queryParams += `&org_slug=${encodeURIComponent(orgSlug)}`;
  }

  const res = await apiRequest('GET', `/api/pull?${queryParams}`);

  if (!res.ok) {
    const text = await res.text();
    process.stderr.write(`error: pull failed (${res.status}): ${text}\n`);
    process.exit(1);
  }

  const data = await res.json() as { files?: Array<{ path: string; content: string }> };
  const files = data.files ?? [];

  for (const file of files) {
    const dest = resolvePullDestination(ommDir, file.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, file.content, 'utf-8');
  }

  process.stderr.write(`Pulled ${files.length} files from cloud\n`);
}
