import { describe, expect, it } from 'vitest';
import { syncHandleCredentials } from '../lib/cloud.js';

describe('syncHandleCredentials', () => {
  it('updates default_org when it still points at the old personal handle', () => {
    expect(syncHandleCredentials({
      handle: 'old-handle',
      default_org: 'old-handle',
      token: 'token',
    }, 'new-handle')).toEqual({
      handle: 'new-handle',
      default_org: 'new-handle',
      token: 'token',
    });
  });

  it('preserves a team default_org when the user intentionally switched away', () => {
    expect(syncHandleCredentials({
      handle: 'old-handle',
      default_org: 'acme-team',
      token: 'token',
    }, 'new-handle')).toEqual({
      handle: 'new-handle',
      default_org: 'acme-team',
      token: 'token',
    });
  });

  it('fills default_org for first-time credentials', () => {
    expect(syncHandleCredentials({}, 'new-handle')).toEqual({
      handle: 'new-handle',
      default_org: 'new-handle',
    });
  });
});
