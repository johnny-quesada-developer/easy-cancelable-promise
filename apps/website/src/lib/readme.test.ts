import { readFileSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const root = resolve(process.cwd(), '../..');
const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const withoutImport = (code: string) => code.replace(/^import [^\n]+\n\n/, '');

describe('the README and the site show the same code', () => {
  const home = readdirSync(resolve(process.cwd(), 'src/snippets/home'));

  it('the home page has code samples', () => {
    expect(home.length).toBeGreaterThan(0);
  });

  it.each(home)('home sample %s is an example of the README', (file) => {
    const code = read(`src/snippets/home/${file}`).trim();

    // the README shows some samples without the line that imports the package
    expect(readme.includes(code) || readme.includes(withoutImport(code))).toBe(true);
  });

  it('the hero uses the wording of the README', () => {
    const page = read('src/pages/index.astro').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const text = readme.replace(/[*_]/g, '');

    for (const sentence of [
      "The cancelable promise you didn't know you needed.",
      "Promises that respect boundaries. Cancel what you don't need.",
      "Native promises can't be canceled. Their status can't be tracked. Once started, they run to completion. Always.",
    ]) {
      expect(text, `README: ${sentence}`).toContain(sentence);
      expect(page, `home page: ${sentence}`).toContain(sentence);
    }
  });
});

describe('code samples are named after their files', () => {
  const pages = ['docs', 'examples'].flatMap((collection) =>
    readdirSync(resolve(process.cwd(), 'src/content', collection)).map((file) => `src/content/${collection}/${file}`),
  );

  it.each(pages)('%s', (page) => {
    const source = read(page);
    const imports = new Map(Array.from(source.matchAll(/import (\w+) from '@(snippets|examples)\/([^']+)\?raw';/g), (match) => [match[1], `src/${match[2]}/${match[3]}`]));

    for (const [, variable, title] of source.matchAll(/<CodeBlock code=\{(\w+)\}[^>]*title="([^"]*)"/g)) {
      const file = imports.get(variable);

      expect(file, `${variable} is not imported from a file`).toBeDefined();
      expect(title).toBe(basename(file!));
      expect(() => read(file!)).not.toThrow();
    }
  });
});
