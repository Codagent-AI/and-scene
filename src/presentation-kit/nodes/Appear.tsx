import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_T } from '../constants'
/**
 * Keep each Appear keyed by entity identity and mounted across grouped beats.
 * Pass `show` to keep the entity mounted for its exit animation when it leaves
 * a continuing scene; without it, an unmounted Appear leaves immediately unless
 * the caller supplies its own AnimatePresence boundary.
 */
export function Appear({ show, ...props }: HTMLMotionProps<'div'> & { show?: boolean }) {
  const entity = <motion.div data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={ENTER_T} {...props} />
  if (show === undefined) return entity
  return <AnimatePresence>{show && entity}</AnimatePresence>
}
