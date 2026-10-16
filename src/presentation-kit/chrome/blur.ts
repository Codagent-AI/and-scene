import type { MouseEvent } from 'react'

/** Blur after a pointer click so keyboard navigation keeps working; keyboard activation stays focused. */
export const blurOnPointer = (e: MouseEvent<HTMLElement>) => {
  if (e.detail > 0) e.currentTarget.blur()
}
