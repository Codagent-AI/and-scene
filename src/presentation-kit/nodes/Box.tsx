import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, EXIT_T, LAYOUT_T } from '../constants'
import { dataHooks, geometryStyle, type DataHooks, type Geometry } from './geometry'

export interface BoxProps extends Geometry, DataHooks {
  /** Stable entity identity; morphs across steps. */
  id: string
  Icon?: LucideIcon
  label?: ReactNode
  emphasis?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function Box({ id, Icon, label, emphasis, className, style, children, ...geometry }: BoxProps) {
  return (
    <motion.div
      {...dataHooks(geometry)}
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      data-presentation-node="box"
      data-presentation-id={id}
      data-presentation-emphasis={emphasis ? 'true' : undefined}
      className={className}
      style={geometryStyle(geometry, style)}
    >
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : null}
      {label !== undefined ? <span data-presentation-label="">{label}</span> : null}
      {children}
    </motion.div>
  )
}
