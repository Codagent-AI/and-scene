import { motion } from 'motion/react'
import { EXIT_T, MOTION_LAYOUT } from '../constants'
import type { NodeHooks } from './shared'

export interface ArrowProps extends NodeHooks {
  from: [number, number]
  to: [number, number]
  /** Draw a head at both ends. */
  twoWay?: boolean
  /** Arrow head length in canvas pixels. */
  head?: number
  /** Draw the line as a curve through this control point (an "arc"). */
  bend?: [number, number]
}

function headPath(tip: [number, number], tail: [number, number], size: number): string {
  const angle = Math.atan2(tip[1] - tail[1], tip[0] - tail[0])
  const spread = Math.PI / 7
  const a: [number, number] = [tip[0] - size * Math.cos(angle - spread), tip[1] - size * Math.sin(angle - spread)]
  const b: [number, number] = [tip[0] - size * Math.cos(angle + spread), tip[1] - size * Math.sin(angle + spread)]
  return `M ${a[0]} ${a[1]} L ${tip[0]} ${tip[1]} L ${b[0]} ${b[1]}`
}

/** Line (or arc) between two canvas points. Strokes inherit `currentColor`; style it with CSS. */
export function Arrow({ id, from, to, twoWay = false, head = 10, bend, className, style, ...rest }: ArrowProps) {
  const control = bend ?? from
  const line = bend
    ? `M ${from[0]} ${from[1]} Q ${bend[0]} ${bend[1]} ${to[0]} ${to[1]}`
    : `M ${from[0]} ${from[1]} L ${to[0]} ${to[1]}`
  const endHead = headPath(to, bend ? control : from, head)
  const startHead = headPath(from, bend ? control : to, head)
  const transition = MOTION_LAYOUT
  return (
    <motion.svg
      {...rest}
      layoutId={id}
      data-presentation-node="arrow"
      data-presentation-id={id}
      className={className}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', ...style }}
      fill="none"
      stroke="currentColor"
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
    >
      <motion.path d={line} animate={{ d: line }} initial={false} transition={transition} />
      <motion.path d={endHead} animate={{ d: endHead }} initial={false} transition={transition} />
      {twoWay ? <motion.path d={startHead} animate={{ d: startHead }} initial={false} transition={transition} /> : null}
    </motion.svg>
  )
}
