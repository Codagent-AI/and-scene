import { CheckCircle2, Route, ShieldCheck } from 'lucide-react'
import { Appear, Arrow, Box, SceneLayer } from '../../../presentation-kit'
import type { Step } from '../../../presentation-kit'
import { ENTITIES } from '../entities'
import { REFERENCE_STEP_OUTLINE } from '../outline'

const meta = REFERENCE_STEP_OUTLINE[5]

function Scene() {
  return (
    <SceneLayer>
      <div className="flex items-center gap-6">
        <Box
          layoutId={ENTITIES.presentationRoute}
          Icon={Route}
          label="/your-talk"
          accent="green"
        />
        <Arrow layoutId={ENTITIES.questionLoop} />
        <Box
          layoutId={ENTITIES.verifyNode}
          Icon={ShieldCheck}
          label="verify"
          subtitle="build + render"
          accent="cyan"
        />
        <Appear delay={0.2}>
          <Box
            layoutId={ENTITIES.greenCheck}
            Icon={CheckCircle2}
            label="pass"
            accent="green"
            className="px-5 py-4"
          />
        </Appear>
      </div>
    </SceneLayer>
  )
}

export const step: Step = { ...meta, Scene }
