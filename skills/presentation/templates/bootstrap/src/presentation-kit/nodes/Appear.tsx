import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { LAYOUT_T } from '../constants'

/** Wrap only entities introduced in the active state; shared layout entities stay unwrapped. */
export function Appear({ children, className, delay = LAYOUT_T, ...props }: { children: ReactNode; className?: string; delay?: number; 'data-presentation-appear'?: string }) {
  return <motion.div {...props} className={['scene-appear', className].filter(Boolean).join(' ')} data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.25, delay } }} exit={{ opacity: 0, transition: { duration: 0.25, delay: 0 } }}>{children}</motion.div>
}
