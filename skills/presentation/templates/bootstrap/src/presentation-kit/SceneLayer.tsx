import type { ReactNode } from 'react'
import { layerStyle } from './layout'

/** Absolutely positioned diagram layer; mounting one never reflows another. */
export function SceneLayer({ name, children }: { name: string; children?: ReactNode }) {
  return (
    <div data-presentation-layer={name} style={layerStyle}>
      {children}
    </div>
  )
}
