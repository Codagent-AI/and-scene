export function resolvePresentationSlug(pathname: string, baseUrl: string): string {
  let path: string
  try {
    path = pathname.split('/').filter(Boolean).map(decodeURIComponent).join('/')
  } catch {
    return ''
  }
  const base = baseUrl.split('/').filter(Boolean).map(decodeURIComponent).join('/')
  if (!base) return path
  if (path === base) return ''
  return path.startsWith(`${base}/`) ? path.slice(base.length + 1) : path
}
