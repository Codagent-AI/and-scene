import { Primitive } from './primitives'
import type { NodeProps } from './primitives'
export function Box(props: NodeProps) { return <Primitive kind="box" {...props} /> }
