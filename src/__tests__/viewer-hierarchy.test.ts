import { describe, expect, it } from 'vitest';
import { buildViewerHierarchy } from '../lib/viewer-hierarchy.js';

describe('buildViewerHierarchy', () => {
  it('prefers direct overall-architecture children over transitive referrers', () => {
    const classes = [
      'overall-architecture',
      'cli-shell',
      'browser',
      'gateway-runtime',
      'channels',
      'commands',
      'plugins-extensions',
      'memory',
      'config',
      'infra',
    ];

    const refsData = {
      'overall-architecture': {
        outgoing: [
          { target_class: 'cli-shell' },
          { target_class: 'browser' },
          { target_class: 'gateway-runtime' },
          { target_class: 'channels' },
          { target_class: 'commands' },
          { target_class: 'plugins-extensions' },
          { target_class: 'memory' },
          { target_class: 'config' },
          { target_class: 'infra' },
        ],
      },
      'cli-shell': { outgoing: [{ target_class: 'browser' }, { target_class: 'gateway-runtime' }] },
      'gateway-runtime': { outgoing: [{ target_class: 'channels' }, { target_class: 'browser' }] },
      commands: { outgoing: [] },
      'plugins-extensions': { outgoing: [{ target_class: 'memory' }] },
      memory: { outgoing: [{ target_class: 'config' }, { target_class: 'infra' }] },
      browser: { outgoing: [] },
      channels: { outgoing: [] },
      config: { outgoing: [] },
      infra: { outgoing: [] },
    } as const;

    const hierarchy = buildViewerHierarchy(classes, refsData);

    expect(hierarchy.roots).toEqual(['overall-architecture']);
    expect(hierarchy.parentByClass.browser).toBe('overall-architecture');
    expect(hierarchy.parentByClass['gateway-runtime']).toBe('overall-architecture');
    expect(hierarchy.parentByClass.channels).toBe('overall-architecture');
    expect(hierarchy.parentByClass.memory).toBe('overall-architecture');
    expect(hierarchy.parentByClass.config).toBe('overall-architecture');
    expect(hierarchy.parentByClass.infra).toBe('overall-architecture');
    expect(hierarchy.childrenByClass['overall-architecture']).toEqual([
      'cli-shell',
      'browser',
      'gateway-runtime',
      'channels',
      'commands',
      'plugins-extensions',
      'memory',
      'config',
      'infra',
    ]);
    expect(hierarchy.childrenByClass['cli-shell']).toEqual([]);
    expect(hierarchy.childrenByClass.memory).toEqual([]);
  });

  it('falls back to no-incoming roots when overall-architecture is absent', () => {
    const classes = ['cli-shell', 'commands', 'gateway-runtime', 'agents-core'];
    const refsData = {
      'cli-shell': { outgoing: [{ target_class: 'gateway-runtime' }] },
      commands: { outgoing: [{ target_class: 'agents-core' }] },
      'gateway-runtime': { outgoing: [] },
      'agents-core': { outgoing: [] },
    } as const;

    const hierarchy = buildViewerHierarchy(classes, refsData);

    expect(hierarchy.roots).toEqual(['cli-shell', 'commands']);
    expect(hierarchy.childrenByClass['cli-shell']).toEqual(['gateway-runtime']);
    expect(hierarchy.childrenByClass.commands).toEqual(['agents-core']);
  });

  it('surfaces disconnected classes as additional roots', () => {
    const classes = ['overall-architecture', 'cli-shell', 'browser', 'orphan'];
    const refsData = {
      'overall-architecture': { outgoing: [{ target_class: 'cli-shell' }] },
      'cli-shell': { outgoing: [{ target_class: 'browser' }] },
      browser: { outgoing: [] },
      orphan: { outgoing: [] },
    } as const;

    const hierarchy = buildViewerHierarchy(classes, refsData);

    expect(hierarchy.roots).toEqual(['overall-architecture', 'orphan']);
    expect(hierarchy.parentByClass.orphan).toBeNull();
  });
});
