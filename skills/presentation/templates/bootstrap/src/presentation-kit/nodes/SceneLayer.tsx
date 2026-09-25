import type { HTMLAttributes } from 'react'
export function SceneLayer(props: HTMLAttributes<HTMLDivElement>) {
  return <div data-presentation-scene-layer {...props} style={{ position: 'absolute', inset: 0, ...props.style }} />
}
