---
name: omm-scan
description: Scan codebase architecture and generate/update .omm/ documentation. Always runs an internal `omm structure` prepass, then updates classes in one pass. Without arguments does a full scan; with arguments focuses on a specific topic and auto-links to parent diagrams. Use when the user says "omm scan", "scan architecture", "update architecture", "refresh diagrams", "omm scan auth flow", "analyze the payment module", or "dive into auth".
argument-hint: "[topic]"
---

# omm-scan — Architecture Scanner (Full + Focused)

## Purpose

Analyze the codebase and generate/update `.omm/` architecture documentation using the `omm` CLI.
This is a one-shot workflow: run a structure prepass, use it to ground the scan, then immediately generate or update the relevant classes.

## Prerequisites

Ensure the `omm` CLI is available:

```bash
command -v omm || npm install -g oh-my-mermaid
```

If the install command fails (permission denied), tell the user:
"Please run `npm install -g oh-my-mermaid` in your terminal, then try again."

## Mode Detection

- **No arguments** (`/omm-scan`): Full scan mode - analyze the entire codebase
- **With arguments** (`/omm-scan auth flow`): Focused mode - analyze a specific topic only

---

## One-Shot Execution Rules

- Do not add any extra planning gate or pause between discovery and updates.
- Always run `omm structure` first, before deciding which classes to create or update.
- Use the structure output to choose the class set, the relevant `source_paths`, and the smallest code slice needed to ground the diagrams.
- Only after the structure prepass should you read code, compare existing docs, and write updates.

## A. Full Scan Mode (no arguments)

### Step 1: Run Structure Prepass

```bash
omm structure
```

Use the output to identify:
- top-level boundaries and subsystems
- candidate classes worth documenting
- concrete `source_paths` for each class
- entry points, shared modules, and externally connected areas

### Step 2: Ground the Scan in Code

Read only the files suggested by `omm structure`, then expand as needed to verify the actual relationships:
- read `package.json`, `tsconfig.json`, or equivalent config files when they help confirm layout
- inspect the directories and entry points named by the prepass
- follow imports, route handlers, command dispatchers, and config wiring from those files
- compare against existing `.omm/` classes only for the classes you are about to touch

### Step 3: Generate/Update Classes Immediately

Create classes based on what a person new to this codebase most needs to understand. Always start with `overall-architecture`, then add perspectives from this list based on what exists in the code:

| Class name | When to create | What it answers |
|---|---|---|
| `overall-architecture` | Always | What exists and how pieces relate |
| `request-lifecycle` | Any server/API | How a request enters and gets handled end-to-end |
| `data-flow` | Any data processing | Where data comes from, transforms, and lands |
| `auth-flow` | Any auth/session logic | How identity is established and propagated |
| `dependency-map` | Complex module graph | What depends on what, what's shared |
| `state-transitions` | Stateful features | How state changes and what triggers it |
| `external-integrations` | External APIs/services | What the system connects to and why |

Only create a class if it meaningfully exists in the code. 3-5 classes is usually right; avoid forcing perspectives that don't exist.

For a new codebase or one with no existing classes, keep the first pass focused on the most important system views instead of trying to cover everything.

For each class, call the CLI with **each field separately**:

```bash
omm <class> description - <<'EOF'
(1-2 sentences: what this diagram shows AND who should read it)
- e.g., "Shows how an HTTP request flows from entry point to response. Start here if you want to understand how the API handles a request."
EOF

omm <class> diagram - <<'MERMAID'
graph LR
    (Accurate mermaid diagram based on actual code)
MERMAID

omm <class> context - <<'EOF'
(The most important field for human understanding: WHY this architecture exists)
- Key decisions made and why (e.g., "Chose event-driven over direct calls to decouple billing from orders")
- Constraints that shaped the design (e.g., "Must support offline mode - hence local-first storage")
- Alternatives considered and rejected
- Historical reasons if relevant
EOF

omm <class> constraint - <<'EOF'
(Rules that MUST be followed when changing this area)
- e.g., "API layer must never import from repository directly - always go through service"
EOF

omm <class> concern - <<'EOF'
(Risks, technical debt, known issues a reader should be aware of)
- e.g., "Auth service is a single point of failure - no fallback if it's down"
EOF

omm <class> todo - <<'EOF'
(Concrete next steps or planned improvements)
- e.g., "Add caching layer between service and repository"
EOF

omm <class> note - <<'EOF'
(Anything else a new reader would want to know that doesn't fit above)
EOF
```

