import type { MouseEvent } from 'react'

/** Pointer clicks release focus so deck keys keep working; keyboard activation keeps focus. */
function releaseFocusOnPointer(event: MouseEvent<HTMLElement>) {
  if (event.detail > 0) event.currentTarget.blur()
}

/** Click handler that runs `action`, then releases focus after pointer clicks. */
export function onPointerAwareClick(action: () => void) {
  return (event: MouseEvent<HTMLElement>) => {
    action()
    releaseFocusOnPointer(event)
  }
}
