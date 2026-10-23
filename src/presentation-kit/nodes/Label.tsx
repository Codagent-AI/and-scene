import { DivNode } from './DivNode'
import type { NodeProps } from './types'

export const Label = (props: NodeProps) => <DivNode kind="label" {...props} />
