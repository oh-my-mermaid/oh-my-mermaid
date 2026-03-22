---
name: omm-push
description: Push architecture docs to oh-my-mermaid cloud. Handles login, link, and push workflow with error guidance. Use when the user says "omm push", "push to cloud", "deploy architecture", or "share architecture".
---

# omm-push — Cloud Push Workflow

## Purpose

Automate the full workflow of pushing .omm/ architecture docs to the oh-my-mermaid cloud service.

## Prerequisites

The `omm` CLI must be installed (`npm install -g oh-my-mermaid`).

## Workflow

### Step 1: Check Login Status

Run `omm share` via Bash. If it errors with "not logged in":
- Tell the user: "You need to log in first."
- Run `omm login` — this opens a browser for GitHub OAuth
- Wait for the user to complete login

### Step 2: Check Project Link

Run `omm share` via Bash. If it errors with "no project slug":
- Run `omm link` — this sets the cloud project slug from the directory name
- Confirm: "Linked to {slug}"

### Step 3: Push

Run `omm push` via Bash.

Handle errors:
- **401 Unauthorized**: "Login expired. Run `omm login` again."
- **403 Free plan limit**: "Free plan allows 1 project. Upgrade at https://ohmymermaid.com/pricing"
- **Network error**: "Cannot reach server. Check your connection."

### Step 4: Report

On success, output:
- Number of files uploaded
- View URL: `https://ohmymermaid.com/p/{slug}`
- Share URL (if Pro): "Run `omm share` to get the shareable link"

## Rules

- Always check login before pushing
- Always check link before pushing
- Do NOT skip steps — each depends on the previous
- If any step fails, stop and report the error with guidance
