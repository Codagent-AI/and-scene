import { Primitive } from './primitives'
import type { NodeProps } from './primitives'
export function Label(props: NodeProps) { return <Primitive kind="label" {...props} /> }
