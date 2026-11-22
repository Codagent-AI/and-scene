import ts from 'typescript';
import { readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// Parse the explicit registry without executing app code or matching import-path substrings.
export function registryEntries(source) {
  const file = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
  let entries;
  const unwrap = node => ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'presentations' && node.initializer) {
      const array = unwrap(node.initializer);
      if (!ts.isArrayLiteralExpression(array)) throw new Error('presentation registry must be an explicit array');
      entries = array.elements.map(element => {
        if (!ts.isObjectLiteralExpression(element)) throw new Error('presentation registry entries must be explicit objects');
        let slug, module;
        for (const prop of element.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          const name = prop.name.getText(file).replace(/^['"]|['"]$/g, '');
          if (name === 'slug' && ts.isStringLiteral(prop.initializer)) slug = prop.initializer.text;
          if (name === 'load') {
            function findImport(child) {
              if (ts.isCallExpression(child) && child.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(child.arguments[0])) module = child.arguments[0].text;
              ts.forEachChild(child, findImport);
            }
            findImport(prop.initializer);
          }
        }
        return {slug, module};
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (!entries) throw new Error('presentation registry declaration missing');
  return entries;
}
export async function requireRegistration(slug, file = 'src/presentations/index.ts') {
  const entries = registryEntries(await readFile(file, 'utf8'));
  const entry = entries.find(e => e.slug === slug);
  if (!entry) throw new Error(`sample missing registration: ${slug}`);
  if (!entry.module?.startsWith('./')) throw new Error(`sample missing entry module: ${slug}`);
  const path = resolve(dirname(file), entry.module);
  for (const suffix of ['', '.tsx', '.ts', '/index.tsx', '/index.ts']) {
    try { await access(path + suffix); return; } catch { /* try a supported module suffix */ }
  }
  throw new Error(`sample missing entry module: ${slug} (${entry.module})`);
}
