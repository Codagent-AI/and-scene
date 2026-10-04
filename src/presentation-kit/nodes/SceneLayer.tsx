import type { HTMLAttributes, ReactNode } from 'react'

export interface SceneLayerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode
}

export function SceneLayer({ children, className, ...props }: SceneLayerProps) {
  return <div {...props} className={['presentation-scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer="">{children}</div>
}
