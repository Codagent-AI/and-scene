import { motion } from "motion/react";
import type { NodeProps } from "../types";

export function PresentationNode({
  node,
  entityId,
  layoutId = entityId,
  children,
  ...props
}: NodeProps & {
  node: "arrow" | "box" | "emphasis" | "frame" | "label" | "symbol-chip";
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      data-presentation-node={node}
      data-entity-id={entityId}
      layoutId={layoutId}
      {...props}
    >
      {children}
    </motion.div>
  );
}
