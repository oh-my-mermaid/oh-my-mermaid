import { ALL_PLATFORMS, getPlatformById, getDetectedPlatforms } from '../lib/platforms/index.js';

export async function commandSetup(args: string[]): Promise<void> {
  const teardown = args.includes('--teardown');
  const listOnly = args.includes('--list');
  const platformId = args.find(a => !a.startsWith('--'));

  // omm setup --list
  if (listOnly) {
    process.stderr.write('Detected platforms:\n');
    for (const p of ALL_PLATFORMS) {
      const detected = p.detect();
      const setup = detected && p.isSetup();
      const status = !detected ? 'not installed' : setup ? 'ready' : 'not configured';
      process.stderr.write(`  ${detected ? '●' : '○'} ${p.name} (${p.id}) — ${status}\n`);
    }
    return;
  }

  // omm setup <platform>
  if (platformId) {
    const platform = getPlatformById(platformId);
    if (!platform) {
      process.stderr.write(`error: unknown platform '${platformId}'. Available: ${ALL_PLATFORMS.map(p => p.id).join(', ')}\n`);
      process.exit(1);
    }
    if (!platform.detect()) {
      process.stderr.write(`error: ${platform.name} is not installed on this machine.\n`);
      process.exit(1);
    }
    if (teardown) {
      platform.teardown();
      process.stderr.write(`${platform.name}: teardown complete.\n`);
    } else {
      if (platform.isSetup()) {
        process.stderr.write(`${platform.name}: already configured.\n`);
        return;
      }
      process.stderr.write(`${platform.name}: setting up...\n`);
      await platform.setup();
    }
    return;
  }

  // omm setup (auto-detect all)
  const detected = getDetectedPlatforms();

  if (detected.length === 0) {
    process.stderr.write('No supported AI coding tools detected.\n');
    process.stderr.write('Supported: ' + ALL_PLATFORMS.map(p => p.name).join(', ') + '\n');
    return;
  }

  for (const platform of detected) {
    if (teardown) {
      platform.teardown();
      process.stderr.write(`${platform.name}: teardown complete.\n`);
      continue;
    }
    if (platform.isSetup()) {
      process.stderr.write(`${platform.name}: already configured.\n`);
      continue;
    }
    process.stderr.write(`${platform.name}: setting up...\n`);
    await platform.setup();
  }

  process.stderr.write('\nomm setup complete.\n');
}
