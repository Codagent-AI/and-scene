import { motion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';
import { EASE, ENTER_DELAY, ENTER_T } from '../constants';
/** Wrap only newcomers; key wrappers by entity inside the scene's AnimatePresence. */
export function Appear(props: HTMLMotionProps<'div'>) {
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE } }} exit={{ opacity: 0, transition: { duration: ENTER_T, ease: EASE } }} {...props}/>;
}
