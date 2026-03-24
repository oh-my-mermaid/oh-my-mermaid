import path from 'node:path';
import os from 'node:os';
import { describe, expect, it } from 'vitest';
import { resolvePullDestination } from '../lib/cloud-paths.js';

describe('resolvePullDestination', () => {
  const ommDir = path.join(os.tmpdir(), 'omm-path-test', '.omm');

  it('allows safe paths inside the .omm directory', () => {
    expect(resolvePullDestination(ommDir, 'config.yaml')).toBe(path.join(ommDir, 'config.yaml'));
    expect(resolvePullDestination(ommDir, 'service/description.md')).toBe(
      path.join(ommDir, 'service', 'description.md'),
    );
  });

  it('rejects paths that escape the .omm directory', () => {
    expect(() => resolvePullDestination(ommDir, '../secrets.txt')).toThrow(/unsafe file path/i);
    expect(() => resolvePullDestination(ommDir, '/tmp/evil')).toThrow(/unsafe file path/i);
    expect(() => resolvePullDestination(ommDir, 'service/../../evil')).toThrow(/unsafe file path/i);
  });
});
