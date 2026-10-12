import type { NodeProps } from "../types";
import { PresentationNode } from "./PresentationNode";
export function SymbolChip({
  entityId,
  layoutId = entityId,
  children,
  ...props
}: NodeProps & { children?: React.ReactNode }) {
  return (
    <PresentationNode node="symbol-chip" entityId={entityId} layoutId={layoutId} {...props}>
      {children}
    </PresentationNode>
  );
}
