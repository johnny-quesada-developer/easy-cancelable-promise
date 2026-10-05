/**
 * Packaging interop regression test.
 *
 * Packs the real publishable artifact (from ./dist), installs it into a throwaway project
 * exactly like a consumer would, and then imports the root entry and the subpaths under:
 *   - esbuild (via tsx)
 *   - Node native ESM
 *   - Node CJS require
 *   - a browser bundle (esbuild --platform=browser)
 *
 * It also guards the single class instance: every entry must import its sibling modules instead
 * of embedding them, so the CancelablePromise class exists once per consumer bundle and
 * `instanceof` works across subpaths.
 *
 * It fails (non-zero exit) if a check does not pass. Every check runs, so the report is complete.
 *
 * Run with: tsx scripts/test-interop.ts   (assumes `dist/` was already built)
 *
 * EASY_CANCELABLE_PROMISE_INTEROP_TARBALL=<file.tgz> runs the same checks against another
 * tarball, for example a published version downloaded with `npm pack easy-cancelable-promise@x.y.z`.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.resolve(root, 'dist');
const workspaceRoot = path.resolve(root, '../..');
const externalTarball = process.env.EASY_CANCELABLE_PROMISE_INTEROP_TARBALL;

function fail(msg: string): never {
  console.error(`\n[interop] FAIL: ${msg}`);
  process.exit(1);
}

function resolveBin(name: string): string {
  const candidates = [
    path.resolve(root, 'node_modules/.bin', name),
    path.resolve(workspaceRoot, 'node_modules/.bin', name),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found)
    fail(
      `could not find the \`${name}\` binary in ${candidates.join(' or ')}.`,
    );
  return found;
}

const tsxBin = resolveBin('tsx');
const esbuildBin = resolveBin('esbuild');

function run(cmd: string, args: string[], cwd: string): string {
  try {
    return execFileSync(cmd, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const { stdout = '', stderr = '' } = error as {
      stdout?: string;
      stderr?: string;
    };
    throw new Error(`\`${cmd} ${args.join(' ')}\` failed:\n${stdout}${stderr}`);
  }
}

const failures: string[] = [];

/** Run a check and keep going, the failures are reported at the end. */
function check(name: string, callback: () => string): void {
  try {
    console.log(`[interop] ${name}: ${callback()}`);
  } catch (error) {
    failures.push(name);
    console.error(
      `[interop] ${name}: FAIL: ${(error as Error).message.trim()}`,
    );
  }
}

if (!externalTarball && !fs.existsSync(path.join(dist, 'bundle.mjs'))) {
  fail('dist/ is not built. Run `yarn build` first.');
}

const work = fs.mkdtempSync(
  path.join(os.tmpdir(), 'easy-cancelable-promise-interop-'),
);

