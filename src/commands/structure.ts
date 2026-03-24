import { buildStructure, formatStructureSummary } from '../lib/structure.js';

export interface CommandStructureOptions {
  rootDir?: string;
  summary?: boolean;
}

export async function commandStructure(options: CommandStructureOptions = {}): Promise<void> {
  const structure = await buildStructure(options.rootDir);
  if (options.summary) {
    process.stdout.write(`${formatStructureSummary(structure)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(structure, null, 2)}\n`);
}
