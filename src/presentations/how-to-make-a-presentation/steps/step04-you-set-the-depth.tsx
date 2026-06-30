import { SlidersHorizontal, User } from 'lucide-react'
import { Box, Emphasis, SceneLayer } from '../../../presentation-kit'
import type { Step } from '../../../presentation-kit'
import { ENTITIES } from '../entities'
import { REFERENCE_STEP_OUTLINE } from '../outline'

const meta = REFERENCE_STEP_OUTLINE[3]

function Scene() {
  return (
    <SceneLayer>
      <div className="flex items-center gap-16">
        <div className="flex flex-col gap-3">
          <Box layoutId={ENTITIES.stepCard1} label="Step 1" accent="gray" className="px-6 py-3 text-xs opacity-60" />
          <Box layoutId={ENTITIES.stepCard2} label="Step 2" accent="gray" className="px-6 py-3 text-xs opacity-80" />
          <Box layoutId={ENTITIES.stepCard3} label="…" accent="gray" className="px-6 py-3 text-xs" />
        </div>
        <div className="flex flex-col items-center gap-4">
          <Box layoutId={ENTITIES.you} Icon={User} label="You" accent="amber" />
          <Emphasis layoutId={ENTITIES.depthControl} accent="amber" className="flex items-center gap-2 font-sans text-xs normal-case tracking-normal">
            <SlidersHorizontal size={14} aria-hidden />
            partial ↔ full
          </Emphasis>
        </div>
      </div>
    </SceneLayer>
  )
}

export const step: Step = { ...meta, Scene }
