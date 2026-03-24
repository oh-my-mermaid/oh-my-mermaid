# Eval: OpenClaw

## Meta

| Field | Value |
|-------|-------|
| Repo | OpenClaw |
| Commit | 039ea5998e |
| Date | 2026-03-24 |
| omm version | (from meta.yaml: created 2026-03-24T06:45:29Z) |
| Scan command | `/omm-scan` (full) |
| Notes | CLEAN baseline scan, 7 top-level classes |

## Summary

- **Verdict**: Borderline
- **Top-level classes**: 7 (cli-shell, agents-core, auto-reply, commands, config-infra, gateway-runtime, plugins-extensions)
- **Nested depth**: shallow (single-level nesting only; no sub-class nesting within classes)

## What Worked

1. **gateway-runtime is the clearest class in the output.** The diagram correctly identifies `boot.ts` as the entry, threads auth → rate-limit → call → routing → channels in the right order, marks abort and rate-limit as concerns, and the text fields add real constraints (e.g., "rate-limit enforcement is global across all channels for a given user identity"). This class alone demonstrates what good abstraction looks like.

2. **Constraints and concerns contain actionable, non-obvious content.** Across all 7 classes the constraint and concern fields go beyond diagram restatement. Examples: the auth-profile cooldown cascade risk in agents-core, the bonjour LAN exposure risk in config-infra, and the hook pipeline blocking concern in plugins-extensions. A new engineer reading these would immediately understand system-level risks without reading a single source file.

3. **cli-shell correctly identifies the single argv parse point and respawn loop as architectural facts.** The diagram traces `entry.ts → argv → (browser-cli | channel-cli | channels-cli | acp-cli)` which maps accurately to the actual `src/cli/` structure. The constraint that no other module parses `process.argv` and the respawn guard concern are real and not invented — they are backed by `entry.respawn.ts` and `entry.respawn.test.ts` in the source.

## What Failed

1. **config-infra is an over-merged catch-all, not a coherent architectural axis.** It bundles `src/config/` (~252 files), `src/infra/` (~506 files), `src/security/` (~35 files), and `src/daemon/` (~54 files) into a single class totaling ~847 files. The daemon is a long-running process that keeps the gateway alive — it has more runtime significance than infrastructure primitives like `backoff.ts`. Security policy enforcement is a distinct cross-cutting concern. Merging these four subsystems into one class hides their individual responsibilities and makes the class nearly as large as agents-core. A reader cannot tell from the top-level whether the daemon is a background service or just a file in a config directory.

