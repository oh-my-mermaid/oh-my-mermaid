import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CREDENTIALS_DIR = path.join(os.homedir(), '.omm');
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.json');
const DEFAULT_API_URL = 'https://ohmymermaid.com';

export function getCredentialsPath(): string {
  return CREDENTIALS_FILE;
}

export function getApiUrl(): string {
  return process.env.OMM_API_URL || DEFAULT_API_URL;
}

export function getToken(): string | null {
  if (!fs.existsSync(CREDENTIALS_FILE)) return null;
  try {
    const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    const data = JSON.parse(raw) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  if (!fs.existsSync(CREDENTIALS_DIR)) {
    fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
  }
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({ token }, null, 2), 'utf-8');
}

export function deleteToken(): void {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
  }
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
