import { LayoutNode, type NodeProps } from './LayoutNode'
export function Box(props: NodeProps) {
  return <LayoutNode hook="box" {...props} />
}
