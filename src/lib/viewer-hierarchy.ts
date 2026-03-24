type ViewerRef =
  | string
  | {
      target_class?: string;
    };

type ViewerRefsPayload = {
  outgoing?: ViewerRef[];
};

export interface ViewerHierarchy {
  roots: string[];
  parentByClass: Record<string, string | null>;
  childrenByClass: Record<string, string[]>;
  outgoingByClass: Record<string, string[]>;
}

function normalizeOutgoing(
  className: string,
  classesSet: Set<string>,
  refsData: Record<string, ViewerRefsPayload>,
): string[] {
  const refs = refsData[className]?.outgoing ?? [];
  const targets = refs
    .map((entry) => (typeof entry === 'string' ? entry : entry?.target_class))
    .filter((target): target is string => Boolean(target) && classesSet.has(target));

  return [...new Set(targets)];
}

function pickRoots(
  remaining: string[],
  outgoingByClass: Record<string, string[]>,
  preferredRoots: string[] = [],
): string[] {
  const preferred = preferredRoots.filter((name) => remaining.includes(name));
  if (preferred.length > 0) {
    return preferred;
  }

  const remainingSet = new Set(remaining);
  const inCount = Object.fromEntries(remaining.map((name) => [name, 0]));

  for (const name of remaining) {
    for (const target of outgoingByClass[name]) {
      if (remainingSet.has(target)) {
        inCount[target] += 1;
      }
    }
  }

  const roots = remaining.filter((name) => inCount[name] === 0);
  if (roots.length > 0) {
    return roots;
  }

  const maxOutgoing = Math.max(...remaining.map((name) => outgoingByClass[name].filter((target) => remainingSet.has(target)).length));
  return remaining.filter((name) => outgoingByClass[name].filter((target) => remainingSet.has(target)).length === maxOutgoing);
}

export function buildViewerHierarchy(
  classes: string[],
  refsData: Record<string, ViewerRefsPayload>,
): ViewerHierarchy {
  const classesSet = new Set(classes);
  const outgoingByClass = Object.fromEntries(
    classes.map((className) => [className, normalizeOutgoing(className, classesSet, refsData)]),
  ) as Record<string, string[]>;

  const parentByClass = Object.fromEntries(classes.map((className) => [className, undefined])) as Record<string, string | null | undefined>;
  const childrenByClass = Object.fromEntries(classes.map((className) => [className, []])) as Record<string, string[]>;
  const roots: string[] = [];

  while (true) {
    const remaining = classes.filter((className) => parentByClass[className] === undefined);
    if (remaining.length === 0) {
      break;
    }

    const preferredRoots = roots.length === 0 && remaining.includes('overall-architecture')
      ? ['overall-architecture']
      : [];
    const nextRoots = pickRoots(remaining, outgoingByClass, preferredRoots);
    const queue = [...nextRoots];

    for (const root of nextRoots) {
      if (parentByClass[root] !== undefined) {
        continue;
      }
      parentByClass[root] = null;
      roots.push(root);
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const target of outgoingByClass[current]) {
        if (parentByClass[target] !== undefined) {
          continue;
        }
        parentByClass[target] = current;
        childrenByClass[current].push(target);
        queue.push(target);
      }
    }
  }

  return {
    roots,
    parentByClass: parentByClass as Record<string, string | null>,
    childrenByClass,
    outgoingByClass,
  };
}
