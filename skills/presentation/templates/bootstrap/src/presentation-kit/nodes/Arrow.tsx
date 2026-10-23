import { useId, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { place } from '../layout'
import { dataProps, entityProps } from './shared'

export interface ArrowProps {
  id: string
  from: { x: number; y: number }
  to: { x: number; y: number }
  /** Draw an arrowhead at both ends. */
  bidirectional?: boolean
  allowOverlap?: boolean
  className?: string
  style?: CSSProperties
  [hook: `data-${string}`]: string | undefined
}

const PAD = 6

/**
 * Straight connector between two canvas points. The SVG box is sized to the
 * endpoints, so moving an endpoint morphs the box by layout projection.
 */
export function Arrow({ id, from, to, bidirectional = false, allowOverlap, className, style, ...rest }: ArrowProps) {
  const markerId = `arrowhead-${useId().replace(/:/g, '')}`
  const left = Math.min(from.x, to.x) - PAD
  const top = Math.min(from.y, to.y) - PAD
  const width = Math.abs(to.x - from.x) + PAD * 2
  const height = Math.abs(to.y - from.y) + PAD * 2
  return (
    <motion.div
      {...dataProps(rest)}
      {...entityProps(id, allowOverlap)}
      data-presentation-node="arrow"
      className={className}
      style={{ ...place(left, top, width, height), pointerEvents: 'none', ...style }}
    >
      <svg width="100%" height="100%" overflow="visible" aria-hidden="true">
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path data-presentation-arrowhead="" d="M0,0 L10,5 L0,10 z" />
          </marker>
        </defs>
        <line
          data-presentation-arrow-line=""
          x1={from.x - left}
          y1={from.y - top}
          x2={to.x - left}
          y2={to.y - top}
          markerEnd={`url(#${markerId})`}
          markerStart={bidirectional ? `url(#${markerId})` : undefined}
        />
      </svg>
    </motion.div>
  )
}
