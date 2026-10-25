import type { HTMLAttributes } from 'react'
export function SceneLayer({ style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-presentation-layer="" {...props} style={{ position: 'absolute', inset: 0, ...style }} />
}
