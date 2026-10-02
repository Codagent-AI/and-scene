import { motion } from 'motion/react'
import type { StyleProps } from '../types'

export function Emphasis({ id, className, style, children, ...props }: StyleProps & { children?: React.ReactNode } & Record<string, unknown>) {
  return <motion.div layout layoutId={id} className={['scene-emphasis', className].filter(Boolean).join(' ')} style={style} data-scene-node="emphasis" data-entity-id={id} {...props}>{children}</motion.div>
}
