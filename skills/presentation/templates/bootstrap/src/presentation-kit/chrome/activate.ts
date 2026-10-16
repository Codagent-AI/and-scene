import type { MouseEvent } from 'react'

/** Run `action`; drop focus after pointer clicks so keyboard navigation keeps working. */
export function activate(action: () => void) {
  return (e: MouseEvent<HTMLButtonElement>) => {
    action()
    if (e.detail > 0) e.currentTarget.blur()
  }
}
