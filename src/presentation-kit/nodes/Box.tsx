import { Node } from './primitives'
import type { NodeProps } from './primitives'
export function Box(props: NodeProps) { return <Node kind="box" {...props} /> }
