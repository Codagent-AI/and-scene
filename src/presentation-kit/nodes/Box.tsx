import type { ComponentType, ReactNode } from 'react'
import { SceneNode } from './SceneNode.tsx'
import type { SceneNodeProps } from './SceneNode.tsx'
export function Box({ glyph: Glyph, children, ...props }: SceneNodeProps & { children: ReactNode; glyph?: ComponentType<{ size?: number; 'aria-hidden'?: boolean }> }) {
  return <SceneNode kind="box" {...props}>{Glyph && <Glyph aria-hidden={true} />}{children}</SceneNode>
}
