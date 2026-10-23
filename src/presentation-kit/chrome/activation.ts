import type { MouseEvent } from 'react'

/** Mouse activation releases focus so navigation keys keep working; keyboard activation keeps it. */
export function activation(run: () => void) {
  return (e: MouseEvent<HTMLElement>) => {
    run()
    if (e.detail > 0) e.currentTarget.blur()
  }
}
