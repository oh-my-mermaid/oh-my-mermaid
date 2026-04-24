import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hasCommand = vi.fn();
const getSkillsSource = vi.fn();

vi.mock('../lib/platforms/utils.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/platforms/utils.js')>('../lib/platforms/utils.js');
  return {
    ...actual,
    hasCommand,
    getSkillsSource,
  };
});

describe('hermes platform', () => {
  let tmpDir: string;
  let originalHome: string | undefined;
  let originalUserProfile: string | undefined;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omm-hermes-'));
    originalHome = process.env.HOME;
    originalUserProfile = process.env.USERPROFILE;
    process.env.HOME = tmpDir;
    process.env.USERPROFILE = tmpDir;
    vi.resetModules();
    hasCommand.mockReset();
    getSkillsSource.mockReset();
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    process.env.USERPROFILE = originalUserProfile;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('detect() returns false when the hermes binary is not installed', async () => {
    hasCommand.mockReturnValue(false);

    const { hermes } = await import('../lib/platforms/hermes.js');

    expect(hermes.detect()).toBe(false);
  });

  it('detect() returns true when hasCommand reports true', async () => {
    hasCommand.mockReturnValue(true);

    const { hermes } = await import('../lib/platforms/hermes.js');

    expect(hermes.detect()).toBe(true);
  });

  it('isSetup() returns false when the skills symlink is absent', async () => {
    const { hermes } = await import('../lib/platforms/hermes.js');

    expect(hermes.isSetup()).toBe(false);
  });

  it('isSetup() returns true after setup() creates the symlink', async () => {
    const sourceDir = path.join(tmpDir, 'source-skills');
    fs.mkdirSync(sourceDir, { recursive: true });
    getSkillsSource.mockReturnValue(sourceDir);

    const { hermes } = await import('../lib/platforms/hermes.js');
    await hermes.setup();

    const targetPath = path.join(tmpDir, '.hermes', 'skills', 'oh-my-mermaid');
    expect(hermes.isSetup()).toBe(true);
    expect(fs.lstatSync(targetPath).isSymbolicLink()).toBe(true);
    expect(fs.readlinkSync(targetPath)).toBe(sourceDir);
  });

  it('teardown() removes the symlink', async () => {
    const sourceDir = path.join(tmpDir, 'source-skills');
    fs.mkdirSync(sourceDir, { recursive: true });
    getSkillsSource.mockReturnValue(sourceDir);

    const { hermes } = await import('../lib/platforms/hermes.js');
    await hermes.setup();

    const targetPath = path.join(tmpDir, '.hermes', 'skills', 'oh-my-mermaid');
    expect(fs.existsSync(targetPath)).toBe(true);

    hermes.teardown();

    expect(fs.existsSync(targetPath)).toBe(false);
  });
});
