import type { CSSProperties } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants'
import type { Rect } from '../types'

/** Absolute placement within the design canvas: geometry only. */
export function placement(at?: Rect): CSSProperties {
  if (!at) return {}
  return { position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h }
}

/**
 * Newcomers fade in after persisting entities have settled. The animation runs
 * only on mount, so an entity that continues across steps is never re-faded.
 */
export function appearProps(appear?: boolean) {
  if (!appear) return {}
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY } },
  }
}

export const exitProps = { exit: { opacity: 0, transition: { duration: ENTER_T / 2 } } }

/** Common hooks every node exposes. */
export function nodeHooks(kind: string, layoutId?: string, variant?: string) {
  return {
    'data-presentation-node': kind,
    'data-presentation-id': layoutId,
    'data-presentation-variant': variant,
  }
}
