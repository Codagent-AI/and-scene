import { LayoutNode, type NodeProps } from './LayoutNode'
export function Frame(props: NodeProps) {
  return <LayoutNode hook="frame" {...props} />
}
