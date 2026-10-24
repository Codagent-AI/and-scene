import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { LAYOUT_T, EASE } from '../constants'
import { hooks, placement } from './nodeProps'
import type { NodeProps } from './nodeProps'

interface BoxProps extends NodeProps {
  /** Optional glyph rendered before the children. */
  Icon?: LucideIcon
}

export function Box(props: BoxProps) {
  const { id, className, children, Icon } = props
  return (
    <motion.div
      layoutId={id}
      className={className}
      style={placement(props)}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...hooks('box', props)}
    >
      {Icon && <Icon aria-hidden data-presentation-icon />}
      {children}
    </motion.div>
  )
}
