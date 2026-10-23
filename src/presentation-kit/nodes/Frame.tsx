import { BaseNode, type BaseNodeProps } from './BaseNode.tsx'

export type FrameProps = BaseNodeProps

export function Frame(props: FrameProps) {
  return <BaseNode as="div" kind="frame" {...props} />
}
