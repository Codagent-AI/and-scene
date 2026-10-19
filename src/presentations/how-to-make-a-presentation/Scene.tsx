import { Bot, Check, Image as ImageIcon, Layers, Sparkles, User } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { ARROWS, ID, RECTS, type ArrowSpec, type EntitySpec } from './entities'
import type { SamplePayload } from './payload'

const rect = (s: EntitySpec) => ({ x: s.x, y: s.y, w: s.w, h: s.h })
const OVERLAP = { 'data-presentation-allow-overlap': '' }

function Link({ spec, on, className = 'sample-link' }: { spec: ArrowSpec; on: boolean; className?: string }) {
  return (
    <Appear when={on}>
      <Arrow id={spec.id} from={spec.from} to={spec.to} twoWay={spec.twoWay} className={className} />
    </Appear>
  )
}

function CardParts() {
  return (
    <>
      <span data-presentation-part="title">Title</span>
      <span data-presentation-part="caption">Caption</span>
      <span data-presentation-part="visual">
        <ImageIcon aria-hidden="true" />
        Visual
      </span>
    </>
  )
}

/** The single accumulating scene: entities enter at their step and never move or resize. */
export function Scene({ payload, stepIndex }: SceneProps<SamplePayload>) {
  const at = (step: number) => stepIndex >= step - 1
  const R = RECTS

  return (
    <SceneLayer>
      <Appear when={at(R.outerFrame.step)}>
        <Frame
          id={R.outerFrame.id}
          {...rect(R.outerFrame)}
          className="sample-frame"
          label="this talk, built by the skill"
          {...OVERLAP}
        />
      </Appear>
      <Appear when={at(R.tray.step)}>
        <Box id={R.tray.id} {...rect(R.tray)} className="sample-tray" label="the route" {...OVERLAP} />
      </Appear>

      <Appear when={at(R.prompt.step)}>
        <Label id={R.prompt.id} {...rect(R.prompt)} className="sample-prompt">
          “I want a talk about sourdough”
        </Label>
      </Appear>
      <Appear when={at(R.you.step)}>
        <Box id={R.you.id} {...rect(R.you)} className="sample-actor sample-you" Icon={User} label="You" />
      </Appear>
      <Appear when={at(R.skill.step)}>
        <Box id={R.skill.id} {...rect(R.skill)} className="sample-actor sample-skill" Icon={Bot} label="Skill" />
      </Appear>
      <Link spec={ARROWS.convo} on={at(ARROWS.convo.step)} className="sample-link sample-link-convo" />
      <Appear when={at(R.question.step)}>
        <SymbolChip id={R.question.id} {...rect(R.question)} className="sample-question" symbol="question ?" />
      </Appear>

      <Appear when={at(R.card1.step)}>
        <Box id={R.card1.id} {...rect(R.card1)} className="sample-card" label="Step 1">
          <CardParts />
        </Box>
      </Appear>
      <Appear when={at(R.card2.step)}>
        <Box id={R.card2.id} {...rect(R.card2)} className="sample-card" label="Step 2">
          <CardParts />
        </Box>
      </Appear>
      <Appear when={at(R.card3.step)}>
        <Box
          id={R.card3.id}
          {...rect(R.card3)}
          className="sample-card"
          label="Step 3"
          data-presentation-state={payload.editedCard === R.card3.id ? 'edited' : 'idle'}
        >
          <CardParts />
        </Box>
      </Appear>

      <Link spec={ARROWS.link12} on={at(ARROWS.link12.step)} />
      <Appear when={at(R.morph12.step)}>
        <Label id={R.morph12.id} {...rect(R.morph12)} className="sample-morph">
          position
        </Label>
      </Appear>
      <Link spec={ARROWS.link23} on={at(ARROWS.link23.step)} />
      <Appear when={at(R.morph23.step)}>
        <Label id={R.morph23.id} {...rect(R.morph23)} className="sample-morph">
          size
        </Label>
      </Appear>

      <Appear when={at(R.ghost.step)}>
        <Box id={R.ghost.id} {...rect(R.ghost)} className="sample-card sample-ghost" Icon={Sparkles} label="and more…">
          <span data-presentation-part="note">steps you left open</span>
        </Box>
      </Appear>
      <Link spec={ARROWS.link3Ghost} on={at(ARROWS.link3Ghost.step)} />
      <Appear when={at(R.depth.step)}>
        <SymbolChip
          id={R.depth.id}
          {...rect(R.depth)}
          className="sample-depth"
          data-presentation-depth={payload.depth}
          symbol={
            <>
              <span data-presentation-segment="partial" data-presentation-selected={payload.depth === 'partial' || undefined}>
                partial
              </span>
              <span aria-hidden="true">⇄</span>
              <span data-presentation-segment="full" data-presentation-selected={payload.depth === 'full' || undefined}>
                full
              </span>
            </>
          }
        />
      </Appear>

      <Appear when={at(R.kitSocket.step)}>
        <Box id={R.kitSocket.id} {...rect(R.kitSocket)} className="sample-socket" Icon={Layers} label="shared scene kit">
          <span data-presentation-part="note">boxes · arrows · motion</span>
        </Box>
      </Appear>

      <Appear when={at(R.verify.step)}>
        <Box
          id={R.verify.id}
          {...rect(R.verify)}
          className="sample-verify"
          label="verify"
          data-presentation-state={payload.verify}
        >
          <span data-presentation-check="build">build</span>
          <span data-presentation-check="render">render</span>
        </Box>
      </Appear>
      <Link spec={ARROWS.linkGhostVerify} on={at(ARROWS.linkGhostVerify.step)} />
      <Appear when={at(R.verifyPass.step)}>
        <SymbolChip
          id={R.verifyPass.id}
          {...rect(R.verifyPass)}
          className="sample-pass"
          aria-label="build and render checks pass"
          symbol={<Check aria-hidden="true" />}
          {...OVERLAP}
        />
      </Appear>

      <Link spec={ARROWS.modify} on={at(ARROWS.modify.step)} className="sample-link sample-link-modify" />
      <Appear when={at(R.modifyLabel.step)}>
        <Label id={R.modifyLabel.id} {...rect(R.modifyLabel)} className="sample-modify-label">
          edit in place
        </Label>
      </Appear>
      <Appear when={at(R.editedFlag.step)}>
        <Emphasis id={ID.editedFlag} {...rect(R.editedFlag)} className="sample-flag" {...OVERLAP}>
          <span data-presentation-flag="">edited</span>
        </Emphasis>
      </Appear>
    </SceneLayer>
  )
}
