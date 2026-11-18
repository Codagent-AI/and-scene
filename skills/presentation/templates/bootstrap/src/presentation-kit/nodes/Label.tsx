import { Node } from './primitives'
import type { NodeProps } from './primitives'
export function Label(props: NodeProps) { return <Node kind="label" {...props} /> }
