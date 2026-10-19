import { motion } from 'motion/react'
import { useEntityProps, type NodeHtmlProps } from './entity'

export type Point = readonly [number, number]

export interface ArrowProps
  extends NodeHtmlProps<HTMLDivElement> {
  id: string
  from: Point
  to: Point
  /** Draw a head at the start as well as the end. */
  bidirectional?: boolean
  headSize?: number
  emphasis?: boolean
}

function head(tip: Point, other: Point, size: number) {
  const angle = Math.atan2(tip[1] - other[1], tip[0] - other[0])
  return [Math.PI * 0.8, -Math.PI * 0.8].map((turn) => ({
    x2: tip[0] + size * Math.cos(angle + turn),
    y2: tip[1] + size * Math.sin(angle + turn),
  }))
}

/**
 * A line with head(s) between two canvas points. Drawn with stroke-only
 * lines so the author's CSS `stroke` fully decides how it looks.
 */
export function Arrow({
  id, from, to, bidirectional, headSize = 10, emphasis, style, ...rest
}: ArrowProps) {
  const pad = headSize + 2
  const left = Math.min(from[0], to[0]) - pad
  const top = Math.min(from[1], to[1]) - pad
  const width = Math.abs(to[0] - from[0]) + pad * 2
  const height = Math.abs(to[1] - from[1]) + pad * 2
  const local = (p: Point): Point => [p[0] - left, p[1] - top]
  const a = local(from)
  const b = local(to)
  const heads = [
    { tip: b, other: a },
    ...(bidirectional ? [{ tip: a, other: b }] : []),
  ]
  const entity = useEntityProps({
    id,
    kind: 'arrow',
    x: left,
    y: top,
    w: width,
    h: height,
    emphasis,
    style: { pointerEvents: 'none', ...style },
  })
  return (
    <motion.div {...rest} {...entity}>
      <svg width={width} height={height} overflow="visible" aria-hidden="true">
        <line data-presentation-arrow-shaft="" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
        {heads.flatMap(({ tip, other }, i) =>
          head(tip, other, headSize).map((end, j) => (
            <line
              key={`${i}-${j}`}
              data-presentation-arrow-head=""
              x1={tip[0]}
              y1={tip[1]}
              x2={end.x2}
              y2={end.y2}
            />
          )),
        )}
      </svg>
    </motion.div>
  )
}
