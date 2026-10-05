import { PACKAGE_VERSION, SITE_NAME, links } from './site';

describe('site configuration from .env', () => {
  it('defines a name and a semver package version', () => {
    expect(SITE_NAME).toBeTruthy();
    expect(PACKAGE_VERSION).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
  });

  it.each(Object.entries(links))('link %s is an absolute https URL', (_name, url) => {
    expect(new URL(url).protocol).toBe('https:');
  });
});

describe('documented version', () => {
  it('is the version of the package in this workspace (kept in sync by `yarn version-bump`)', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), '../../libs/easy-cancelable-promise/package.json'), 'utf8')) as { version: string };

    expect(PACKAGE_VERSION).toBe(manifest.version);
  });
});
