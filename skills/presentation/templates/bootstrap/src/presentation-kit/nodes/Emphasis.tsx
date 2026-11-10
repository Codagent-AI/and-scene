import { motion } from 'motion/react'
import type { NodeProps } from './Box'
import { LAYOUT_T } from '../constants'
export function Emphasis({ id, Icon, children, ...props }: NodeProps) {
  return <motion.div layout layoutId={id} transition={LAYOUT_T} data-presentation-node="emphasis" {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div>
}
