// oh-my-mermaid public API
export { initOmm, ensureOmmForRead, ensureOmmForWrite, listClasses, readField, writeField, showClass, deleteClass, classExists } from './lib/store.js';
export { diffMermaid, parseMermaid, formatDiff } from './lib/diff.js';
export { extractRefs, getIncomingRefs, getOutgoingRefs, buildRefGraph } from './lib/refs.js';
export { validateDiagram, VALID_CLASSDEF_NAMES, CLASSDEF_PALETTE } from './lib/validate.js';
export { VALID_FIELDS, FIELD_FILES } from './types.js';
export type { Field, ClassMeta, ClassData, DiffResult, RefEntry, OmmConfig, ValidationIssue, ValidationResult } from './types.js';
