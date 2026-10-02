import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { StyleProps } from '../types'
export function Emphasis({ id, children, className, style, ...props }: StyleProps & { id?: string; children: ReactNode }) {
  return <motion.div layout layoutId={id} className={['scene-emphasis', className].filter(Boolean).join(' ')} style={style} data-scene-entity={id} {...props}>{children}</motion.div>
}
