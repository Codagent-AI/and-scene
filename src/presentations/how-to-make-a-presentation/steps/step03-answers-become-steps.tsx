import { Layers } from 'lucide-react'
import { Appear, Box, SceneLayer } from '../../../presentation-kit'
import type { Step } from '../../../presentation-kit'
import { ENTITIES } from '../entities'
import { REFERENCE_STEP_OUTLINE } from '../outline'

const meta = REFERENCE_STEP_OUTLINE[2]

function Scene() {
  return (
    <SceneLayer>
      <div className="relative flex h-56 w-72 items-end justify-center">
        <Appear delay={0.05}>
          <Box
            layoutId={ENTITIES.stepCard1}
            Icon={Layers}
            label="Step 1"
            subtitle="title + caption"
            accent="gray"
            className="absolute bottom-0 left-0 -rotate-3 scale-90"
          />
        </Appear>
        <Appear delay={0.15}>
          <Box
            layoutId={ENTITIES.stepCard2}
            label="Step 2"
            subtitle="visual description"
            accent="gray"
            className="absolute bottom-6 left-16 z-10 rotate-1"
          />
        </Appear>
        <Appear delay={0.25}>
          <Box
            layoutId={ENTITIES.stepCard3}
            label="Step 3"
            subtitle="era + scene"
            accent="cyan"
            className="absolute bottom-12 left-32 z-20 rotate-2"
          />
        </Appear>
      </div>
    </SceneLayer>
  )
}

export const step: Step = { ...meta, Scene }
