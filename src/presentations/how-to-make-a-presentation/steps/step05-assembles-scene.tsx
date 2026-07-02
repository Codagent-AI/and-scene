import { Boxes, Route } from 'lucide-react'
import { Arrow, Box, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { Step } from '../../../presentation-kit'
import { ENTITIES } from '../entities'
import { REFERENCE_STEP_OUTLINE } from '../outline'

const meta = REFERENCE_STEP_OUTLINE[4]

function Scene() {
  return (
    <SceneLayer>
      <div className="flex items-center gap-5">
        <div className="flex flex-col gap-2">
          <Box layoutId={ENTITIES.stepCard2} label="steps" accent="gray" className="px-4 py-3 text-xs" />
          <Box layoutId={ENTITIES.stepCard3} label="…" accent="gray" className="px-4 py-2 text-xs opacity-70" />
        </div>
        <Arrow layoutId={ENTITIES.questionLoop} />
        <SymbolChip
          layoutId={ENTITIES.sceneKit}
          Icon={Boxes}
          label="Scene kit"
          variant="chip"
          accent="cyan"
        />
        <Arrow layoutId={ENTITIES.modifyLoop} />
        <Box
          layoutId={ENTITIES.presentationRoute}
          Icon={Route}
          label="/your-talk"
          subtitle="one folder · one route"
          accent="green"
        />
      </div>
    </SceneLayer>
  )
}

export const step: Step = { ...meta, Scene }