### Step 4: Cross-References

Use `@class-name` in the label to mark a node as a drill-down into another class. Use a short node ID and put `@class-name` as the label:

```mermaid
graph LR
    client["Browser Client\nsrc/client/"]
    client -->|"HTTP request"| api["@api-layer"]
    client -->|"authenticate"| auth["@auth-flow"]
```

The viewer detects `@` in the label and renders the node as an expandable sub-group. Do NOT add a file path to `@ref` nodes - they represent a whole sub-diagram, not a single file.

### Step 5: Summarize

Report what was created/updated and suggest `omm view` to view.

---

## B. Focused Mode (with arguments)

### Step 1: Parse Topic

Convert `$ARGUMENTS` to a kebab-case class name:
- "auth flow" -> `auth-flow`
- "payment service" -> `payment-service`
- "database schema" -> `database-schema`

### Step 2: Run Structure Prepass

```bash
omm structure
```

Use the output to narrow the scan to:
- the requested class and its closest related modules
- concrete `source_paths` that should appear in the diagram
- the most likely parent diagram for cross-linking

### Step 3: Deep Analysis

Focus Glob and Read on code related to the topic and the paths surfaced by the prepass:
- search for files matching the topic or related module names
- trace imports, route handlers, command dispatchers, and config wiring from those files
- understand the full flow for this specific concern, but do not widen the scope beyond what the topic and structure output justify

### Step 4: Create/Update Class

Generate all fields via CLI (same as full scan, but for this one class only).

### Step 5: Auto-Link to Parent

This is the key differentiator from full scan:

1. Run `omm list` to get existing classes
2. For each existing class, run `omm <class> diagram` to read its diagram
3. Check if the new class is already referenced as `@new-class` in a label
4. If NOT referenced, find the logical parent (usually `overall-architecture`) and update its diagram to include a node with `@new-class` as the label

Example: After creating `auth-flow`, update `overall-architecture`:
```bash
# Read current parent diagram
omm overall-architecture diagram
# Add @auth-flow reference and rewrite
omm overall-architecture diagram - <<'MERMAID'
graph LR
    Client --> auth["@auth-flow"]
    ...existing nodes...
MERMAID
```

### Step 6: Verify and Summarize

```bash
omm refs <new-class>
```

Report: "auth-flow created, @auth-flow added to overall-architecture"

---

### Nested Architecture Analysis

When analyzing the codebase, identify sub-systems that are complex enough to warrant their own diagram (5+ nodes). Create separate classes for these and reference them with `@class-name` in the parent diagram.

**When to nest:**
- A module has 5+ internal components with their own relationships
- A subsystem has distinct layers or flows worth documenting separately
- A feature area (auth, billing, data pipeline) has its own internal architecture

**How to nest:**
1. Create a new class: `omm <child-class> diagram - <<'MERMAID'...MERMAID`
2. In the parent diagram, add a node with `@child-class` as the label (e.g. `auth["@auth-flow"]`)
3. Fill all 7 fields for the child class (description, constraint, concern, context, todo, note)

**Example:**
If `overall-architecture` has an auth subsystem with 8+ nodes:
- Create `auth-flow` class with its own detailed diagram
- In `overall-architecture` diagram: `Client --> auth["@auth-flow"]`
- The viewer detects `@` in the label and renders it as an expandable sub-group

### Edge Labels

Every edge MUST have a meaningful label. The label should answer **"why does this connection exist?"** - not just the protocol.

**Format:** `A -->|"label"| B`

**What to include in labels (priority order):**
1. The purpose/intent: what does this relationship accomplish?
2. What data/result flows: what is actually transferred?
3. Protocol/method only if it adds clarity (HTTP, IPC, Event, etc.)

