import { Pencil, Route } from 'lucide-react'
import { Arrow, Box, Emphasis, SceneLayer } from '../../../presentation-kit'
import type { Step } from '../../../presentation-kit'
import { ENTITIES } from '../entities'
import { REFERENCE_STEP_OUTLINE } from '../outline'

const meta = REFERENCE_STEP_OUTLINE[6]

function Scene() {
  return (
    <SceneLayer>
      <div className="relative flex h-52 w-[28rem] items-center justify-center">
        <Box
          layoutId={ENTITIES.presentationRoute}
          Icon={Route}
          label="/your-talk"
          accent="green"
          className="z-10"
        />
        <Emphasis
          layoutId={ENTITIES.modifyLoop}
          accent="amber"
          className="absolute -right-2 top-8 rotate-12 font-sans text-xs normal-case tracking-normal"
        >
          <Pencil size={12} className="mr-1 inline" aria-hidden />
          modify
        </Emphasis>
        <Arrow
          layoutId={ENTITIES.questionLoop}
          className="absolute -left-6 bottom-6 text-3xl text-amber"
        >
          ↺
        </Arrow>
        <Box
          layoutId={ENTITIES.stepCard2}
          label="gathering"
          accent="gray"
          className="absolute -left-4 top-4 scale-90 opacity-80"
        />
      </div>
    </SceneLayer>
  )
}

export const step: Step = { ...meta, Scene }
