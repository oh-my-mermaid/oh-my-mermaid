---
name: omm-view
description: Start the omm web viewer to explore architecture diagrams in the browser. Use when the user says "omm view", "open viewer", "show diagrams", "view architecture", or "open architecture".
argument-hint: "[--port <port>]"
---

# omm-view — Architecture Viewer

## Purpose

Launch the interactive web viewer so the user can explore `.omm/` architecture diagrams in their browser.

## Prerequisites

Ensure the `omm` CLI is available:

```bash
command -v omm || npm install -g oh-my-mermaid
```

If the install command fails (permission denied), tell the user:
"Please run `npm install -g oh-my-mermaid` in your terminal, then try again."

## Steps

### Step 1: Verify .omm/ exists

```bash
omm list
```

If no classes found, tell the user:
"No architecture docs found. Run `/omm-scan` first to generate them."
Then stop.

### Step 2: Start the viewer

```bash
omm view
```

If the user specified a port:

```bash
omm view --port <port>
```

### Step 3: Report

Tell the user the viewer is running and provide the URL (default: `http://localhost:3000`).

The viewer auto-refreshes when `.omm/` files change.

## Rules

- Always check for existing classes before starting the viewer
- If no classes exist, suggest `/omm-scan` instead of starting an empty viewer
- The viewer is read-only — it does not modify `.omm/` files
