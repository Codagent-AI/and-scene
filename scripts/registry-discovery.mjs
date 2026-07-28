// Cross-checks the presentations declared in the registry source against the
// slugs that were actually discovered on the rendered landing page.
//
// Landing-page discovery is how verification finds routes to render. If a
// redesign ever stops emitting real `<a href="/slug">` entries inside
// `[data-testid="presentation-registry"]`, discovery returns zero slugs — and
// without this cross-check verification would skip every render check and still
// report "Verification passed".

import { readFile } from 'node:fs/promises'

/** Counts the `slug:` entries declared in a presentations registry module. */
export function countRegisteredSlugs(registrySource) {
  return (registrySource.match(/^[ \t]*slug:\s*['"`]/gm) ?? []).length
}

/**
 * Reads a registry module, treating an unreadable file as an empty registry so
 * this cross-check can never itself become the reason verification fails.
 */
export async function readRegistrySource(registryPath) {
  try {
    return await readFile(registryPath, 'utf8')
  } catch {
    return ''
  }
}

/**
 * Returns failure descriptions when the registry declares presentations that
 * landing-page discovery missed. An empty registry is a legitimate freshly
 * scaffolded project and produces no failure.
 */
export function findDiscoveryFailures(registeredCount, discoveredSlugs) {
  if (registeredCount > 0 && discoveredSlugs.length === 0) {
    return [
      `src/presentations/index.ts declares ${registeredCount} presentation(s) but none were discoverable on the landing page — each entry must render an <a href="/slug"> inside [data-testid="presentation-registry"]`,
    ]
  }
  return []
}
