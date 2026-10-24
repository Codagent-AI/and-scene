import { PositionedNode } from './PositionedNode.tsx'
import type { NodeProps } from './PositionedNode.tsx'

export const Label = (props: NodeProps) => <PositionedNode kind="label" {...props} />
