import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { StyleProps } from '../types'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
export function Emphasis({ id, children, className, style, ...props }: StyleProps & { id?: string; children: ReactNode }) {
  return <motion.div layout layoutId={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T, delay: ENTER_DELAY } }} className={['scene-emphasis', className].filter(Boolean).join(' ')} style={style} data-scene-entity={id} {...props}>{children}</motion.div>
}
