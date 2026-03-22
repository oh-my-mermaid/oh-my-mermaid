import { deleteToken } from '../lib/cloud.js';

export function commandLogout(): void {
  deleteToken();
  process.stderr.write('Logged out\n');
}
