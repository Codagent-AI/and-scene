import type { HTMLAttributes } from 'react'
export function SceneLayer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={['presentation-scene-layer', className].filter(Boolean).join(' ')} data-presentation-scene-layer="" {...props} />
}
