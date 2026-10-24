import type { CSSProperties, ReactNode } from 'react'
import type { At } from './place.ts'

/** Props every node primitive accepts: identity, geometry and styling hooks. */
export interface NodeProps {
  /** Stable entity id; becomes the motion layoutId and `data-presentation-id`. */
  id: string
  at?: At
  className?: string
  style?: CSSProperties
  /** Free-form variant hook exposed as `data-variant`. */
  variant?: string
  children?: ReactNode
}
