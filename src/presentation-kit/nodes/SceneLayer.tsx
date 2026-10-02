import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { SceneEntranceContext, SceneGate } from './entity'

export function SceneLayer({ children, className, style, ...props }: { children: ReactNode; className?: string; style?: CSSProperties; [key: `data-${string}`]: unknown }) {
  const [gate] = useState(() => new SceneGate())
  useEffect(() => { gate.open() }, [gate])
  return <SceneEntranceContext.Provider value={gate}>
    <div className={['scene-layer', className].filter(Boolean).join(' ')} style={{ position: 'absolute', inset: 0, ...style }} data-scene-layer="" {...props}>{children}</div>
  </SceneEntranceContext.Provider>
}
