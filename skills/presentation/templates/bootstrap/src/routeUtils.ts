export function safeDecodePathSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return ''
  }
}
