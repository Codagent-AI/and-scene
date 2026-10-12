import type { LucideIcon } from "lucide-react";
import type { NodeProps } from "../types";
import { PresentationNode } from "./PresentationNode";
export function Box({
  entityId,
  layoutId = entityId,
  children,
  Icon,
  ...props
}: NodeProps & { children?: React.ReactNode; Icon?: LucideIcon }) {
  return (
    <PresentationNode node="box" entityId={entityId} layoutId={layoutId} {...props}>
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </PresentationNode>
  );
}
