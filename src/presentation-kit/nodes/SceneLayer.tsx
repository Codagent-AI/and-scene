import type { ReactNode } from 'react'

/** Absolutely positioned layer for a step's diagram; mounting one layer never reflows another. */
export function SceneLayer({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div data-presentation-scene-layer className={className} style={{ position: 'absolute', inset: 0 }}>
      {children}
    </div>
  )
}
