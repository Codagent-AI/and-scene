import { motion, useIsPresent } from 'motion/react'
import type { ReactNode } from 'react'

/** Wrap only entities introduced in the active state; shared layout entities stay unwrapped. */
export function Appear({ children, className, delay = 0.6, ...props }: { children: ReactNode; className?: string; delay?: number; 'data-presentation-appear'?: string }) {
  const isPresent = useIsPresent()
  return <motion.div {...props} className={['scene-appear', className].filter(Boolean).join(' ')} data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: isPresent ? delay : 0.6 } }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>{children}</motion.div>
}
