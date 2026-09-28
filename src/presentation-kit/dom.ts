/** Presentations can opt an interactive entity out of nav-key handling explicitly. */
export const NAV_EXEMPT_ATTRIBUTE = 'data-presentation-nav-exempt'

const FORM_CONTROL_SELECTOR = 'input, textarea, select'

/** ARIA widget roles that consume arrow/Space keys themselves. */
const WIDGET_ROLE_SELECTOR = [
  'textbox',
  'searchbox',
  'combobox',
  'listbox',
  'option',
  'slider',
  'spinbutton',
  'scrollbar',
  'tablist',
  'tab',
  'menu',
  'menubar',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'radiogroup',
  'radio',
  'checkbox',
  'switch',
  'tree',
  'treeitem',
  'treegrid',
  'grid',
  'gridcell',
]
  .map((role) => `[role="${role}"]`)
  .join(', ')

/** True when the focused element should keep its own keys instead of driving the deck. */
export function isFocusedFormControl(): boolean {
  const active = document.activeElement
  if (!(active instanceof HTMLElement)) return false
  return (
    active.isContentEditable ||
    active.matches(FORM_CONTROL_SELECTOR) ||
    active.closest(WIDGET_ROLE_SELECTOR) !== null ||
    active.closest(`[${NAV_EXEMPT_ATTRIBUTE}]`) !== null
  )
}
