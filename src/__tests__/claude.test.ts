import { execSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getPackageVersion = vi.fn();

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('../lib/platforms/utils.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/platforms/utils.js')>(
    '../lib/platforms/utils.js',
  );
  return {
    ...actual,
    getPackageVersion,
  };
});

describe('claude platform version-aware setup detection', () => {
  beforeEach(() => {
    vi.mocked(execSync).mockReset();
    getPackageVersion.mockReset();
    getPackageVersion.mockReturnValue('0.2.0');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when claude plugin list is unavailable', async () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('claude not available');
    });

    const { claude } = await import('../lib/platforms/claude.js');

    expect(claude.isSetup()).toBe(false);
  });

  it('returns false when the installed Claude plugin version is stale', async () => {
    vi.mocked(execSync).mockReturnValue(
      Buffer.from('oh-my-mermaid\n  Version: 0.1.9\n'),
    );

    const { claude } = await import('../lib/platforms/claude.js');

    expect(claude.isSetup()).toBe(false);
  });

  it('ignores oh-my-claudecode entries when checking setup state', async () => {
    vi.mocked(execSync).mockReturnValue(
      Buffer.from('oh-my-claudecode\n  Version: 0.2.0\nanother-plugin\n  Version: 0.2.0\n'),
    );

    const { claude } = await import('../lib/platforms/claude.js');

    expect(claude.isSetup()).toBe(false);
  });

  it('returns true when the installed Claude plugin version matches the package version', async () => {
    vi.mocked(execSync).mockReturnValue(
      Buffer.from('oh-my-mermaid\n  Version: 0.2.0\n'),
    );

    const { claude } = await import('../lib/platforms/claude.js');

    expect(claude.isSetup()).toBe(true);
  });
});
