// Builds the "how to fix it" text from a list of published fixes.
//
// An advisory usually publishes one fix per release branch (8.2.x, 8.3.x, ...).
// Collapsing them into a single number invents a version that does not exist,
// so every branch is kept and labelled.

const OSV_NO_FIX =
  'No hay versión corregida publicada. Revisa el aviso y aplica el parche del fabricante.';

const NVD_NO_FIX =
  'NVD no publica la versión corregida. Revisa el aviso y aplica el parche del fabricante.';

export function buildRemediation(name, fixes, { noFixMessage = OSV_NO_FIX } = {}) {
  if (!Array.isArray(fixes) || !fixes.length) return noFixMessage;

  if (fixes.length === 1) {
    const fix = fixes[0];
    return fix.boundary === 'including'
      ? `Actualiza ${name} a una versión superior a ${fix.version}.`
      : `Actualiza ${name} a ${fix.version} o superior.`;
  }

  const list = fixes.map(fix => `${fixLabel(fix)} (rama ${fix.branch})`).join(', ');
  return `Actualiza ${name} a una versión corregida: ${list}.`;
}

export function fixLabel(fix) {
  return fix.boundary === 'including' ? `>${fix.version}` : fix.version;
}

export { OSV_NO_FIX, NVD_NO_FIX };
