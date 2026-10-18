import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
import { useStageState } from '../stageContext'

/**
 * Newcomer entrance for primitives: fade in once, after persisting entities have
 * moved. `initial` applies only when the element mounts, so an entity that
 * continues across steps keeps its DOM node and morphs without fading again.
 */
export function useEnterMotion(appear: boolean | undefined) {
  const { instant } = useStageState()
  if (!appear) return {}
  return {
    initial: instant ? (false as const) : { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { delay: LAYOUT_T + ENTER_DELAY, duration: ENTER_T, ease: EASE },
    },
  }
}
