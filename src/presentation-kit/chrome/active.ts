/** Semantic current-step state plus the stable styling hook; omitted when inactive. */
export function activeAttrs(active: boolean) {
  return {
    'data-presentation-active': active ? 'true' : undefined,
    'aria-current': active ? ('step' as const) : undefined,
  }
}
