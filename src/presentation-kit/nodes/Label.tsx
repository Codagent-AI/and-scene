import type { ReactNode } from 'react'
import { EntityNode } from './EntityNode.tsx'
import type { NodeProps } from './shared.ts'

export interface LabelProps extends NodeProps {
  children?: ReactNode
}

export function Label(props: LabelProps) {
  return <EntityNode {...props} kind="label" />
}
