import { ENTER_DELAY, ENTER_T } from '../constants.ts'

/**
 * Motion props for one layout entity, spread onto a primitive. A newcomer fades in once the
 * persisting entities have settled; every entity fades out when it departs. Because the props
 * sit on the entity itself and no wrapper is added or removed, an entity keeps one DOM node for as
 * long as it stays on screen, so its layout morph is never interrupted by a remount.
 *
 * Every entity keeps the same `animate` target (fully visible). A newcomer that becomes a
 * continuing entity mid-entrance therefore finishes entering; dropping the target would send
 * its opacity back to the hidden `initial` value and leave it invisible.
 */
export function appearMotion(isNewcomer: boolean, delay = ENTER_DELAY) {
  const exit = { opacity: 0, transition: ENTER_T }
  return isNewcomer
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { ...ENTER_T, delay } }, exit }
    : { animate: { opacity: 1 }, exit }
}
