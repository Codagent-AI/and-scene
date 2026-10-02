import { motion } from 'motion/react'
import type { StyleProps } from '../types'

export function Arrow({ id, className, style, children, direction = 'right', ...props }: StyleProps & { children?: React.ReactNode; direction?: string } & Record<string, unknown>) {
  return <motion.div layout layoutId={id} className={['scene-arrow', className].filter(Boolean).join(' ')} style={style} data-scene-node="arrow" data-direction={direction} data-entity-id={id} aria-hidden={!children} {...props}>{children}</motion.div>
}
