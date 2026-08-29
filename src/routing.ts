export function pathnameToSlug(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  return segments.length === 1 ? segments[0] ?? null : null
}
