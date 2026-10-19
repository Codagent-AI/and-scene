import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { leave, morph, place } from './shared.ts'
import type { NodeProps } from './shared.ts'

export interface BoxProps extends NodeProps {
  /** Optional Lucide glyph rendered before the children. */
  Icon?: LucideIcon
  emphasis?: boolean
  children?: ReactNode
}

export function Box({ layoutId, x, y, w, h, Icon, emphasis, children, style, ...rest }: BoxProps) {
  return (
    <motion.div
      {...(rest as object)}
      layout
      layoutId={layoutId}
      transition={morph}
      exit={leave}
      style={place({ x, y, w, h }, style)}
      data-presentation-node="box"
      data-presentation-entity={layoutId}
      data-presentation-emphasis={emphasis ? 'true' : undefined}
    >
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
