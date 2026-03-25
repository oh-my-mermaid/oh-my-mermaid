# Roadmap

## Planned

### Sub-agent scan pipeline
Split `/omm-scan` from a single skill into a multi-agent pipeline — parallel analysis per perspective, reduced token usage, faster scans.

### Incremental analysis
Detect changed files since last scan and update only affected perspectives and elements — skip unchanged subtrees.

### AI-powered search in viewer
Natural language search across architecture docs — "where does auth happen?" finds relevant elements across perspectives.

### Guide & onboarding skill
`/omm-guide` skill that walks new developers through the architecture interactively using the generated `.omm/` docs as context.
