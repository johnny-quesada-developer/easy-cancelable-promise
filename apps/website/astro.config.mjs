import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { CSS_VARIABLE_PREFIX, shikiThemes } from './src/lib/code-themes.mjs';
import { unified } from '@astrojs/markdown-remark';
import { rehypeCodeBlocks, rehypeSymptoms, rehypeTableWrap } from './src/lib/rehype/index.mjs';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// Site URL and base path live in apps/website/.env (PUBLIC_SITE_URL, PUBLIC_BASE_PATH).
const env = loadEnv('production', fileURLToPath(new URL('.', import.meta.url)), 'PUBLIC_');
const SITE = env.PUBLIC_SITE_URL;
const BASE = env.PUBLIC_BASE_PATH;

if (!SITE || !BASE) throw new Error('PUBLIC_SITE_URL and PUBLIC_BASE_PATH must be set in apps/website/.env');

// The site runs against the BUILT package (libs/easy-cancelable-promise/dist), the same files npm publishes,
// so every example and snippet here is also a check of the published artifact.
const packageDist = here('../../libs/easy-cancelable-promise/dist');

if (!existsSync(`${packageDist}/bundle.mjs`)) {
  throw new Error('libs/easy-cancelable-promise/dist is missing. Run `yarn build easy-cancelable-promise` first.');
}

const debugLibrary = here('./src/lib/debug-library.ts');

// The entries that load the DevTools integration. Their packages declare no side effects, so a bundler
// would drop an import that is there only for what it does.
const debugEntry = /^(react-global-state-hooks|react-hooks-global-states)\/debug$/;

/** Every store of the site is created with the DevTools integration loaded (see src/lib/debug-library.ts). */
const devtoolsEverywhere = {
  name: 'devtools-everywhere',
  enforce: 'pre',
  async resolveId(id, importer, options) {
    // pages are rendered to HTML without it: the extension lives in the browser
    if (options?.ssr) return null;
    if (id === 'react-global-state-hooks' && importer !== debugLibrary) return debugLibrary;
    if (!debugEntry.test(id)) return null;

    const resolved = await this.resolve(id, importer, { ...options, skipSelf: true });

    return resolved && { ...resolved, moduleSideEffects: true };
  },
};

export default defineConfig({
  site: SITE,
  base: BASE,
  output: 'static',
  trailingSlash: 'always',
  // The bottom-of-page Astro toolbar is a dev-server-only overlay; turned off so it can never show up.
  devToolbar: { enabled: false },
  build: { format: 'directory' },
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    shikiConfig: { themes: shikiThemes, defaultColor: false, cssVariablePrefix: CSS_VARIABLE_PREFIX },
    // unified (not Astro 7's default Sätteri): the rehype plugins give MDX the document structure of the site.
    processor: unified({ rehypePlugins: [rehypeSymptoms, rehypeCodeBlocks, rehypeTableWrap] }),
  },
  vite: {
    plugins: [devtoolsEverywhere],
    resolve: {
      // Subpath aliases precede the bare-name alias.
      alias: [
        { find: /^@snippets\/(.*)$/, replacement: `${here('./src/snippets')}/$1` },
        { find: /^@examples\/(.*)$/, replacement: `${here('./src/examples')}/$1` },
        { find: /^easy-cancelable-promise\/(.*)$/, replacement: `${packageDist}/$1.mjs` },
        { find: /^easy-cancelable-promise$/, replacement: `${packageDist}/bundle.mjs` },
      ],
    },
  },
});
