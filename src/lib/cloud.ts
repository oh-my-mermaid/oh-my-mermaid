import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CREDENTIALS_DIR = path.join(os.homedir(), '.omm');
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.json');
const DEFAULT_API_URL = 'https://ohmymermaid.com';

interface Credentials {
  token?: string;
  handle?: string;
  default_org?: string;
}

export function getCredentialsPath(): string {
  return CREDENTIALS_FILE;
}

export function getApiUrl(): string {
  return process.env.OMM_API_URL || DEFAULT_API_URL;
}

function readCredentials(): Credentials {
  if (!fs.existsSync(CREDENTIALS_FILE)) return {};
  try {
    const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(raw) as Credentials;
  } catch {
    return {};
  }
}

function writeCredentials(creds: Credentials): void {
  if (!fs.existsSync(CREDENTIALS_DIR)) {
    fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
  }
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), { encoding: 'utf-8', mode: 0o600 });
}

export function getToken(): string | null {
  return readCredentials().token ?? null;
}

export function getHandle(): string | null {
  return readCredentials().handle ?? null;
}

export function getDefaultOrg(): string | null {
  return readCredentials().default_org ?? null;
}

export function saveToken(token: string): void {
  const creds = readCredentials();
  creds.token = token;
  writeCredentials(creds);
}

export function saveHandle(handle: string): void {
  const creds = readCredentials();
  creds.handle = handle;
  if (!creds.default_org) {
    creds.default_org = handle;
  }
  writeCredentials(creds);
}

export function saveDefaultOrg(orgSlug: string): void {
  const creds = readCredentials();
  creds.default_org = orgSlug;
  writeCredentials(creds);
}

export function deleteToken(): void {
  const creds = readCredentials();
  delete creds.token;
  writeCredentials(creds);
}

export async function apiRequest(
  method: string,
  urlPath: string,
  body?: unknown,
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${getApiUrl()}${urlPath}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res;
}
