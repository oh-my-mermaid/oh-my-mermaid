# Eval: oh-my-mermaid

## Meta

| Field | Value |
|-------|-------|
| Repo | oh-my-mermaid |
| Commit | a037b8f |
| Date | 2026-03-24 |
| omm version | 0.1.0 |
| Scan command | `/omm-scan` (full) |
| Notes | Fresh baseline. 5 classes produced: cli-core, cloud-integration, local-viewer, platform-setup, doc-analysis. |

## Summary

- **Verdict**: Pass
- **Top-level classes**: 5
- **Nested depth**: shallow (single-level graphs only, no nested subgraphs)

## What Worked

1. **CLI/cloud separation is clean.** `cli-core` and `cloud-integration` are distinct classes with no conflation. The contract's primary watch item — "CLI와 cloud가 한 덩어리로 뭉개지지 않는가" — is satisfied. `cloud-integration` owns all auth/push/pull/org nodes; `cli-core` owns dispatch, store, and meta. The cross-class dependency (cloud commands using StoreAPI) is correctly shown as a `@cli-core` reference rather than inlined.

2. **Text fields add genuine signal beyond the diagram.** In particular, `cli-core/constraint.md` captures the lazy-init read/write asymmetry and the `prev_diagram`-only-for-diagram-field rule — neither of which appears in the diagram nodes. `cloud-integration/concern.md` surfaces the silent-overwrite risk on `omm pull` and the no-conflict-detection problem. These are real operational risks a reader would not infer from the graph alone.

3. **doc-analysis class boundary is principled.** Grouping `diff`, `refs`, and `validate` into one class makes sense: all three share the `parseMermaid` parser as a common internal dependency, and all three are consumed by both CLI commands and the local viewer API. The `@local-viewer` back-reference in the diagram correctly models this dual-consumer relationship.

## What Failed

1. **`doc-analysis` diagram misattributes parser ownership.** The diagram shows `MermaidParser["Mermaid Parser\nsrc/lib/diff.ts#parseMermaid"]` as a separate node but the context text itself acknowledges "the module ownership is unclear (parser logic lives in the diff module, not a dedicated parse module)." The diagram promotes a cross-module boundary that does not exist in the source — `parseMermaid` is just a function inside `diff.ts`, not a separate module. This misleads a reader into expecting a dedicated parse layer.

2. **`local-viewer` diagram direction conflates SSE flow.** The diagram shows `Browser -->|"connects to"| SSE` and `Watcher -->|"pushes change events to"| SSE`, treating `SSE` as a passive hub. But in the actual code (`server/index.ts`, `watcher.ts`), SSE is implemented as a client list held in the watcher/server, not a separate component. The real flow is: Watcher detects change → calls broadcast function that iterates `addSSEClient`-registered responses. The diagram adds a phantom node that implies a message broker where there is none.

3. **`refs/diff/viewer` do not surface as a "document navigation experience" axis.** The contract watch item asks whether these three capabilities read together as a documentation traversal experience. They do not: `diff` and `refs` are split across `doc-analysis` and `local-viewer` (refs is in doc-analysis, viewer serves them via API) with no top-level class that represents the "browse your architecture docs" flow. A new reader looking for "how do I navigate omm diagrams" gets no obvious entry class — they must read both `local-viewer` and `doc-analysis` and mentally stitch the flow.

## Checklist

| # | Check | Rating | Notes |
|---|-------|--------|-------|
| 1 | Top-level class count appropriate | Pass | 5 classes for a small CLI repo is well within the ~3-6 range for small projects. |
| 2 | Class names are architectural concepts | Pass | cli-core, cloud-integration, local-viewer, platform-setup, doc-analysis are all subsystem names, not directory names. |
| 3 | Each class has clear separation reason | Pass | Each class maps to a coherent responsibility: persistence+dispatch, remote sync, browser UI, tool registration, diagram intelligence. |
| 4 | No critical subsystem missing | Pass | All expected axes from contract present: CLI core, local viewer/server, cloud integration, platform/tool setup. |
| 5 | No implementation detail leaked to top-level | Borderline | `MermaidParser` in doc-analysis diagram is a function, not a module or subsystem, yet it appears as a first-class node. Minor but real. |
| 6 | Key flow edges/@refs visible | Pass | `@cli-core` cross-ref from cloud, local-viewer, doc-analysis correctly shows store dependency. Core write/read flow visible in cli-core diagram. |
| 7 | Edge/@ref density not overwhelming | Pass | All diagrams are 7-10 nodes with 6-10 edges. Readable at a glance. |
| 8 | Entry point / central axis visible | Pass | `cli-core` is clearly the root: all other classes reference `@cli-core` or depend on StoreAPI. The `CLI["omm binary\nsrc/cli.ts"]` node is the unambiguous start. |
| 9 | Nested graph provides zoom-out/zoom-in | Borderline | All classes use flat `graph LR` with no subgraphs. There is no zoom-in level — each class diagram is already the bottom level. The nested/zoom experience promised by the omm model is absent in this scan output. |
| 10 | Description adds value beyond diagram title | Pass | cli-core description explains lazy-init contract and the 7-field schema in a way the diagram does not. cloud-integration description explains the two-level org/project binding. |
| 11 | Context explains external interfaces/purpose | Pass | cloud-integration/context.md explains push serialization format, `OMM_API_URL` override, and git hash attachment. local-viewer/context.md explains the project-name injection mechanism. Concrete and non-obvious. |
| 12 | Constraint captures real design rules | Pass | cli-core constraint correctly captures the read/write asymmetry for lazy-init. cloud-integration constraint captures the "link before push/pull" requirement and the no-delta-sync rule. Both are real invariants. |
| 13 | Concern captures real risks/uncertainties | Pass | cloud-integration concern: silent overwrite, no conflict detection. local-viewer concern: SSE memory leak, no graceful shutdown. cli-core concern: no file locking for concurrent writes. All are real and actionable. |
| 14 | Stable on re-scan | N/A (baseline) | Cannot assess until second scan. |

## Missing Subsystems

- No explicit class for the `omm update` flow (self-update command, `src/commands/update.ts`). Minor given its simplicity, but it touches npm install and platform re-setup.

## Over-split Subsystems

- None. Five classes for this repo size is appropriate.

## Over-merged Subsystems

- `doc-analysis` merges diff, refs, and validate. This is defensible given the shared `parseMermaid` dependency, but `validate` has meaningfully different consumers (CI/lint use case) from diff/refs (viewer navigation). A future scan could reasonably split this.
