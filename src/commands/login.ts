import http from 'node:http';
import { execSync } from 'node:child_process';
import { getApiUrl, saveToken, saveHandle } from '../lib/cloud.js';

function findOpenPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = http.createServer();
    srv.listen(0, () => {
      const addr = srv.address();
      if (addr && typeof addr === 'object') {
        const port = addr.port;
        srv.close(() => resolve(port));
      } else {
        reject(new Error('Could not find open port'));
      }
    });
  });
}

export async function commandLogin(): Promise<void> {
  const apiUrl = getApiUrl();
  const port = await findOpenPort();
  const callbackUrl = `http://localhost:${port}/callback`;

  const tokenPromise = new Promise<{ token: string; handle?: string }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Login timed out (60s). Try again.'));
    }, 60_000);

    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${port}`);

      if (url.pathname === '/callback') {
        const token = url.searchParams.get('token');
        const handle = url.searchParams.get('handle');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html><body style="background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:32px;max-width:360px;width:100%;text-align:center">
              <h2 style="font-size:14px;font-weight:600;margin:0 0 8px">${token ? 'Login successful!' : 'Login failed.'}</h2>
              <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0">${token ? 'You can close this tab and return to your terminal.' : 'No token received.'}</p>
            </div>
          </body></html>
        `);

        clearTimeout(timeout);
        server.close();

        if (token) {
          resolve({ token, handle: handle ?? undefined });
        } else {
          reject(new Error('No token received'));
        }
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(port);
  });

  const authUrl = `${apiUrl}/auth/cli?callback=${encodeURIComponent(callbackUrl)}`;
  process.stderr.write(`Opening browser for login...\n`);
  try {
    execSync(`open "${authUrl}"`, { stdio: 'ignore' });
  } catch {
    process.stderr.write(`Could not open browser. Visit:\n${authUrl}\n`);
  }
  process.stderr.write(`Waiting for authentication...\n`);

  try {
    const { token, handle } = await tokenPromise;
    saveToken(token);
    if (handle) {
      saveHandle(handle);
    }
    process.stderr.write(`Logged in successfully${handle ? ` as @${handle}` : ''}\n`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`error: ${msg}\n`);
    process.exit(1);
  }
}
