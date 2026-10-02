import { motion, type MotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T, EXIT } from '../constants'
import type { PrimitiveProps } from '../types'
export interface AppearProps extends PrimitiveProps { delay?: number; motionProps?: MotionProps }
export function Appear({ id, className = '', style, children, delay = ENTER_DELAY, motionProps }: AppearProps) { return <motion.div className={`scene-appear ${className}`.trim()} data-presentation-appear="" data-presentation-entity={id} style={style} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { duration: ENTER_T, delay } }} exit={EXIT} {...motionProps}>{children}</motion.div> }
