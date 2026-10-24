import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { placement } from './place.ts'
import type { NodeProps } from './types.ts'

interface BoxProps extends NodeProps {
  Icon?: LucideIcon
}

/** Generic card; carries a layoutId so it morphs between steps. */
export function Box({ id, at, className, style, variant, Icon, children }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="box"
      data-presentation-id={id}
      data-variant={variant}
      className={className}
      style={placement(at, style)}
    >
      {Icon && <Icon aria-hidden="true" data-presentation-icon="" />}
      {children}
    </motion.div>
  )
}
