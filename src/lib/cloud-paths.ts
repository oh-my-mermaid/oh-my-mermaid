import path from 'node:path';

export function resolvePullDestination(ommDir: string, filePath: string): string {
  if (!filePath) {
    throw new Error('Unsafe file path received from cloud');
  }

  const normalized = path.posix.normalize(filePath.replace(/\\/g, '/'));
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`Unsafe file path received from cloud: ${filePath}`);
  }
  if (path.posix.isAbsolute(normalized)) {
    throw new Error(`Unsafe file path received from cloud: ${filePath}`);
  }

  const destination = path.resolve(ommDir, normalized);
  const root = path.resolve(ommDir) + path.sep;
  if (destination !== path.resolve(ommDir, 'config.yaml') && !destination.startsWith(root)) {
    throw new Error(`Unsafe file path received from cloud: ${filePath}`);
  }

  return destination;
}