**Good examples:**
```mermaid
Client -->|"login request (HTTP POST)"| AuthService
AuthService -->|"issue session token"| Client
AuthService -->|"verify user exists"| UserRepository
OrderService -->|"request payment authorization"| PaymentGateway
PaymentGateway -->|"authorization result callback"| OrderService
EventBus -->|"emit: order.completed"| NotificationService
```

**Bad examples (avoid):**
```mermaid
A --> B
Client --> Server
AuthService -->|"HTTP"| UserRepository
```

The test: if you remove the label, does the reader lose important understanding? If yes, the label is good. If the label is just a protocol name, it's probably not enough.

### Edge Grounding

Every edge must be grounded in code evidence. Prefer the strongest evidence available and do not invent connectivity from architecture intuition alone.

**Preferred evidence, in order:**
1. Direct imports, requires, exports, or explicit module references
2. Route or handler wiring that clearly connects an entry point to its implementation
3. Command dispatch or CLI routing that connects a command to the code path it invokes
4. Config wiring that explicitly binds one component to another

**Allowed when the code supports it:**
- `route -> handler` when the route table and handler registration are explicit
- `command -> dispatcher` when the CLI or command map names the implementation
- `config -> component` when configuration is actually consumed to wire the component

**Forbidden:**
- phantom edges created from naming similarity, package layout, or assumed runtime behavior
- edges that are only "probably true" without code evidence
- edges that skip an intermediate component that is visible in code

If the evidence is weak, omit the edge and describe the relationship in a field instead of drawing it.

## Rules (Both Modes)

- Write all content (node labels, edge labels, field text) in **English by default**. If the user wrote in another language, match that language throughout.
- ONLY document what actually exists in the code. Do not invent or speculate.
- **Node labels must use two-line format**: concept name on the first line, file/directory path on the second line, separated by `\n`:
  ```
  auth_service["Auth Service\nsrc/auth/service.ts"]
  user_repo["User Repository\nsrc/user/repository.ts"]
  payment_module["Payment Module\nsrc/payment/"]
  ```
  - First line: role/responsibility in plain language (what it does)
  - Second line: actual path relative to project root (where to find it)
  - The viewer renders the path smaller and muted below the concept name
  - For modules/folders, use the directory path (e.g., `src/payment/`)
  - For single files, use the file path (e.g., `src/auth/service.ts`)
- Keep diagrams readable - 5-15 nodes max per diagram.
- Use `graph LR` for most diagrams, `graph TD` for hierarchies.
- Do NOT rewrite classes that haven't changed.
- Do NOT delete classes - only report if obsolete.
- Write each field separately (constraint, concern, context, todo, note) - do NOT combine them.
- Use `omm diff <class>` after updating to verify changes.
- Use `classDef` to visually distinguish node roles - apply only when the distinction genuinely helps a reader:

  | Class | Color | When to use |
  |---|---|---|
  | `external` | muted gray `#585b70` | Third-party services, APIs outside your codebase (DB, S3, Stripe, etc.) |
  | `concern` | red `#f38ba8` | Nodes that are a known risk or bottleneck (single point of failure, legacy code) |
  | `entry` | blue `#89b4fa` | Entry points (HTTP handler, CLI, queue consumer) |
  | `store` | green `#a6e3a1` | Persistent storage (DB, cache, file system) |

  ```
  classDef external fill:#585b70,stroke:#585b70,color:#cdd6f4
  classDef concern fill:#f38ba8,stroke:#f38ba8,color:#1e1e2e
  classDef entry fill:#89b4fa,stroke:#89b4fa,color:#1e1e2e
  classDef store fill:#a6e3a1,stroke:#a6e3a1,color:#1e1e2e
  ```

  Do not overuse - if everything has a color, nothing stands out.
- Do NOT create circular `@`references. A child class must never `@`-reference its parent. If `overall-architecture` has `auth["@auth-flow"]`, then `auth-flow`'s diagram must NOT reference `@overall-architecture`. Use `context.md` to describe the parent relationship instead.
