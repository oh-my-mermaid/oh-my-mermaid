import type { Platform } from './types.js';
import { claude } from './claude.js';
import { codex } from './codex.js';
import { cursor } from './cursor.js';
import { openclaw } from './openclaw.js';
import { antigravity } from './antigravity.js';
import { hermes } from './hermes.js';

export type { Platform };

export const ALL_PLATFORMS: Platform[] = [claude, codex, cursor, openclaw, antigravity, hermes];

export function getPlatformById(id: string): Platform | undefined {
  return ALL_PLATFORMS.find(p => p.id === id);
}

export function getDetectedPlatforms(): Platform[] {
  return ALL_PLATFORMS.filter(p => p.detect());
}
