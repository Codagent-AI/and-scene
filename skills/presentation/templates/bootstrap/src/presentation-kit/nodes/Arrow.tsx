import type { ReactNode } from 'react'
import { LayoutNode, type NodeProps } from './LayoutNode'
export function Arrow({ children = '→', ...props }: Omit<NodeProps, 'children'> & { children?: ReactNode }) {
  return <LayoutNode hook="arrow" aria-hidden="true" {...props}>{children}</LayoutNode>
}
