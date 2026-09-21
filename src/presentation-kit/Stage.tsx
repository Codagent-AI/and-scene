import { AnimatePresence, LayoutGroup } from 'motion/react'
import type { CSSProperties, RefObject } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'
import type { PresentationMode, Step } from './types'
import { useFitScale } from './useFitScale'

type StageProps<TPayload> = {
  step: Step<TPayload>
  mode: PresentationMode
  hostRef: RefObject<HTMLElement | null>
}

export function Stage<TPayload>({ step, mode, hostRef }: StageProps<TPayload>) {
  const scale = useFitScale(hostRef, mode)
  const Scene = step.Scene
  const stageStyle = { width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'center center' } satisfies CSSProperties
  return (
    <div className="presentation-stage" data-presentation-stage data-presentation-mode={mode}>
      <div className="presentation-stage__viewport" style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}>
        <LayoutGroup id={`presentation-${step.groupKey ?? step.id}`}>
          <AnimatePresence mode="popLayout" initial={false}>
            <div className="presentation-stage__canvas" data-presentation-canvas key={step.groupKey ?? step.id} style={stageStyle}>
              <Scene payload={step.payload} step={step} mode={mode} />
            </div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
      <span className="presentation-stage__step-label" aria-hidden="true">{step.title}</span>
      <style>{`[data-presentation-canvas] { position: relative; } .presentation-stage__viewport { position: relative; }`}</style>
    </div>
  )
}
