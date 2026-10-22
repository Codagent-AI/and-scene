/**
 * Wraps a control action. After a pointer click the control gives up focus, so the arrow
 * keys keep navigating the deck (a focused button would otherwise keep them for itself).
 */
export function press(action: () => void) {
  return (event: { detail: number; currentTarget: { blur: () => void } }) => {
    action()
    if (event.detail > 0) event.currentTarget.blur()
  }
}
