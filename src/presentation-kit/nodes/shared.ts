import type { CSSProperties, ReactNode } from 'react'

export type NodeProps = {
  entityId?: string
  layoutId?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
  role?: string
  onClick?: React.MouseEventHandler<HTMLDivElement>
  'aria-label'?: string
  'data-state'?: string
  'data-variant'?: string
}

export function nodeProps(props: NodeProps, hook: string) {
  const { entityId, layoutId = entityId, className, ...rest } = props
  return { ...rest, className: [hook, className].filter(Boolean).join(' '), 'data-presentation-node': hook, 'data-entity-id': entityId, layoutId }
}
