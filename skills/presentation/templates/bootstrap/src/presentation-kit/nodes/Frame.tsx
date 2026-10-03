import type { ReactNode } from 'react'
import { SceneNode } from './SceneNode.tsx'
import type { SceneNodeProps } from './SceneNode.tsx'
export function Frame(props: SceneNodeProps & { children: ReactNode }) {
  return <SceneNode kind="frame" {...props} />
}
