import { SceneNode } from './SceneNode.tsx'
import type { SceneNodeProps } from './SceneNode.tsx'
export function Arrow(props: SceneNodeProps) {
  return <SceneNode kind="arrow" {...props} />
}
