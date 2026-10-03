import { motion, type HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type BoxProps = HTMLMotionProps<'div'> & { entityId: string; icon?: LucideIcon; children?: ReactNode }

export function Box({ entityId, icon: Icon, children, className, ...props }: BoxProps) {
  return <motion.div layoutId={entityId} data-scene-node="box" data-entity-id={entityId} className={className} {...props}>
    {Icon ? <Icon aria-hidden="true" data-scene-glyph="true" /> : null}{children}
  </motion.div>
}
