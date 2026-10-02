import { createContext, useContext, useRef } from 'react'
import type { MotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T, EASE, EXIT_T, LAYOUT_T } from '../constants'

// Mutable on purpose: a SceneLayer flips `entering` once it has mounted, so entities present on
// first render appear in place while entities mounted by later steps animate in.
export const SceneEntranceContext = createContext<{ entering: boolean }>({ entering: true })

type EntityMotionProps = Pick<MotionProps, 'initial' | 'animate' | 'exit' | 'transition' | 'onAnimationComplete'>

/**
 * Default enter/exit/layout motion shared by the node primitives. Continuing entities keep their
 * identity and morph through layout projection; only newly mounted entities fade in, after
 * persisting entities have moved, and entities that leave a <Presence> fade out.
 * Authors can override any of these props on the primitive.
 */
export function useEntityMotion<E extends HTMLElement>({ initial, animate, exit, transition, onAnimationComplete }: EntityMotionProps) {
  const gate = useContext(SceneEntranceContext)
  const ref = useRef<E>(null)
  const owned = animate === undefined
  return {
    ref,
    initial: initial ?? (gate.entering ? { opacity: 0 } : false),
    animate: animate ?? { opacity: 1 },
    exit: exit ?? { opacity: 0, transition: { duration: EXIT_T } },
    transition: transition ?? { layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T, delay: ENTER_DELAY } },
    // The default entrance leaves an inline opacity behind; release it so presentation CSS owns opacity.
    onAnimationComplete: ((definition) => {
      if (owned) requestAnimationFrame(() => ref.current?.style.removeProperty('opacity'))
      onAnimationComplete?.(definition)
    }) as MotionProps['onAnimationComplete'],
  }
}
