/** Semantic current-step state plus the stable styling hook, only when active. */
export function activeProps(active: boolean) {
  return active ? ({ 'aria-current': 'step', 'data-presentation-active': 'true' } as const) : {}
}
