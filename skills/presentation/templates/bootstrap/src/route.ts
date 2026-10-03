export function normalizeRoute(pathname: string) {
  let decoded = pathname
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    // Keep malformed paths routable to the landing page instead of crashing boot.
  }
  return decoded.replace(/^\/+|\/+$/g, '')
}
