// oh-my-mermaid public API
export { initOmm, ensureOmmForRead, ensureOmmForWrite, listClasses, readField, writeField, showClass, deleteClass, classExists } from './lib/store.js';
export { diffMermaid, parseMermaid, formatDiff } from './lib/diff.js';
export { extractRefs, getIncomingRefs, getOutgoingRefs, buildRefGraph } from './lib/refs.js';
export { validateDiagram, VALID_CLASSDEF_NAMES, CLASSDEF_PALETTE } from './lib/validate.js';
export { buildStructure, formatStructureSummary } from './lib/structure.js';
export { VALID_FIELDS, FIELD_FILES } from './types.js';
export type {
  Field,
  ClassMeta,
  ClassData,
  DiffResult,
  RefEntry,
  OmmConfig,
  ValidateContext,
  ValidationIssue,
  ValidationResult,
  StructureTreeNode,
  StructureRelation,
  StructureEntryPoint,
  StructurePackage,
  StructureScanMeta,
  StructureOutput,
} from './types.js';
