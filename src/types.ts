export const VALID_FIELDS = ['description', 'diagram', 'constraint', 'concern', 'context', 'todo', 'note'] as const;
export type Field = (typeof VALID_FIELDS)[number];

export const FIELD_FILES: Record<Field, string> = {
  description: 'description.md',
  diagram: 'diagram.mmd',
  constraint: 'constraint.md',
  concern: 'concern.md',
  context: 'context.md',
  todo: 'todo.md',
  note: 'note.md',
};

export interface ClassMeta {
  created: string;
  updated: string;
  update_count: number;
  last_field: Field;
  git_commit?: string;
  git_branch?: string;
  prev_diagram?: string;
}

export interface ClassData {
  name: string;
  description?: string;
  diagram?: string;
  constraint?: string;
  concern?: string;
  context?: string;
  todo?: string;
  note?: string;
  meta?: ClassMeta;
}

export interface OmmConfig {
  version: string;
  theme?: string;
}

export interface DiffResult {
  added_nodes: string[];
  removed_nodes: string[];
  added_edges: string[];
  removed_edges: string[];
  has_changes: boolean;
}

export interface RefEntry {
  source_class: string;
  target_class: string;
  node_id: string;
  node_label?: string;
}
