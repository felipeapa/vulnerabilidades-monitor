// Reads exact installed versions from package-lock.json (v1, v2 and v3 formats)
import fs from 'fs';

export function readLockfilePackages(lockPath = './package-lock.json') {
  if (!fs.existsSync(lockPath)) return [];

  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const entries = new Map();

  if (lock.packages) {
    for (const [key, meta] of Object.entries(lock.packages)) {
      if (!key || !meta?.version) continue;
      const name = meta.name || key.replace(/^.*node_modules\//, '');
      if (!name || name.startsWith('.')) continue;
      entries.set(`${name}@${meta.version}`, { name, version: meta.version });
    }
  } else if (lock.dependencies) {
    collectV1(lock.dependencies, entries);
  }

  return [...entries.values()];
}

function collectV1(dependencies, entries) {
  for (const [name, meta] of Object.entries(dependencies)) {
    if (meta?.version) entries.set(`${name}@${meta.version}`, { name, version: meta.version });
    if (meta?.dependencies) collectV1(meta.dependencies, entries);
  }
}
