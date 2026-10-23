import type { CSSProperties, ReactNode } from 'react'
import { layerStyle } from './layout'
import { dataProps } from './nodes/shared'

export interface SceneLayerProps {
  name: string
  id?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
  [hook: `data-${string}`]: string | undefined
}

/** Absolutely positioned diagram layer; mounting one never reflows another. */
export function SceneLayer({ name, id, className, style, children, ...rest }: SceneLayerProps) {
  return (
    <div
      {...dataProps(rest)}
      data-presentation-layer={name}
      data-presentation-layer-id={id}
      className={className}
      style={{ ...layerStyle, ...style }}
    >
      {children}
    </div>
  )
}
