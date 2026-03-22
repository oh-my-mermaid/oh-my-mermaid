---
name: omm-scan
description: Scan codebase architecture and generate/update .omm/ documentation. Without arguments does a full scan; with arguments focuses on a specific topic and auto-links to parent diagrams. Use when the user says "omm scan", "scan architecture", "update architecture", "refresh diagrams", "omm scan auth flow", "analyze the payment module", or "dive into auth".
argument-hint: "[topic]"
---

# omm-scan — Architecture Scanner (Full + Focused)

## Purpose

Analyze the codebase and generate/update `.omm/` architecture documentation using the `omm` CLI.
Operates in two modes based on whether arguments are provided.

## Prerequisites

The `omm` CLI must be installed (`npm install -g oh-my-mermaid` or available via npx).

## Mode Detection

- **No arguments** (`/omm-scan`): Full scan mode — analyze entire codebase
- **With arguments** (`/omm-scan auth flow`): Focused mode — analyze specific topic only

---

## A. Full Scan Mode (no arguments)

### Step 1: Initialize

If `.omm/` does not exist, run `omm init` first.

```bash
omm init
```

### Step 2: Check Existing State

```bash
omm list
```

For each existing class, read current content:
```bash
omm <class> description
omm <class> diagram
```

### Step 3: Explore the Codebase

Use Glob and Read to understand the project:
- Read `package.json`, `tsconfig.json`, or equivalent config files
- List top-level directories to identify module boundaries
- Read key entry points (main, index, app files)
- Look for route definitions, service layers, database connections

### Step 4: Generate/Update Classes

**First run (no existing classes):** Create classes based on what a person new to this codebase most needs to understand. Always start with `overall-architecture`, then add perspectives from this list based on what exists in the code:

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

**Subsequent runs:** Compare existing docs against current code, update only what changed.

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
- Constraints that shaped the design (e.g., "Must support offline mode — hence local-first storage")
- Alternatives considered and rejected
- Historical reasons if relevant
EOF

omm <class> constraint - <<'EOF'
(Rules that MUST be followed when changing this area)
- e.g., "API layer must never import from repository directly — always go through service"
EOF

omm <class> concern - <<'EOF'
(Risks, technical debt, known issues a reader should be aware of)
- e.g., "Auth service is a single point of failure — no fallback if it's down"
EOF

omm <class> todo - <<'EOF'
(Concrete next steps or planned improvements)
- e.g., "Add caching layer between service and repository"
EOF

omm <class> note - <<'EOF'
(Anything else a new reader would want to know that doesn't fit above)
EOF
```

### Step 5: Cross-References

Use `@class-name` convention for nodes that represent another class. For `@ref` nodes, do NOT add a path as the second line — instead, use a plain concept label:

```mermaid
graph LR
    client["Browser Client\nsrc/client/"]
    client -->|"HTTP request"| @api-layer["API Layer"]
    client -->|"authenticate"| @auth-flow["Auth Service"]
```

The `@` prefix tells the viewer this node is a drill-down into another class. Adding a file path would be misleading since it represents a whole sub-diagram, not a single file.

### Step 6: Summarize

Report what was created/updated and suggest `omm serve` to view.

---

## B. Focused Mode (with arguments)

### Step 1: Parse Topic

Convert `$ARGUMENTS` to a kebab-case class name:
- "auth flow" → `auth-flow`
- "payment service" → `payment-service`
- "database schema" → `database-schema`

### Step 2: Deep Analysis

Focus Glob and Read on code related to the topic:
- Search for files matching the topic (e.g., `*auth*`, `*payment*`)
- Trace imports and dependencies from those files
- Understand the full flow for this specific concern

### Step 3: Create/Update Class

Generate all fields via CLI (same as full scan, but for this one class only).

### Step 4: Auto-Link to Parent

This is the key differentiator from full scan:

1. Run `omm list` to get existing classes
2. For each existing class, run `omm <class> diagram` to read its diagram
3. Check if the new class is already referenced as `@new-class`
4. If NOT referenced, find the logical parent (usually `overall-architecture`) and update its diagram to include `@new-class[Label]` node

Example: After creating `auth-flow`, update `overall-architecture`:
```bash
# Read current parent diagram
omm overall-architecture diagram
# Add @auth-flow reference and rewrite
omm overall-architecture diagram - <<'MERMAID'
graph LR
    Client --> @auth-flow[Auth Service]
    ...existing nodes...
MERMAID
```

### Step 5: Verify and Summarize

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
2. In the parent diagram, use `@child-class[Label]` as the node ID
3. Fill all 7 fields for the child class (description, constraint, concern, context, todo, note)

**Example:**
If `overall-architecture` has an auth subsystem with 8+ nodes:
- Create `auth-flow` class with its own detailed diagram
- In `overall-architecture` diagram: `Client --> @auth-flow[Auth Service]`
- The viewer will render `@auth-flow` as a clickable, expandable sub-group

### Edge Labels

Every edge MUST have a meaningful label. The label should answer **"why does this connection exist?"** — not just the protocol.

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
- Keep diagrams readable — 5-15 nodes max per diagram.
- Use `graph LR` for most diagrams, `graph TD` for hierarchies.
- Do NOT rewrite classes that haven't changed.
- Do NOT delete classes — only report if obsolete.
- Write each field separately (constraint, concern, context, todo, note) — do NOT combine them.
- Use `omm diff <class>` after updating to verify changes.
- Use `classDef` to visually distinguish node roles — apply only when the distinction genuinely helps a reader:

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

  Do not overuse — if everything has a color, nothing stands out.
