import { motion } from 'motion/react'
import type { StyleProps } from '../types'

export function Frame({ id, className, style, children, ...props }: StyleProps & { children?: React.ReactNode } & Record<string, unknown>) {
  return <motion.div layout layoutId={id} className={['scene-frame', className].filter(Boolean).join(' ')} style={style} data-scene-node="frame" data-entity-id={id} {...props}>{children}</motion.div>
}
