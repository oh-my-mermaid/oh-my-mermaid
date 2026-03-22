import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { getToken, apiRequest } from '../lib/cloud.js';
import { ensureOmm, getOmmDir } from '../lib/store.js';

export async function commandPull(): Promise<void> {
  ensureOmm();

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

  if (!slug) {
    process.stderr.write("error: no project slug set. Run 'omm link' first.\n");
    process.exit(1);
  }

  const res = await apiRequest('GET', `/api/pull?slug=${encodeURIComponent(slug)}`);

  if (!res.ok) {
    const text = await res.text();
    process.stderr.write(`error: pull failed (${res.status}): ${text}\n`);
    process.exit(1);
  }

  const data = await res.json() as { files?: Array<{ path: string; content: string }> };
  const files = data.files ?? [];

  for (const file of files) {
    const dest = path.join(ommDir, file.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, file.content, 'utf-8');
  }

  process.stderr.write(`Pulled ${files.length} files from cloud\n`);
}
