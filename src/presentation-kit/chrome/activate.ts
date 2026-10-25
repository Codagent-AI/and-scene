import type { MouseEvent } from 'react'

/**
 * Runs a chrome action. After a pointer click the button is blurred so the
 * deck's keys keep working; keyboard activation keeps focus on the control.
 */
export function activate(action: () => void) {
  return (e: MouseEvent<HTMLElement>) => {
    action()
    if (e.detail > 0) e.currentTarget.blur()
  }
}
