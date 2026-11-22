import { Primitive } from './Primitive'
import type { NodeProps } from './Primitive'
export function Box(props: NodeProps) { return <Primitive kind="Box" {...props} /> }
