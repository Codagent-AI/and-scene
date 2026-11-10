import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { entrance } from './Node'
export function Appear(props: HTMLMotionProps<'div'>) { return <motion.div data-presentation-appear="" {...entrance} {...props} /> }