try {
  // 1) Install the publishable tarball into a throwaway consumer project.
  fs.writeFileSync(
    path.join(work, 'package.json'),
    JSON.stringify(
      { name: 'interop-scratch', private: true, version: '1.0.0' },
      null,
      2,
    ),
  );

  try {
    if (externalTarball) {
      run(
        'npm',
        ['install', path.resolve(externalTarball), '--no-audit', '--no-fund'],
        work,
      );
    } else {
      const tarballName = run('npm', ['pack', '--silent'], dist)
        .trim()
        .split('\n')
        .pop()!
        .trim();
      const tarballPath = path.join(dist, tarballName);
      try {
        run('npm', ['install', tarballPath, '--no-audit', '--no-fund'], work);
      } finally {
        fs.rmSync(tarballPath, { force: true });
      }
    }
  } catch (error) {
    fail((error as Error).message);
  }

  const namedExports = [
    'CancelableAbortController',
    'CancelablePromise',
    'defer',
    'groupAsCancelablePromise',
    'isCancelableAbortSignal',
    'isCancelablePromise',
    'isPromise',
    'toCancelablePromise',
  ];

  const lines = (source: string[]) => source.join('\n');

  // 2) ESM probe: root entry + subpaths, named and default imports.
  const esmProbe = lines([
    "import * as root from 'easy-cancelable-promise';",
    "import RootDefault, { CancelablePromise as RootCancelablePromise } from 'easy-cancelable-promise';",
    "import CancelablePromiseDefault, { CancelablePromise } from 'easy-cancelable-promise/CancelablePromise';",
    "import deferDefault, { defer } from 'easy-cancelable-promise/defer';",
    "import { groupAsCancelablePromise } from 'easy-cancelable-promise/groupAsCancelablePromise';",
    "import { isCancelablePromise } from 'easy-cancelable-promise/isCancelablePromise';",
    'const exit = (code, message) => { console.error(message); process.exit(code); };',
    `for (const name of ${JSON.stringify(namedExports)}) {`,
    "  if (typeof root[name] !== 'function') exit(3, 'root export not callable: ' + name);",
    '}',
    'for (const fn of [RootDefault, CancelablePromiseDefault, CancelablePromise, deferDefault, defer, groupAsCancelablePromise, isCancelablePromise]) {',
    "  if (typeof fn !== 'function') exit(4, 'export not callable');",
    '}',
    "if (deferDefault !== defer) exit(5, 'the default export of the defer subpath is not defer');",
    // regression: one CancelablePromise class for every entry of the package
    'if (RootDefault !== CancelablePromise || RootCancelablePromise !== CancelablePromise || CancelablePromiseDefault !== CancelablePromise) {',
    "  exit(6, 'the root entry and the CancelablePromise subpath do not share the class');",
    '}',
    "if (!(defer().promise instanceof CancelablePromise)) exit(7, 'defer().promise is not an instance of the CancelablePromise subpath class');",
    "if (!(groupAsCancelablePromise([() => Promise.resolve(1)]) instanceof CancelablePromise)) exit(8, 'groupAsCancelablePromise() is not an instance of the CancelablePromise subpath class');",
    "if (!isCancelablePromise(defer().promise)) exit(9, 'isCancelablePromise does not recognize a promise from the defer subpath');",
    'const deferred = defer();',
    "deferred.resolve('value');",
    'const value = await deferred.promise;',
    "if (value !== 'value') exit(10, 'the deferred promise did not resolve');",
    "console.log('ok:' + JSON.stringify(Object.keys(root).sort()));",
  ]);

  const expectOk = (output: string): string => {
    const trimmed = output.trim();
    if (!trimmed.includes('ok:'))
      throw new Error(`unexpected output: ${trimmed}`);
    return trimmed;
  };

  check('tsx (esbuild)', () => {
    const file = path.join(work, 'probe.mts');
    fs.writeFileSync(file, esmProbe);
    return expectOk(run(tsxBin, [file], work));
  });

  check('node ESM', () => {
    const file = path.join(work, 'probe.mjs');
    fs.writeFileSync(file, esmProbe);
    return expectOk(run('node', [file], work));
  });

  // 3) Browser bundle: resolves the `import` condition, so it is built from the .mjs files.
  type Metafile = { inputs: Record<string, { imports: { path: string }[] }> };
  let metafile: Metafile | null = null;

  check('browser bundle', () => {
    const entry = path.join(work, 'browser-entry.mjs');
    const bundle = path.join(work, 'browser-bundle.mjs');
    fs.writeFileSync(entry, esmProbe);
    run(
      esbuildBin,
      [
        entry,
        '--bundle',
        '--platform=browser',
        '--format=esm',
        '--metafile=meta.json',
        `--outfile=${bundle}`,
      ],
      work,
    );
    metafile = JSON.parse(
      fs.readFileSync(path.join(work, 'meta.json'), 'utf8'),
    ) as Metafile;
    return expectOk(run('node', [bundle], work));
  });

  // 3b) regression: the bundle has the CancelablePromise module once, the other entries import it.
  check('single CancelablePromise module', () => {
    if (!metafile) throw new Error('the browser bundle was not created');

    const packageInputs = Object.keys(metafile.inputs).filter((input) =>
      input.includes('node_modules/easy-cancelable-promise/'),
    );
    const classModule = packageInputs.filter(
      (input) => path.basename(input) === 'CancelablePromise.mjs',
    );
    if (classModule.length !== 1) {
      throw new Error(
        `expected CancelablePromise.mjs exactly once in the bundle inputs, found ${classModule.length}: ${packageInputs.join(', ')}`,
      );
    }

    // an entry that does not import the class module carries its own copy of the class
    for (const name of [
      'bundle.mjs',
      'defer.mjs',
      'groupAsCancelablePromise.mjs',
    ]) {
      const input = packageInputs.find(
        (candidate) => path.basename(candidate) === name,
      );
      if (!input)
        throw new Error(
          `${name} is not part of the bundle inputs: ${packageInputs.join(', ')}`,
        );

      const imports = metafile.inputs[input].imports.map(
        (imported) => imported.path,
      );
      if (!imports.includes(classModule[0])) {
        throw new Error(
          `${name} does not import CancelablePromise.mjs, it embeds its own copy of the class`,
        );
      }
    }

    return `ok:${JSON.stringify(packageInputs.map((input) => path.basename(input)).sort())}`;
  });

  // 4) CJS probe.
  check('node CJS', () => {
    const file = path.join(work, 'probe.cjs');
    fs.writeFileSync(
      file,
      lines([
        "const root = require('easy-cancelable-promise');",
        "const classModule = require('easy-cancelable-promise/CancelablePromise');",
        "const deferModule = require('easy-cancelable-promise/defer');",
        "const { groupAsCancelablePromise } = require('easy-cancelable-promise/groupAsCancelablePromise');",
        'const exit = (code, message) => { console.error(message); process.exit(code); };',
        `for (const name of ${JSON.stringify(namedExports)}) {`,
        "  if (typeof root[name] !== 'function') exit(11, 'cjs root export not callable: ' + name);",
        '}',
        "if (typeof root.default !== 'function') exit(12, 'cjs root default not callable');",
        "if (typeof deferModule.default !== 'function' || typeof deferModule.defer !== 'function') exit(13, 'cjs defer not callable');",
        "if (deferModule.__esModule !== true) exit(14, 'cjs missing __esModule');",
        "if (root.CancelablePromise !== classModule.CancelablePromise) exit(15, 'cjs: the root entry and the CancelablePromise subpath do not share the class');",
        "if (!(deferModule.defer().promise instanceof classModule.CancelablePromise)) exit(16, 'cjs: defer().promise is not an instance of the CancelablePromise subpath class');",
        "if (!(groupAsCancelablePromise([() => Promise.resolve(1)]) instanceof classModule.CancelablePromise)) exit(17, 'cjs: groupAsCancelablePromise() is not an instance of the CancelablePromise subpath class');",
        "console.log('ok:' + JSON.stringify(Object.keys(root).sort()));",
      ]),
    );
    return expectOk(run('node', [file], work));
  });

  // 4a) Node loads the ESM and the CommonJS builds as separate copies when a process mixes
  // import and require: isCancelablePromise must recognize the promises of the other copy.
  check('ESM and CJS copies', () => {
    const file = path.join(work, 'probe-mixed.mjs');
    fs.writeFileSync(
      file,
      lines([
        "import { createRequire } from 'node:module';",
        "import { defer, isCancelablePromise } from 'easy-cancelable-promise';",
        "const cjs = createRequire(import.meta.url)('easy-cancelable-promise');",
        'const exit = (code, message) => { console.error(message); process.exit(code); };',
        "if (cjs.defer === defer) exit(19, 'expected the ESM and the CommonJS builds to be separate copies');",
        "if (!isCancelablePromise(cjs.defer().promise)) exit(20, 'the ESM build does not recognize a promise of the CommonJS build');",
        "if (!cjs.isCancelablePromise(defer().promise)) exit(21, 'the CommonJS build does not recognize a promise of the ESM build');",
        "console.log('ok:recognized across copies');",
      ]),
    );
    return expectOk(run('node', [file], work));
  });

  // 4b) Legacy deep imports ending in .js are not part of the exports map, they are read from disk.
  check('legacy .js files', () => {
    const file = path.join(work, 'probe-legacy.cjs');
    fs.writeFileSync(
      file,
      lines([
        "const path = require('node:path');",
        "const dir = path.dirname(require.resolve('easy-cancelable-promise/package.json'));",
        "const { CancelablePromise } = require(path.join(dir, 'CancelablePromise.js'));",
        "const { defer } = require(path.join(dir, 'defer.js'));",
        "if (!(defer().promise instanceof CancelablePromise)) { console.error('legacy .js files do not share the class'); process.exit(18); }",
        "console.log('ok:' + JSON.stringify(Object.keys(require(path.join(dir, 'bundle.js'))).sort()));",
      ]),
    );
    return expectOk(run('node', [file], work));
  });

  if (failures.length)
    fail(`${failures.length} check(s) failed: ${failures.join(', ')}`);

  console.log(
    '\n[interop] PASS: root entry and subpaths work under tsx (esbuild), Node ESM, Node CJS and a browser bundle, with a single CancelablePromise class.',
  );
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