2. **auto-reply and commands are nearly parallel classes with no edge between them, obscuring a real dependency.** `src/auto-reply/commands-registry.ts` is distinct from `src/commands/commands-registry.ts` (noted in auto-reply's own note.md), yet the diagram shows no relationship between the two. More critically, `auto-reply/dispatch.ts` resolves commands from its own registry rather than the shared one — this is a real architectural split that a new reader needs to understand. The absence of any edge or cross-reference between auto-reply and commands means the reader must infer this split from notes rather than seeing it structurally.

3. **agents-core absorbs too much — apply-patch and agent-scope are implementation details that inflate the diagram without adding architectural clarity.** The class spans ~935 files and the diagram exposes 10 nodes. `apply-patch.ts` is a file-mutation utility; surfacing it at the same level as auth-profiles or provider selection implies equal architectural weight that it does not have. Similarly `agent-paths.ts` is a path-resolution helper. The contract criterion for this repo explicitly watches for "내부 유틸 오염" (internal utility contamination at top level) — and this class fails that test. The diagram would communicate the same architecture with 5-6 nodes instead of 10.

## Checklist

| # | Check | Rating | Notes |
|---|-------|--------|-------|
| 1 | Top-level class count appropriate | Borderline | 7 classes for a large repo is acceptable by count, but config-infra is a merger of 4 distinct subsystems. Effective architectural count is closer to 10. |
| 2 | Class names are architectural concepts | Pass | cli-shell, gateway-runtime, agents-core, plugins-extensions are all architectural concepts, not directory names. config-infra is weaker — "infra" is a catch-all label. |
| 3 | Each class has clear separation reason | Borderline | cli-shell, gateway-runtime, auto-reply, plugins-extensions each have a clear single reason. config-infra does not — it bundles config, infra primitives, security, and daemon with no unifying responsibility. |
| 4 | No critical subsystem missing | Fail | The `src/routing/` subsystem is subsumed inside gateway-runtime without its own identity (acceptable), but `src/browser/` — the browser automation subsystem referenced by cli-shell's browser-cli — has no representation at all. `src/channels/` appears only as an external reference inside gateway-runtime rather than being explained. `src/wizard/` is buried inside commands with no mention in the top-level structure. |
| 5 | No implementation detail leaked to top-level | Borderline | agents-core exposes apply-patch and agent-paths at diagram level. config-infra exposes archive, backup, backoff, abort as separate nodes — these are infra primitives, not architectural units. |
| 6 | Key flow edges/@refs visible | Pass | gateway-runtime's boot→auth→call→routing chain is correct. agents-core's agent→providers→anthropic chain is correct. cli-shell's entry→argv→sub-CLIs routing is correct. |
| 7 | Edge/@ref density not overwhelming | Pass | Each diagram has 8-12 edges. No diagram is visually cluttered. The choice to use `@ref` cross-class labels (e.g., `@agents-core`, `@gateway-runtime`) keeps inter-class relationships readable. |
| 8 | Entry point / central axis visible | Pass | gateway-runtime's `boot.ts` is correctly marked as entry. cli-shell's `entry.ts` is marked as entry. agents-core's `agent.ts` is marked as entry. The traversal order is clear: start at cli-shell, follow to gateway-runtime, then to agents-core. |
| 9 | Nested graph provides zoom-out/zoom-in | Borderline | The class structure provides one level of zoom. However there is no second level of nesting — gateway-runtime's channels or agents-core's auth-profiles subdirectory are not further decomposed. For a repo of this size (~3000+ files) a single nesting level is shallow. A reader zooming into agents-core still faces ~935 files with only 10 node labels. |
| 10 | Description adds value beyond diagram title | Pass | All 7 descriptions go beyond the class name. "Automated message handling layer" with specifics about polling-based delivery, group activation triggers, and heartbeat replies is substantively informative, not a rephrasing of the diagram. |
| 11 | Context explains external interfaces/purpose | Pass | context.md files accurately enumerate source paths and file counts. gateway-runtime's context correctly notes `agent-via-gateway.ts` as the bridge to agents. plugins-extensions's context correctly identifies `extensionAPI.ts` as the published contract. |
| 12 | Constraint captures real design rules | Pass | Constraints are specific and verifiable. "Must remain the single argv parse point" (cli-shell), "Auth profiles are the single source of truth for credentials" (agents-core), "Plugins must only interact through the plugin SDK surface" (plugins-extensions) — all are real architectural invariants backed by the code structure. |
| 13 | Concern captures real risks/uncertainties | Pass | Concerns are specific failure modes, not generic warnings. The auth-profile cooldown cascade, ACP spawn unbounded child processes, hook pipeline blocking, and bonjour LAN exposure are all real and non-obvious from the diagram alone. |
| 14 | Stable on re-scan | N/A (baseline) | |

## Missing Subsystems

- `src/browser/` — browser automation subsystem is referenced by cli-shell (browser-cli) and has its own directory but no top-level class representation
- `src/channels/` — 200-file channel adapter layer (Slack, Discord, Telegram, etc.) is only visible as an external node inside gateway-runtime, not as a first-class subsystem
- `src/daemon/` — long-running process management is buried inside config-infra and loses its runtime identity

## Over-split Subsystems

- None — the output has 7 classes for a very large repo, so over-splitting is not the problem here.

## Over-merged Subsystems

- `config-infra` merges `src/config/`, `src/infra/`, `src/security/`, `src/daemon/` — four subsystems with distinct responsibilities that should be at least two classes (e.g., config+secrets vs infra+daemon, or split daemon out entirely)
- `agents-core` absorbs implementation-level utilities (apply-patch, agent-paths) that inflate the diagram without adding architectural signal
