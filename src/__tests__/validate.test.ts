import { describe, it, expect } from 'vitest';
import { validateDiagram } from '../lib/validate.js';

describe('validateDiagram', () => {
  it('passes a valid diagram with no issues', () => {
    const diagram = [
      'graph LR',
      '    client["Client\\nsrc/client/index.ts"] -->|"sends request"| api["API\\nsrc/api/"]',
      '    api -->|"queries"| db["Database\\nsrc/db/"]',
      '    db -->|"returns rows"| api',
      '    api -->|"JSON response"| client',
      '    client -->|"renders"| ui["UI\\nsrc/ui/"]',
    ].join('\n');
    const result = validateDiagram(diagram);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('errors on missing graph declaration', () => {
    const diagram = `client["Client"] --> api["API"]`;
    const result = validateDiagram(diagram);
    expect(result.valid).toBe(false);
    const issue = result.issues.find(i => i.rule === 'graph-declaration');
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('error');
  });

  it('errors on unbalanced brackets (quote-aware)', () => {
    const diagram = `graph LR
    A["unclosed`;
    const result = validateDiagram(diagram);
    expect(result.valid).toBe(false);
    const issue = result.issues.find(i => i.rule === 'balanced-brackets');
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('error');
  });

  it('does not false-positive on brackets inside quotes', () => {
    const diagram = `graph LR
    A["Label with [brackets] inside"] -->|"some (label)"| B["Other"]`;
    const result = validateDiagram(diagram);
    const bracketIssue = result.issues.find(i => i.rule === 'balanced-brackets');
    expect(bracketIssue).toBeUndefined();
  });

  it('warns on edge without label (-->, ==>, -.->)', () => {
    const diagram = [
      'graph LR',
      '    A["Svc A\\nsrc/a.ts"] --> B["Svc B\\nsrc/b.ts"]',
      '    B ==> C["Svc C\\nsrc/c.ts"]',
    ].join('\n');
    const result = validateDiagram(diagram);
    const edgeIssues = result.issues.filter(i => i.rule === 'edge-label');
    expect(edgeIssues.length).toBe(2);
    expect(edgeIssues[0].level).toBe('warning');
  });

  it('errors on @ref to nonexistent class', () => {
    const diagram = `graph LR
    A["@ghost-class"]`;
    const result = validateDiagram(diagram, { className: 'overview', allClasses: ['overview', 'auth'] });
    expect(result.valid).toBe(false);
    const issue = result.issues.find(i => i.rule === 'ref-exists');
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('error');
  });

  it('errors on self @ref', () => {
    const diagram = `graph LR
    A["@auth-flow"]`;
    const result = validateDiagram(diagram, { className: 'auth-flow', allClasses: ['auth-flow', 'overview'] });
    expect(result.valid).toBe(false);
    const issue = result.issues.find(i => i.rule === 'ref-self');
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('error');
  });

  it('allows general cycles (not self-ref)', () => {
    const diagramA = `graph LR
    X["@class-b"]`;
    // class-a references class-b — this is fine even if class-b references class-a
    const result = validateDiagram(diagramA, { className: 'class-a', allClasses: ['class-a', 'class-b'] });
    const circularIssue = result.issues.find(i => i.rule === 'ref-self');
    expect(circularIssue).toBeUndefined();
  });

  it('warns on invalid classDef name', () => {
    const diagram = [
      'graph LR',
      '    A["Svc\\nsrc/a.ts"] -->|"calls"| B["Svc\\nsrc/b.ts"]',
      '    classDef highlight fill:#ff0,stroke:#ff0,color:#000',
    ].join('\n');
    const result = validateDiagram(diagram);
    const issue = result.issues.find(i => i.rule === 'classdef-name');
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('warning');
  });

  it('warns on wrong classDef color (checks declared attributes only)', () => {
    const diagram = [
      'graph LR',
      '    A["Svc\\nsrc/a.ts"] -->|"calls"| B["Svc\\nsrc/b.ts"]',
      '    classDef external fill:#ffffff,stroke:#585b70,color:#cdd6f4',
    ].join('\n');
    const result = validateDiagram(diagram);
    const issue = result.issues.find(i => i.rule === 'classdef-color');
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('warning');
  });

  it('passes classDef with correct colors in any attribute order', () => {
    const diagram = [
      'graph LR',
      '    A["Svc\\nsrc/a.ts"] -->|"calls"| B["Svc\\nsrc/b.ts"]',
      '    classDef external color:#cdd6f4,fill:#585b70,stroke:#585b70',
    ].join('\n');
    const result = validateDiagram(diagram);
    const colorIssue = result.issues.find(i => i.rule === 'classdef-color');
    expect(colorIssue).toBeUndefined();
  });

  it('warns on too many nodes', () => {
    const nodes = Array.from({ length: 20 }, (_, i) => `    N${i}["Node ${i}\\nsrc/${i}.ts"]`).join('\n');
    const diagram = `graph LR\n${nodes}`;
    const result = validateDiagram(diagram);
    const issue = result.issues.find(i => i.rule === 'node-count');
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('warning');
  });

  it('warns on too few nodes', () => {
    const diagram = [
      'graph LR',
      '    A["Only\\nsrc/a.ts"] -->|"calls"| B["Two\\nsrc/b.ts"]',
    ].join('\n');
    const result = validateDiagram(diagram);
    const issue = result.issues.find(i => i.rule === 'node-count');
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('warning');
  });

  it('skips ref checks when no context provided', () => {
    const diagram = `graph LR
    A["@some-class"]`;
    const result = validateDiagram(diagram);
    const refIssues = result.issues.filter(i => i.rule === 'ref-exists' || i.rule === 'ref-self');
    expect(refIssues).toHaveLength(0);
  });
});
