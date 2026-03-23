# oh-my-mermaid (omm)

[![npm version](https://img.shields.io/npm/v/oh-my-mermaid)](https://www.npmjs.com/package/oh-my-mermaid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Turn complex codebases into clear, navigable architecture diagrams with Claude Code.**

> `claude` → `/omm-scan` → done. Your architecture docs write themselves.

![omm viewer screenshot](./docs/screenshot.png)

## Why?

Plain Mermaid diagrams are flat — one file, one diagram, no connections between them.

omm structures your architecture as **interconnected classes** that you can drill into. Use `@class-name` references to nest diagrams inside each other, zoom out to see the full picture, or click into a subsystem to focus on the details. Each class carries not just a diagram, but also context, constraints, and concerns — so the *why* behind your architecture lives right next to the *what*.

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) does the heavy lifting: it analyzes your code and generates everything automatically.

```
Your code → Claude Code analyzes → .omm/ stores diagrams → Live viewer in browser
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (`npm install -g @anthropic-ai/claude-code`)

## Install

### As Claude Code plugin (recommended)

```
/plugin install oh-my-mermaid
```

### As npm CLI

```bash
npm install -g oh-my-mermaid
```

## Quick Start

```bash
# 1. Launch Claude Code in your project
cd your-project
claude

# 2. Install the plugin (first time only)
/plugin install oh-my-mermaid

# 3. Scan your architecture
/omm-scan

# 4. View in browser
omm serve
# → http://localhost:3000
```

`/omm-scan` makes Claude analyze your code and generate architecture docs in the `.omm/` directory.
The CLI is auto-installed if needed. To focus on a specific area, pass a topic: `/omm-scan auth flow`.

## How It Works

### The `.omm/` directory

omm creates an `.omm/` directory at your project root. Each architectural unit ("class") gets its own folder with up to 7 documentation fields:

```
.omm/
├── config.yaml
├── overall-architecture/
│   ├── description.md      # What this diagram represents
│   ├── diagram.mmd         # Mermaid flowchart code
│   ├── context.md          # Why this architecture exists
│   ├── constraint.md       # Rules that must be followed
│   ├── concern.md          # Risks, tech debt, known issues
│   ├── todo.md             # Planned improvements
│   ├── note.md             # Additional notes
│   └── meta.yaml           # Auto-managed (timestamps, git info)
├── auth-flow/
│   └── ...
└── data-pipeline/
    └── ...
```

### Cross-references

Use `@class-name` in diagram nodes to link between classes:

```text
graph LR
    Client -->|"HTTP"| @auth-flow[Auth Service]
    Client -->|"WebSocket"| @data-pipeline[Data Pipeline]
```

Click `@auth-flow` in the viewer to navigate to that class.

## CLI Commands

### Basics

```bash
omm init                      # Initialize .omm/ directory (usually not needed)
omm list                      # List all classes
omm show <class>              # Display all fields for a class
omm status                    # Overview of all classes
omm delete <class>            # Delete a class
```

### Read / Write fields

```bash
omm <class> <field>           # Read a field
omm <class> <field> "content" # Write to a field
omm <class> <field> -         # Write from stdin (multiline)
```

Available fields: `description`, `diagram`, `context`, `constraint`, `concern`, `todo`, `note`

### Analysis

```bash
omm diff <class>              # Compare current vs previous diagram
omm refs <class>              # Show classes that reference this one
omm refs --reverse <class>    # Show classes this one references
```

### Local viewer

```bash
omm serve                    # Start live viewer at http://localhost:3000
omm serve --port 8080        # Custom port
```

Auto-refreshes in the browser when files change (via SSE).

## Cloud

Share your architecture with your team via [ohmymermaid.com](https://ohmymermaid.com).

```bash
omm login                    # Sign in (opens browser)
omm link                     # Link project to cloud
omm push                     # Upload to cloud
omm share                    # Print shareable URL

omm pull                     # Download from cloud
omm logout                   # Sign out
```

Or use `/omm-push` inside Claude Code to handle login, link, and push in one step.

## Claude Code Skills

| Skill | Description |
|-------|-------------|
| `/omm-scan` | Analyze full codebase → auto-generate architecture docs |
| `/omm-scan [topic]` | Focus on a specific area (e.g. `/omm-scan auth flow`) |
| `/omm-push` | Login + link + push to cloud in one step |

## Development

```bash
git clone https://github.com/oh-my-mermaid/oh-my-mermaid.git
cd oh-my-mermaid
npm install
npm run build

# Watch mode
npm run dev

# Test
npm test
```

## Contributing

Issues and PRs are welcome.

1. Fork → branch → change → PR
2. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages

## License

[MIT](./LICENSE)
