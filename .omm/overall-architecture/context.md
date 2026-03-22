omm is a CLI tool that generates and serves architecture documentation as Mermaid diagrams. The core loop is: AI scans code → writes `.omm/` files via CLI → developer serves them locally or pushes to cloud.

Key decisions:
- Local-first: all data lives in `.omm/` plain files (markdown + mmd), no database
- CLI as the write interface: Claude Code uses `omm <class> <field> - <<'EOF'` to write docs; the server is read-only
- SSE for live reload: avoids WebSocket complexity while enabling instant viewer refresh as Claude writes
- Cloud sync is optional: push/pull uploads raw `.omm/` files; cloud hosts its own renderer (separate from viewer.html)
