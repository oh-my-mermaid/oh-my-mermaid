/**
 * omm config <key> [value] — read/write project config (.omm/config.yaml)
 *
 * Usage:
 *   omm config                  Show all config
 *   omm config language         Show language setting
 *   omm config language ko      Set language to ko
 */

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ensureOmmForWrite, getOmmDir } from '../lib/store.js';
import type { OmmConfig } from '../types.js';

const CONFIG_FILE = 'config.yaml';

function readConfig(cwd?: string): OmmConfig {
  const filePath = path.join(getOmmDir(cwd), CONFIG_FILE);
  if (!fs.existsSync(filePath)) return { version: '0.1.0' };
  return YAML.parse(fs.readFileSync(filePath, 'utf-8')) as OmmConfig;
}

function writeConfig(config: OmmConfig, cwd?: string): void {
  ensureOmmForWrite(cwd);
  const filePath = path.join(getOmmDir(cwd), CONFIG_FILE);
  fs.writeFileSync(filePath, YAML.stringify(config), 'utf-8');
}

export function commandConfig(args: string[]): void {
  const key = args[0];
  const value = args[1];

  // omm config — show all
  if (!key) {
    const config = readConfig();
    process.stdout.write(YAML.stringify(config));
    return;
  }

  // omm config <key> — read
  if (!value) {
    const config = readConfig();
    const val = (config as Record<string, unknown>)[key];
    if (val !== undefined) {
      process.stdout.write(String(val) + '\n');
    } else {
      // Show defaults
      const defaults: Record<string, string> = { language: 'English' };
      process.stdout.write((defaults[key] ?? '(not set)') + '\n');
    }
    return;
  }

  // omm config <key> <value> — write
  const config = readConfig();
  (config as Record<string, unknown>)[key] = value;
  writeConfig(config);
  process.stderr.write(`config: ${key}=${value}\n`);
}
