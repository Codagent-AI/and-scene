const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, [role="button"], [role="tab"], [role="slider"], [contenteditable=""], [contenteditable="true"]'

/** True when keyboard focus is on a control that owns its own key behavior. */
export function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}
