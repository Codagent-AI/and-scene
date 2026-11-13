import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { ENTER_T } from "../constants";
export function Appear(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { delay: 0, duration: 0.2 } }}
      transition={ENTER_T}
      {...props}
    />
  );
}
