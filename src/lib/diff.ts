import type { DiffResult } from '../types.js';

interface MermaidElement {
  nodes: Set<string>;
  edges: Set<string>;
}

/**
 * Lightweight mermaid parser — extracts node IDs and edges from mermaid text.
 * Handles: graph/flowchart LR/TD/TB, subgraph, and common arrow syntaxes.
 */
export function parseMermaid(text: string): MermaidElement {
  const nodes = new Set<string>();
  const edges = new Set<string>();

  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));

  for (const line of lines) {
    // Skip directives, classDef, click, style, etc.
    if (/^(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|gantt|pie|gitGraph)/i.test(line)) continue;
    if (/^(classDef|class |click |style |linkStyle|subgraph|end$)/i.test(line)) continue;
    if (/^%%\{/.test(line)) continue;

    // Match edges: A --> B, A -->|label| B, A -- text --> B, etc.
    const edgePattern = /^(\S+?)(?:\[.*?\]|(?:\(.*?\))|\{.*?\}|>.*?])?(\s*)(-->|--o|--x|---|-.->|==>|~~>|--\|.*?\|)(\s*)(\S+?)(?:\[.*?\]|(?:\(.*?\))|\{.*?\}|>.*?])?$/;
    const edgeMatch = line.match(edgePattern);
    if (edgeMatch) {
      const [, src, , arrow, , dst] = edgeMatch;
      const srcId = src.replace(/["']/g, '');
      const dstId = dst.replace(/["']/g, '');
      nodes.add(srcId);
      nodes.add(dstId);
      edges.add(`${srcId} ${arrow} ${dstId}`);
      continue;
    }

    // Broader edge match for complex syntax: A[Label] --> B[Label]
    const broadEdge = /^([^\s[\]({]+).*?(-->|--o|--x|---|-.->|==>|~~>).*?([^\s[\]({]+)/;
    const broadMatch = line.match(broadEdge);
    if (broadMatch) {
      const [, src, arrow, dst] = broadMatch;
      const srcId = src.replace(/["']/g, '');
      const dstId = dst.replace(/["']/g, '');
      nodes.add(srcId);
      nodes.add(dstId);
      edges.add(`${srcId} ${arrow} ${dstId}`);
      continue;
    }

    // Standalone node: A[Label] or A((Label)) or A{Label}
    const nodeMatch = line.match(/^([^\s[\]({]+)[\[({]/);
    if (nodeMatch) {
      nodes.add(nodeMatch[1].replace(/["']/g, ''));
    }
  }

  return { nodes, edges };
}

export function diffMermaid(before: string, after: string): DiffResult {
  const prev = parseMermaid(before);
  const curr = parseMermaid(after);

  const added_nodes = [...curr.nodes].filter(n => !prev.nodes.has(n));
  const removed_nodes = [...prev.nodes].filter(n => !curr.nodes.has(n));
  const added_edges = [...curr.edges].filter(e => !prev.edges.has(e));
  const removed_edges = [...prev.edges].filter(e => !curr.edges.has(e));

  return {
    added_nodes,
    removed_nodes,
    added_edges,
    removed_edges,
    has_changes: added_nodes.length > 0 || removed_nodes.length > 0 || added_edges.length > 0 || removed_edges.length > 0,
  };
}

export function formatDiff(diff: DiffResult): string {
  if (!diff.has_changes) return 'No changes detected.\n';

  const lines: string[] = [];
  if (diff.added_nodes.length) {
    lines.push('Added nodes:');
    diff.added_nodes.forEach(n => lines.push(`  + ${n}`));
  }
  if (diff.removed_nodes.length) {
    lines.push('Removed nodes:');
    diff.removed_nodes.forEach(n => lines.push(`  - ${n}`));
  }
  if (diff.added_edges.length) {
    lines.push('Added edges:');
    diff.added_edges.forEach(e => lines.push(`  + ${e}`));
  }
  if (diff.removed_edges.length) {
    lines.push('Removed edges:');
    diff.removed_edges.forEach(e => lines.push(`  - ${e}`));
  }
  return lines.join('\n') + '\n';
}
