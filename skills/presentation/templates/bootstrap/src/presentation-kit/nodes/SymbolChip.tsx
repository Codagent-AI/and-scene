import type { ReactNode } from 'react'
import { SceneNode } from './SceneNode.tsx'
import type { SceneNodeProps } from './SceneNode.tsx'
export function SymbolChip(props: SceneNodeProps & { children: ReactNode }) {
  return <SceneNode kind="symbol-chip" {...props} />
}
