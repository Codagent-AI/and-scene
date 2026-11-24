export function resolvePresentation<T extends { slug: string }>(entries: readonly T[], pathname: string): T | undefined {
  const slug = pathname.split('/').filter(Boolean)[0]
  return entries.find(entry => entry.slug === slug)
}
