import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Appear({ children, delay = ENTER_DELAY, className, style }: { children: ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) { return <motion.div className={className} style={style} data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, delay }}>{children}</motion.div> }
