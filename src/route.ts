export function resolvePresentationSlug(pathname: string, baseUrl: string): string {
  const path = pathname.split('/').filter(Boolean).join('/')
  const base = baseUrl.split('/').filter(Boolean).join('/')
  if (!base) return path
  if (path === base) return ''
  return path.startsWith(`${base}/`) ? path.slice(base.length + 1) : path
}
