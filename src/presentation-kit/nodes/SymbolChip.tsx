import { IconNode, type IconNodeProps } from './IconNode'

export type SymbolChipProps = IconNodeProps

/** Generalized icon+label chip primitive; no size, color, or pill-shape defaults. */
export function SymbolChip(props: SymbolChipProps) {
  return <IconNode node="symbol-chip" iconSize={16} {...props} />
}
