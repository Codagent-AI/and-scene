import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { placementStyle, type DomPassthrough, type NodeProps, type Placement } from './shared.ts'

export interface BaseNodeProps extends NodeProps, Placement, DomPassthrough {
  children?: ReactNode
}

/** Shared body of the generic primitives: a placed, morphing, hooked element. */
export function BaseNode({
  as: Tag,
  kind,
  id,
  x,
  y,
  w,
  h,
  style,
  children,
  ...rest
}: BaseNodeProps & { as: 'div' | 'span'; kind: string }) {
  const Element = motion[Tag]
  return (
    <Element
      {...rest}
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      style={placementStyle({ x, y, w, h }, style)}
      data-presentation-node={kind}
      data-presentation-entity={id}
    >
      {children}
    </Element>
  )
}
