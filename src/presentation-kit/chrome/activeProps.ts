export function activeProps(active: boolean, current: 'step' | 'true') {
  return active ? { 'aria-current': current, 'data-presentation-active': '' } : {}
}
