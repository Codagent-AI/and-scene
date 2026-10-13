import { motion } from 'motion/react'
import type { NodeProps } from '../types'
import { ENTER_DELAY, ENTER_T } from '../constants'

interface AppearProps extends NodeProps { persisting?: boolean }

export function Appear({ children, persisting = false, layoutId, className, style, ...dataProps }: AppearProps) {
  return persisting ? <motion.div layout layoutId={layoutId} className={className} style={style} data-presentation-node="appear" data-presentation-layout-id={layoutId} {...dataProps}>{children}</motion.div> : <motion.div layoutId={layoutId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay: ENTER_DELAY }} className={className} style={style} data-presentation-node="appear" data-presentation-layout-id={layoutId} {...dataProps}>{children}</motion.div>
}
