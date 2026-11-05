// Extracts presentation slugs from the text of the explicit presentation index.
// Comments are ignored (a commented-out entry is not registered); string literals are left intact.
export function stripComments(source) {
 let out = '', quote = ''
 for (let i = 0; i < source.length; i++) {
  const c = source[i], next = source[i + 1]
  if (quote) { out += c; if (c === '\\') out += source[++i] ?? ''; else if (c === quote) quote = ''; continue }
  if (c === '"' || c === "'" || c === '`') { quote = c; out += c; continue }
  if (c === '/' && next === '/') { while (i < source.length && source[i] !== '\n') i++; out += '\n'; continue }
  if (c === '/' && next === '*') { const end = source.indexOf('*/', i + 2); i = end < 0 ? source.length : end + 1; out += ' '; continue }
  out += c
 }
 return out
}
export function registeredSlugs(source) {
 return [...stripComments(source).matchAll(/\bslug\s*:\s*(['"])([^'"/]+)\1/g)].map(match => match[2])
}
