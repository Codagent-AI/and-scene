import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T, EASE, LAYOUT_T } from '../constants'
import { useContinuesFromPrevious } from './useContinuesFromPrevious'

export interface EntityProps {
  /** Stable identity; also the motion layoutId, so it must be unique per presentation. */
  id: string
  x: number
  y: number
  width?: number
  height?: number
  className?: string
  style?: CSSProperties
  /** Extra data-* attributes, e.g. ALLOW_OVERLAP. */
  dataAttrs?: Record<`data-${string}`, string>
  /** Optional glyph rendered before the children. */
  Icon?: LucideIcon
  children?: ReactNode
}

/** Positioned, morphing entity shared by every node primitive. Carries no visual styling. */
export function Entity({
  kind,
  id,
  x,
  y,
  width,
  height,
  className,
  style,
  dataAttrs,
  Icon,
  children,
}: EntityProps & { kind: string }) {
  const continues = useContinuesFromPrevious(id)
  return (
    <motion.div
      layout
      layoutId={id}
      {...dataAttrs}
      data-presentation-entity={id}
      data-presentation-kind={kind}
      className={className}
      initial={continues ? false : { opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T / 2 } }}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      style={{ position: 'absolute', left: x, top: y, width, height, ...style }}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
