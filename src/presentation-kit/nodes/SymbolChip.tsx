import { BaseNode, type BaseNodeProps } from './BaseNode.tsx'

export type SymbolChipProps = BaseNodeProps

export function SymbolChip(props: SymbolChipProps) {
  return <BaseNode as="span" kind="symbol-chip" {...props} />
}
