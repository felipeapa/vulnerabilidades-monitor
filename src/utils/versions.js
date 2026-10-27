// Numeric-aware version comparison for semver-like strings ("5.12.2", "8.1.31").
// Good enough for picking fix thresholds; it is not a full semver implementation.
export function compareVersions(a, b) {
  const left = String(a ?? '').split(/[.+-]/);
  const right = String(b ?? '').split(/[.+-]/);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const aPart = left[index] ?? '0';
    const bPart = right[index] ?? '0';
    const aNumber = Number.parseInt(aPart, 10);
    const bNumber = Number.parseInt(bPart, 10);

    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
      if (aNumber !== bNumber) return aNumber - bNumber;
      continue;
    }

    const diff = aPart.localeCompare(bPart);
    if (diff !== 0) return diff;
  }

  return 0;
}

// Release branch of a version ("8.4.27" -> "8.4"). Fixes are published per branch,
// so a single advisory can carry several unrelated fix versions.
export function versionBranch(version) {
  const parts = String(version ?? '').split(/[.+-]/);
  if (parts.length < 2) return parts[0] || '';
  return `${parts[0]}.${parts[1]}`;
}
