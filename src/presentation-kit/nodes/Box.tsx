import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { StyleProps } from '../types'

export function Box({ id, children, className, style, ...props }: StyleProps & { id: string; children?: ReactNode; label?: string }) {
  return <motion.div layout layoutId={id} className={['scene-box', className].filter(Boolean).join(' ')} style={style as CSSProperties} data-scene-entity={id} {...props}>{children}</motion.div>
}
