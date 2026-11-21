import { useId } from 'react'
import { Entity } from './Entity'
import type { EntityProps } from './Entity'

export function Arrow({ path, width, height, bidirectional, ...props }: EntityProps & {
  path: string
  width: number
  height: number
  bidirectional?: boolean
}) {
  const tip = useId()
  const marker = `url(#${tip})`
  return <Entity data-presentation-arrow="" {...props}>
    <svg aria-hidden width={width} height={height} viewBox={`0 0 ${width} ${height}`} overflow="visible">
      <defs>
        <marker id={tip} markerWidth="6" markerHeight="6" viewBox="0 0 6 6"
          refX="5" refY="3" orient="auto-start-reverse">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="currentColor" />
        </marker>
      </defs>
      <path d={path} fill="none" stroke="currentColor" markerEnd={marker}
        markerStart={bidirectional ? marker : undefined} />
    </svg>
  </Entity>
}
