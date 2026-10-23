import { Entity, type EntityProps } from './Entity'

export interface ArrowProps extends Omit<EntityProps, 'x' | 'y' | 'width' | 'height' | 'children'> {
  from: readonly [number, number]
  to: readonly [number, number]
  /** Control point; draws a quadratic curve instead of a straight line. */
  via?: readonly [number, number]
  /** Arrowheads at both ends. */
  both?: boolean
}

/** A line or curve between two canvas points. Strokes inherit the surrounding text color. */
export function Arrow({ id, from, to, via, both, ...props }: ArrowProps) {
  const d = via
    ? `M${from[0]} ${from[1]} Q${via[0]} ${via[1]} ${to[0]} ${to[1]}`
    : `M${from[0]} ${from[1]} L${to[0]} ${to[1]}`
  const head = `${id}-head`
  return (
    <Entity
      id={id}
      kind="arrow"
      x={0}
      y={0}
      width={1}
      height={1}
      aria-hidden
      style={{ pointerEvents: 'none', overflow: 'visible' }}
      {...props}
    >
      <svg width={1} height={1} style={{ overflow: 'visible' }} data-presentation-arrow-svg="">
        <defs>
          <marker
            id={head}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          markerEnd={`url(#${head})`}
          markerStart={both ? `url(#${head})` : undefined}
        />
      </svg>
    </Entity>
  )
}
