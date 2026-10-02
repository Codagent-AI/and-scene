import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { MotionProps } from 'motion/react'
import { ENTER_T, EASE, EXIT_T, LAYOUT_T } from '../constants'

// Upper bound on how long newcomers wait for continuing entities to finish moving.
const SETTLE_TIMEOUT_MS = 3000

/**
 * Tracks one scene's layout motion so newcomers can enter after continuing entities have moved.
 * `entering` flips once the scene has mounted: entities present on first render appear in place,
 * while entities mounted by later steps animate in.
 */
export class SceneGate {
  entering = false
  private moving = new Set<object>()
  private waiting = new Set<() => void>()

  open() { this.entering = true }

  layoutStart(owner: object) { this.moving.add(owner) }

  layoutEnd(owner: object) {
    this.moving.delete(owner)
    this.flush()
  }

  /** Calls `callback` once no entity is mid-layout-animation. Returns a cancel function. */
  whenSettled(callback: () => void) {
    let cancelled = false
    let timeout = 0
    const done = () => {
      if (cancelled) return
      cancelled = true
      window.clearTimeout(timeout)
      this.waiting.delete(done)
      callback()
    }
    // Layout animations for the step that mounted this entity start on the next frames.
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => {
      if (this.moving.size === 0) done()
      else {
        this.waiting.add(done)
        timeout = window.setTimeout(done, SETTLE_TIMEOUT_MS)
      }
    }))
    return () => { cancelled = true; cancelAnimationFrame(frame); window.clearTimeout(timeout); this.waiting.delete(done) }
  }

  private flush() {
    if (this.moving.size > 0) return
    for (const done of [...this.waiting]) done()
  }
}

export const SceneEntranceContext = createContext<SceneGate>(Object.assign(new SceneGate(), { entering: true }))

type EntityMotionProps = Pick<MotionProps, 'initial' | 'animate' | 'exit' | 'transition' | 'onAnimationComplete' | 'onLayoutAnimationStart' | 'onLayoutAnimationComplete'>

/**
 * Default enter/exit/layout motion shared by the node primitives. Continuing entities keep their
 * identity and morph through layout projection; only newly mounted entities fade in, once the
 * scene's persisting entities have finished moving, and entities that leave a <Presence> fade out.
 * Authors can override any of these props on the primitive; an `opacity` in the primitive's
 * `style` is honored as the entrance target.
 */
export function useEntityMotion<E extends HTMLElement>(
  { initial, animate, exit, transition, onAnimationComplete, onLayoutAnimationStart, onLayoutAnimationComplete }: EntityMotionProps,
  style?: CSSProperties,
) {
  const gate = useContext(SceneEntranceContext)
  const ref = useRef<E>(null)
  const [owner] = useState(() => ({}))
  const [ready, setReady] = useState(!gate.entering)
  useEffect(() => (ready ? undefined : gate.whenSettled(() => setReady(true))), [gate, ready])
  useEffect(() => () => gate.layoutEnd(owner), [gate, owner])

  const authoredOpacity = style?.opacity === undefined ? undefined : Number(style.opacity)
  const target = authoredOpacity !== undefined && Number.isFinite(authoredOpacity) ? authoredOpacity : 1
  // The default entrance leaves an inline opacity behind unless the author owns it; release it so
  // presentation CSS controls opacity again.
  const releaseOpacity = animate === undefined && style?.opacity === undefined
  const defaultTransition = { layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T } }
  return {
    ref,
    initial: initial ?? (ready ? false : { opacity: 0 }),
    animate: animate ?? { opacity: ready ? target : 0 },
    exit: exit ?? { opacity: 0, transition: { duration: EXIT_T } },
    transition: transition === undefined || typeof transition !== 'object' ? defaultTransition : { ...defaultTransition, ...transition },
    onAnimationComplete: ((definition) => {
      if (releaseOpacity && ready) requestAnimationFrame(() => ref.current?.style.removeProperty('opacity'))
      onAnimationComplete?.(definition)
    }) as MotionProps['onAnimationComplete'],
    onLayoutAnimationStart: () => { gate.layoutStart(owner); onLayoutAnimationStart?.() },
    onLayoutAnimationComplete: () => { gate.layoutEnd(owner); onLayoutAnimationComplete?.() },
  }
}
