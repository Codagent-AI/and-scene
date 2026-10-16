import type { MouseEvent } from 'react'

/** Runs `action`, then blurs after a pointer click so keyboard navigation keeps working; keyboard activation stays focused. */
export const pointerSafe = (action: () => void) => (e: MouseEvent<HTMLElement>) => {
  action()
  if (e.detail > 0) e.currentTarget.blur()
}
