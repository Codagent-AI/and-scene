import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants'
import type { StyleProps } from '../types'
export function Appear({ children, className, style, ...props }: StyleProps & { children: ReactNode }) {
  return <motion.div className={['scene-appear', className].filter(Boolean).join(' ')} style={style} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY }} data-scene-appear {...props}>{children}</motion.div>
}
