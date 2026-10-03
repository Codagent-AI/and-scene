import type { CSSProperties, ReactNode } from 'react'

export type SceneNodeProps = {
  id?: string
  layoutId?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
  dataAttributes?: Record<string, string | number | boolean | undefined>
}

export function nodeProps(
  node: SceneNodeProps,
  kind: string,
  layoutId?: string,
): { className?: string; style?: CSSProperties; 'data-scene-node': string; 'data-scene-entity'?: string; [key: string]: unknown } {
  const attributes: Record<string, unknown> = {
    ...node.dataAttributes,
    className: node.className,
    style: node.style,
    'data-scene-node': kind,
  }
  if (node.id) attributes['data-scene-entity'] = node.id
  const stableLayoutId = node.layoutId ?? layoutId
  if (stableLayoutId) {
    attributes.layoutId = stableLayoutId
    attributes['data-scene-layout-id'] = stableLayoutId
  }
  return attributes as { className?: string; style?: CSSProperties; 'data-scene-node': string; 'data-scene-entity'?: string; [key: string]: unknown }
}

export function sceneLayoutId(id?: string): string | undefined {
  return id ? `scene-${id}` : undefined
}
