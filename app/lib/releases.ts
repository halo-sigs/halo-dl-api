export async function listObjects(bucket: R2Bucket): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let cursor: string | undefined;

  do {
    const listed = await bucket.list({
      limit: 1000,
      include: ["customMetadata"],
      cursor,
    });

    objects.push(...listed.objects);
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  return objects;
}

function versionOf(key: string) {
  return key.match(/halo(?:-pro)?-(.+?)\.jar/)?.[1];
}

function parseVersion(version: string) {
  const [core, prerelease] = version.split("-");

  return {
    core: core.split(".").map(Number),
    prerelease: prerelease?.split(".") ?? [],
  };
}

function compareVersions(a: R2Object, b: R2Object) {
  const versionA = versionOf(a.key);
  const versionB = versionOf(b.key);

  if (!versionA || !versionB) {
    return 0;
  }

  const parsedA = parseVersion(versionA);
  const parsedB = parseVersion(versionB);

  for (let i = 0; i < Math.max(parsedA.core.length, parsedB.core.length); i++) {
    const diff = (parsedB.core[i] ?? 0) - (parsedA.core[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }

  // A release is newer than any prerelease of the same version.
  if (parsedA.prerelease.length === 0 && parsedB.prerelease.length > 0) {
    return -1;
  }
  if (parsedA.prerelease.length > 0 && parsedB.prerelease.length === 0) {
    return 1;
  }

  for (let i = 0; i < Math.max(parsedA.prerelease.length, parsedB.prerelease.length); i++) {
    const partA = parsedA.prerelease[i];
    const partB = parsedB.prerelease[i];

    if (partA === undefined) {
      return 1;
    }
    if (partB === undefined) {
      return -1;
    }

    const numberA = Number(partA);
    const numberB = Number(partB);
    const isNumberA = !Number.isNaN(numberA);
    const isNumberB = !Number.isNaN(numberB);

    if (isNumberA && isNumberB) {
      if (numberA !== numberB) {
        return numberB - numberA;
      }
    } else if (isNumberA !== isNumberB) {
      // Numeric identifiers have lower precedence than alphanumeric ones.
      return isNumberA ? 1 : -1;
    } else if (partA !== partB) {
      return partA < partB ? 1 : -1;
    }
  }

  return 0;
}

export type ReleaseGroup = {
  title: string;
  items: R2Object[];
};

export function groupReleases(objects: R2Object[]): ReleaseGroup[] {
  const community = objects
    .filter(
      (item) =>
        item.key.startsWith("release/") &&
        !item.key.includes("pro") &&
        !item.key.includes("halo-1") &&
        !item.key.includes("v") &&
        !item.key.includes("sha256"),
    )
    .sort(compareVersions);

  const pro = objects
    .filter(
      (item) =>
        item.key.startsWith("release/") && item.key.includes("pro") && !item.key.includes("sha256"),
    )
    .sort(compareVersions);

  const prerelease = objects
    .filter(
      (item) =>
        item.key.startsWith("prerelease/") &&
        !item.key.includes("halo-1") &&
        !item.key.includes("sha256"),
    )
    .sort(compareVersions);

  return [
    { title: "Releases（社区版）", items: community },
    { title: "Releases（付费版）", items: pro },
    { title: "Releases（预发布版）", items: prerelease },
  ];
}

export function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return unit === 0 ? `${bytes} B` : `${value.toFixed(1)} ${units[unit]}`;
}
