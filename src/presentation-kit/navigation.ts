export type NavigationDirection = 'next' | 'previous'

export function getNavigationTarget(index: number, direction: NavigationDirection, count: number) {
  if (count <= 0) return 0
  const delta = direction === 'next' ? 1 : -1
  return Math.max(0, Math.min(count - 1, index + delta))
}
