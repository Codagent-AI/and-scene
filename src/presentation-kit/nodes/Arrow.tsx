import type { ComponentPropsWithoutRef } from 'react'
import { motion } from 'motion/react'

export interface ArrowProps extends ComponentPropsWithoutRef<typeof motion.div> {
  /** Stable identity this connector keeps across steps, driving layout morphs. */
  layoutId: string
}

export function Arrow({ layoutId, className, children, ...rest }: ArrowProps) {
  return (
    <motion.div layoutId={layoutId} data-presentation-arrow="" className={className} {...rest}>
      {children}
    </motion.div>
  )
}
