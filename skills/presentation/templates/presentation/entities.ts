// Stable identities for this presentation. Every persisting entity keeps the same id
// across steps, so its layoutId morphs instead of remounting.
export const NAMESPACE = '__SLUG__'

export function layoutIdFor(name: string): string {
  return `${NAMESPACE}:${name}`
}
