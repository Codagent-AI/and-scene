/** Presentations can opt an interactive entity out of nav-key handling explicitly. */
export const NAV_EXEMPT_ATTRIBUTE = 'data-presentation-nav-exempt'

const FORM_CONTROL_SELECTOR = 'input, textarea, select'

/** True when the focused element should keep its own keys instead of driving the deck. */
export function isFocusedFormControl(): boolean {
  const active = document.activeElement
  if (!(active instanceof HTMLElement)) return false
  return (
    active.isContentEditable ||
    active.matches(FORM_CONTROL_SELECTOR) ||
    active.closest(`[${NAV_EXEMPT_ATTRIBUTE}]`) !== null
  )
}
