import type { IncomingMessage, ServerResponse } from 'node:http';
import { listClasses, showClass, readMeta, readField, listNodes, showNode } from '../lib/store.js';
import { diffMermaid } from '../lib/diff.js';
import { getIncomingRefs, getOutgoingRefs } from '../lib/refs.js';

function json(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

export function handleApi(req: IncomingMessage, res: ServerResponse): boolean {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;

  // GET /api/classes
  if (path === '/api/classes') {
    json(res, listClasses());
    return true;
  }

  // GET /api/class/:name
  const classMatch = path.match(/^\/api\/class\/([^/]+)$/);
  if (classMatch) {
    const data = showClass(classMatch[1]);
    if (!data) {
      json(res, { error: 'class not found' }, 404);
    } else {
      json(res, data);
    }
    return true;
  }

  // GET /api/class/:name/diff
  const diffMatch = path.match(/^\/api\/class\/([^/]+)\/diff$/);
  if (diffMatch) {
    const className = diffMatch[1];
    const current = readField(className, 'diagram');
    const meta = readMeta(className);
    const prev = meta?.prev_diagram;
    if (!current || !prev) {
      json(res, { error: 'no diff available', has_changes: false });
    } else {
      const diff = diffMermaid(prev, current);
      json(res, { ...diff, prev_diagram: prev, current_diagram: current });
    }
    return true;
  }

  // GET /api/class/:name/refs
  const refsMatch = path.match(/^\/api\/class\/([^/]+)\/refs$/);
  if (refsMatch) {
    const className = refsMatch[1];
    const incoming = getIncomingRefs(className);
    const outgoing = getOutgoingRefs(className);
    json(res, { incoming, outgoing });
    return true;
  }

  // GET /api/class/:perspective/nodes
  const nodesMatch = path.match(/^\/api\/class\/([^/]+)\/nodes$/);
  if (nodesMatch) {
    const children = listNodes(nodesMatch[1]);
    json(res, { perspective: nodesMatch[1], children });
    return true;
  }

  // GET /api/class/:perspective/node/:path+
  const nodeMatch = path.match(/^\/api\/class\/([^/]+)\/node\/(.+)$/);
  if (nodeMatch) {
    const perspective = nodeMatch[1];
    const nodePath = nodeMatch[2].split('/');
    const lastSegment = nodePath[nodePath.length - 1];

    if (lastSegment === 'nodes') {
      const parentPath = nodePath.slice(0, -1);
      const children = listNodes(perspective, parentPath);
      json(res, { perspective, path: parentPath, children });
      return true;
    }

    const data = showNode(perspective, nodePath);
    if (!data) {
      json(res, { error: 'node not found' }, 404);
    } else {
      const children = listNodes(perspective, nodePath);
      json(res, { ...data, children });
    }
    return true;
  }

  return false;
}
