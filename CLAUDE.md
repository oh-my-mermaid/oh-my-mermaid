# Project Rules

## README Localization

- `README.md` (English) is the source of truth
- Maintain translations: `README.ko.md`, `README.ja.md`, `README.zh.md`
- Every README (including English) must have language links at the top:
  ```
  [English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)
  ```
- Translated READMEs include a disclaimer at the top:
  > This document was translated from the English README. Some phrasing may be unnatural.
- When updating `README.md`, update all translations in the same commit
- Translations can be machine-generated but should be reviewed for obvious errors

## Versioning

- Follow [Semantic Versioning](https://semver.org/)
- Sync version across: `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`

## Commits

- Use [Conventional Commits](https://www.conventionalcommits.org/)
- Co-author tag for AI-assisted commits

## Terminology

- "element" — any architectural unit in `.omm/`
- "perspective" — top-level element only
- "group" — element with children (rendered as expandable box in viewer)
- "leaf" — element without children
- Do not use "class" in user-facing strings (internal code names like `listClasses` are fine)
