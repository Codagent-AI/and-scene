// Cross-checks the presentations declared in the registry source against the
// slugs that were actually discovered on the rendered landing page.
//
// Landing-page discovery is how verification finds routes to render. If a
// redesign ever stops emitting real `<a href="/slug">` entries inside
// `[data-testid="presentation-registry"]`, discovery returns zero slugs — and
// without this cross-check verification would skip every render check and still
// report "Verification passed".

import { readFile } from 'node:fs/promises'

/** Extracts the slugs declared in a presentations registry module, in order. */
export function parseRegisteredSlugs(registrySource) {
  const matches = registrySource.matchAll(/^[ \t]*slug:\s*['"`]([^'"`]+)['"`]/gm)
  return Array.from(matches, (match) => match[1])
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
 * Returns one failure per registered presentation that landing-page discovery
 * missed, so partial loss fails as loudly as total loss — a registry entry that
 * is never discovered is a presentation verification never renders. An empty
 * registry is a legitimate freshly scaffolded project and produces no failure.
 */
export function findDiscoveryFailures(registeredSlugs, discoveredSlugs) {
  return registeredSlugs
    .filter((slug) => !discoveredSlugs.includes(slug))
    .map(
      (slug) =>
        `registered presentation "${slug}" was not discoverable on the landing page — it must render an <a href="/${slug}"> inside [data-testid="presentation-registry"]`,
    )
}
