import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import YAML from 'yaml';
import { getToken, getApiUrl, apiRequest } from '../lib/cloud.js';
import { ensureOmmForRead, getOmmDir } from '../lib/store.js';

function walkDir(dir: string, base: string): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath, base));
    } else {
      const relativePath = path.relative(base, fullPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      files.push({ path: relativePath, content });
    }
  }
  return files;
}

function getGitCommit(): string | undefined {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}

export async function commandPush(): Promise<void> {
  if (!ensureOmmForRead()) return;

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

  const files = walkDir(ommDir, ommDir);
  const git_commit = getGitCommit();

  process.stderr.write(`Pushing ${files.length} files to ${getApiUrl()}/p/${slug}...\n`);

  const res = await apiRequest('POST', '/api/push', { slug, files, git_commit });

  if (!res.ok) {
    const text = await res.text();
    process.stderr.write(`error: push failed (${res.status}): ${text}\n`);
    process.exit(1);
  }

  const data = await res.json() as { uploaded?: number; url?: string };
  const uploaded = data.uploaded ?? files.length;
  const url = data.url ?? `${getApiUrl()}/p/${slug}`;
  process.stdout.write(`Uploaded ${uploaded} files. View at: ${url}\n`);
}
