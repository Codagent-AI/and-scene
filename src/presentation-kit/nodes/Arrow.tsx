import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants'
import { type DataProps } from './shared'

export interface ArrowProps extends DataProps {
  id: string
  /** Start point on the design canvas. */
  x: number
  y: number
  /** Length in canvas pixels; the arrow points along `angle`. */
  length: number
  /** Direction in degrees, measured clockwise from the positive x axis. */
  angle?: number
  twoWay?: boolean
  className?: string
  style?: CSSProperties
}

export function Arrow({ id, x, y, length, angle = 0, twoWay, className, style, ...data }: ArrowProps) {
  return (
    <motion.div
      {...data}
      layout
      transition={{ layout: LAYOUT_TRANSITION }}
      layoutId={id}
      className={className}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: length,
        height: 0,
        transformOrigin: '0 50%',
        rotate: `${angle}deg`,
        ...style,
      }}
      data-presentation-node="arrow"
      data-presentation-id={id}
      data-presentation-two-way={twoWay ? 'true' : undefined}
    />
  )
}
