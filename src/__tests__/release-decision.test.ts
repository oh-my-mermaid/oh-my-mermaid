import { describe, expect, it } from 'vitest';
import { decideReleaseAction } from '../../scripts/release-decision.js';

describe('decideReleaseAction', () => {
  it('skips only when version is unchanged and all artifacts already exist', () => {
    expect(decideReleaseAction({
      currentVersion: '0.1.6',
      previousVersion: '0.1.6',
      npmPublished: true,
      tagExists: true,
      releaseExists: true,
    })).toEqual({
      changed: false,
      shouldRelease: false,
      reason: 'version unchanged and release artifacts already exist',
    });
  });

  it('retries release when version is unchanged but npm publish is missing', () => {
    expect(decideReleaseAction({
      currentVersion: '0.1.6',
      previousVersion: '0.1.6',
      npmPublished: false,
      tagExists: false,
      releaseExists: false,
    })).toEqual({
      changed: false,
      shouldRelease: true,
      reason: 'release artifacts missing for current version',
    });
  });

  it('releases when version changed even if no artifacts exist yet', () => {
    expect(decideReleaseAction({
      currentVersion: '0.1.7',
      previousVersion: '0.1.6',
      npmPublished: false,
      tagExists: false,
      releaseExists: false,
    })).toEqual({
      changed: true,
      shouldRelease: true,
      reason: 'version changed',
    });
  });

  it('continues when some artifacts exist but others are missing', () => {
    expect(decideReleaseAction({
      currentVersion: '0.1.6',
      previousVersion: '0.1.6',
      npmPublished: true,
      tagExists: false,
      releaseExists: true,
    })).toEqual({
      changed: false,
      shouldRelease: true,
      reason: 'release artifacts missing for current version',
    });
  });
});
