export function routeSlug(pathname: string): string | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug || null
}
