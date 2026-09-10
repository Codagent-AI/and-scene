import type { ComponentProps } from 'react'

export function SceneLayer({ style, ...props }: ComponentProps<'div'>) {
  return <div {...props} data-presentation-scene-layer="true" style={{ position: 'absolute', inset: 0, ...style }} />
}
