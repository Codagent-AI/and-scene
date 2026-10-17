import type { MouseEvent } from 'react'

/** Pointer clicks release focus so deck keys keep working; keyboard activation keeps focus. */
export function releaseFocusOnPointer(event: MouseEvent<HTMLElement>) {
  if (event.detail > 0) event.currentTarget.blur()
}
