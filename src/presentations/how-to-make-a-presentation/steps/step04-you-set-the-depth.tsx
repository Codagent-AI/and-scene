import { SlidersHorizontal, User } from 'lucide-react'
import { Box, Emphasis, SceneLayer } from '../../../presentation-kit'
import type { Step } from '../../../presentation-kit'
import { ENTITIES } from '../entities'
import { REFERENCE_STEP_OUTLINE } from '../outline'

const meta = REFERENCE_STEP_OUTLINE[3]

function Scene() {
  return (
    <SceneLayer>
      <div className="flex items-end gap-10">
        <div className="relative flex h-48 w-48 items-end justify-center">
          <Box
            layoutId={ENTITIES.stepCard1}
            label="Step 1"
            accent="gray"
            className="absolute bottom-0 left-0 scale-75 opacity-60"
          />
          <Box
            layoutId={ENTITIES.stepCard2}
            label="Step 2"
            accent="gray"
            className="absolute bottom-4 left-10 z-10 scale-90 opacity-80"
          />
          <Box
            layoutId={ENTITIES.stepCard3}
            label="…"
            accent="gray"
            className="absolute bottom-8 left-20 z-20 scale-95 opacity-40"
          />
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
