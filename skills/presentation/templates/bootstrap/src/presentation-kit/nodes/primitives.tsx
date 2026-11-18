import { motion, AnimatePresence } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { entityMotion, newcomerMotion } from "../constants";
export type NodeProps = Omit<HTMLMotionProps<"div">, "children"> & {
  id: string;
  Icon?: LucideIcon;
  children?: ReactNode;
};
export function Node({ id, Icon, children, ...props }: NodeProps) {
  return (
    <motion.div
      {...entityMotion}
      layoutId={id}
      data-presentation-entity={id}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </motion.div>
  );
}
export function Appear({ children }: { children: ReactNode }) {
  return (
    <motion.div data-presentation-appear="" {...newcomerMotion}>
      {children}
    </motion.div>
  );
}
export function SceneLayer({ children }: { children: ReactNode }) {
  return (
    <div data-presentation-layer="" style={{ position: "absolute", inset: 0 }}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  );
}
