import type { CSSProperties, ReactNode } from 'react'

type SceneLayerProps = {
  children?: ReactNode
  className?: string
  style?: CSSProperties
  id?: string
}

export function SceneLayer({ children, className, style, id }: SceneLayerProps) {
  return (
    <div
      id={id}
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
      data-scene-layer
    >
      {children}
    </div>
  )
}
