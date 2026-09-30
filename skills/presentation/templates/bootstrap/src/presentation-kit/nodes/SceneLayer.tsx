import type { CSSProperties, ReactNode } from 'react'

type SceneLayerProps = { allowOverlap?: boolean; children: ReactNode; className?: string; style?: CSSProperties }

export function SceneLayer({ allowOverlap, children, className, style }: SceneLayerProps) {
  return <div className={className} data-presentation-allow-overlap={allowOverlap || undefined} data-presentation-scene-layer="true" style={{ inset: 0, position: 'absolute', ...style }}>{children}</div>
}
