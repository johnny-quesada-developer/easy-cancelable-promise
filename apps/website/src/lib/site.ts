// Values come from apps/website/.env. Every read is a literal `import.meta.env.PUBLIC_*` member access on
// purpose: Vite replaces each one with its string value at compile time (do not alias `import.meta.env`,
// that defeats the static replacement).
// A missing variable fails the build/test run instead of shipping an "undefined" link.
const required = (name: string, value: string | undefined): string => {
  if (!value) throw new Error(`Missing ${name} in apps/website/.env`);

  return value;
};

export const SITE_NAME = required('PUBLIC_SITE_NAME', import.meta.env.PUBLIC_SITE_NAME);

/** The library version these docs and examples describe (the built package in this workspace). */
export const PACKAGE_VERSION = required('PUBLIC_PACKAGE_VERSION', import.meta.env.PUBLIC_PACKAGE_VERSION);

/** Prefix an internal path with the deployment base path (`/easy-cancelable-promise`). */
export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const clean = path.replace(/^\/+/, '');

  return clean ? `${base}/${clean}` : `${base}/`;
}

export const links = {
  repo: required('PUBLIC_REPO_URL', import.meta.env.PUBLIC_REPO_URL),
  npm: required('PUBLIC_NPM_URL', import.meta.env.PUBLIC_NPM_URL),
  easyWebWorker: required('PUBLIC_EASY_WEB_WORKER_URL', import.meta.env.PUBLIC_EASY_WEB_WORKER_URL),
  globalStateHooks: required('PUBLIC_GLOBAL_STATE_HOOKS_URL', import.meta.env.PUBLIC_GLOBAL_STATE_HOOKS_URL),
  jsonStorageFormatter: required(
    'PUBLIC_JSON_STORAGE_FORMATTER_URL',
    import.meta.env.PUBLIC_JSON_STORAGE_FORMATTER_URL,
  ),
  githubProfile: required('PUBLIC_GITHUB_PROFILE_URL', import.meta.env.PUBLIC_GITHUB_PROFILE_URL),
  linkedin: required('PUBLIC_LINKEDIN_URL', import.meta.env.PUBLIC_LINKEDIN_URL),
} as const;
