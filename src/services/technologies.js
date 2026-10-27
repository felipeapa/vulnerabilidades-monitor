// Technology registry: which stacks are scanned and how each one is queried.
//
// source:
//   lockfile -> exact versions from a manifest (npm)
//   packages -> package list queried against an OSV ecosystem (Packagist)
//   nvd      -> product CPE queried against the NIST NVD API (runtimes, databases)
import fs from 'fs';

const FILE = './data/technologies.json';

const DEFAULTS = [
  {
    id: 'nodejs',
    name: 'Node.js',
    source: 'lockfile',
    ecosystem: 'npm',
    manifest: './package-lock.json',
    enabled: true,
  },
  {
    id: 'laravel',
    name: 'Laravel',
    source: 'packages',
    ecosystem: 'Packagist',
    packages: ['laravel/framework'],
    enabled: true,
  },
  {
    id: 'php',
    name: 'PHP',
    source: 'nvd',
    match: 'cpe:2.3:a:php:php',
    product: 'php',
    enabled: true,
  },
  {
    id: 'python',
    name: 'Python',
    source: 'nvd',
    match: 'cpe:2.3:a:python:python',
    product: 'python',
    enabled: true,
  },
  {
    id: 'mysql',
    name: 'MySQL',
    source: 'nvd',
    match: 'cpe:2.3:a:oracle:mysql',
    product: 'mysql',
    enabled: true,
  },
];

export async function getTechnologies() {
  let raw;

  try {
    raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return DEFAULTS.map(item => ({ ...item }));
  }

  const list = Array.isArray(raw) ? raw : raw.technologies;

  if (!Array.isArray(list) || !list.length) {
    return DEFAULTS.map(item => ({ ...item }));
  }

  return list
    .filter(item => item && item.id && item.name)
    .map(item => ({ enabled: true, ...item }));
}

export function technologyLabel(technologies, id) {
  return technologies.find(item => item.id === id)?.name || id;
}
