import { motion, type HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { geometry, type Rect } from './geometry'

export interface NodeProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'children'> {
  /** Stable entity identity; also the `layoutId`, so the entity morphs across steps. */
  id: string
  at?: Rect
  z?: number
  Icon?: LucideIcon
  children?: ReactNode
}

/** Shared body of the generic primitives; each exports a thin wrapper naming its `kind`. */
export function NodeBase({
  kind,
  id,
  at,
  z,
  Icon,
  style,
  children,
  ...rest
}: NodeProps & { kind: string }) {
  return (
    <motion.div
      layout
      layoutId={id}
      data-presentation-node={kind}
      data-presentation-entity={id}
      {...rest}
      style={{ ...geometry(at, z), ...style }}
    >
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {children}
    </motion.div>
  )
}
