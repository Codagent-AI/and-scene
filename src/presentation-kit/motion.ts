import { ENTER_DELAY, ENTER_T, EASE, EXIT_T, LAYOUT_T } from './constants'

export const LAYOUT_TRANSITION = { layout: { duration: LAYOUT_T, ease: EASE } }

/** Newcomer enter timing; caller offsets can only delay, never advance. */
export function appearTransition(offset = 0) {
  return { duration: ENTER_T, delay: ENTER_DELAY + Math.max(0, offset), ease: EASE }
}

export const EXIT_TRANSITION = { duration: EXIT_T }

/**
 * Props that make an element a newcomer: it fades in after persisting entities
 * settle. `appear` of `false`/`undefined` adds no enter behavior, so continuing
 * entities are never faded. Every element can exit when its parent is removed.
 */
export function presenceProps(appear: boolean | number | undefined) {
  const enter = appear === undefined || appear === false ? null : appear === true ? 0 : appear
  return {
    initial: enter === null ? undefined : { opacity: 0 },
    animate: enter === null ? undefined : { opacity: 1, transition: appearTransition(enter) },
    exit: { opacity: 0, transition: EXIT_TRANSITION },
  }
}
