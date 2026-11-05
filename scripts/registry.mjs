// Extracts presentation slugs from the text of the explicit presentation index.
export function registeredSlugs(source) {
 return [...source.matchAll(/\bslug\s*:\s*(['"])([^'"/]+)\1/g)].map(match => match[2])
}
