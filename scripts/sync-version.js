import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

for (const name of ['plugin', 'marketplace']) {
  const filePath = `.claude-plugin/${name}.json`;
  const json = JSON.parse(readFileSync(filePath, 'utf8'));
  if (name === 'marketplace') json.plugins[0].version = version;
  else json.version = version;
  writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
}

process.stderr.write(`Synced version ${version} to .claude-plugin/ manifests\n`);
