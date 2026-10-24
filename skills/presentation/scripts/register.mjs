// Adds a presentation to the explicit registry in src/presentations/index.ts.
import fs from 'node:fs'
import path from 'node:path'

export const REGISTRY_MARKER = '// presentations:end'

export function registryEntry({ slug, title, dir = slug }, indent = '  ') {
  return [
    '{',
    `  slug: '${slug}',`,
    `  title: ${JSON.stringify(title)},`,
    `  load: () => import('./${dir}/Talk'),`,
    '},',
  ]
    .map((line, i) => (i === 0 ? line : `${indent}${line}`))
    .join('\n')
}

/** Returns the registry source with one new entry added before the marker; existing entries stay. */
export function registerInSource(source, presentation) {
  if (new RegExp(`slug:\\s*['"]${presentation.slug}['"]`).test(source)) {
    throw new Error(`Presentation "${presentation.slug}" is already registered`)
  }
  if (!source.includes(REGISTRY_MARKER)) {
    throw new Error(`Registry has no "${REGISTRY_MARKER}" marker; add the entry by hand`)
  }
  const marker = /^([ \t]*)\/\/ presentations:end/m
  const updated = source.replace(marker, (_line, indent) => `${indent}${registryEntry(presentation, indent)}\n${indent}${REGISTRY_MARKER}`)
  if (!new RegExp(`slug:\\s*['"]${presentation.slug}['"]`).test(updated)) {
    throw new Error('Registration did not change the registry; add the entry by hand')
  }
  return updated
}

export function registerPresentation(appRoot, presentation) {
  const file = path.join(appRoot, 'src', 'presentations', 'index.ts')
  fs.writeFileSync(file, registerInSource(fs.readFileSync(file, 'utf8'), presentation))
}
