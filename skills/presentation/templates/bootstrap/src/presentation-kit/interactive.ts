/** ARIA widget roles whose focused element handles its own keys. */
const INTERACTIVE_ROLES = [
  'button',
  'checkbox',
  'combobox',
  'grid',
  'gridcell',
  'link',
  'listbox',
  'menu',
  'menubar',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'radiogroup',
  'scrollbar',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'tablist',
  'textbox',
  'toolbar',
  'tree',
  'treeitem',
]

/** Elements whose own keys must reach them instead of advancing the deck. */
const INTERACTIVE = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[contenteditable]:not([contenteditable="false"])',
  ...INTERACTIVE_ROLES.map((role) => `[role="${role}"]`),
].join(', ')

/** True when the event target is, or sits inside, an interactive control. */
export function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}
