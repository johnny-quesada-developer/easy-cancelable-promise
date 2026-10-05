#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const semver = createRequire(import.meta.url)('semver');

const readManifest = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/**
 * Publishing sends ./dist as it is, it does not build. A dist that was built before the last version
 * bump would publish the previous version again, so it is refused here.
 */
export function assertDistIsCurrent(packageDir) {
  const distManifest = path.join(packageDir, 'dist', 'package.json');
  const { name, version } = readManifest(path.join(packageDir, 'package.json'));

  if (!fs.existsSync(distManifest)) {
    throw new Error(`${name}@${version} is not built: dist/package.json does not exist. Run \`yarn build\` first.`);
  }

  const built = readManifest(distManifest).version;

  if (built !== version) {
    throw new Error(
      `dist/ holds ${name}@${built} but package.json says ${version}. ` +
        'The package was not built after the version changed. Run `yarn build` (or `yarn prepare-packages`) first.',
    );
  }
}

export function assertVersionMatchesTag(packageDir, tag) {
  const { name, version } = readManifest(path.join(packageDir, 'dist', 'package.json'));
  const prerelease = semver.prerelease(version);

  if (tag === 'beta' && prerelease?.[0] !== 'beta') {
    throw new Error(`${name}@${version} cannot go to the "beta" tag: the version must look like x.y.z-beta.N`);
  }
  if (tag === 'latest' && prerelease) {
    throw new Error(`${name}@${version} cannot go to the "latest" tag: it is a prerelease`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    assertDistIsCurrent(process.cwd());
    assertVersionMatchesTag(process.cwd(), process.argv[2]);
  } catch (error) {
    console.error(`[publish] ${error.message}`);
    process.exit(1);
  }
}
