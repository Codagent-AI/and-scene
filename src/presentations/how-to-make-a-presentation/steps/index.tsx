/* eslint-disable react-refresh/only-export-components */
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps, type Step } from '../../../presentation-kit'
import { ENTITIES, cardId, cardLinkId } from '../entities'

type Payload = {
  cards: number
  showSkill: boolean
  showQuestion: boolean
  showTray: boolean
  showDepth: boolean
  showKit: boolean
  showVerify: boolean
  showModify: boolean
  showReveal: boolean
}

const cardLabels = ['title', 'caption', 'visual', 'morph']

function Scene({ payload }: SceneProps<Payload>) {
  return (
    <SceneLayer className="how-to-scene">
      <Box entityId={ENTITIES.you} className="how-to-node how-to-you" style={{ left: 54, top: 34 }}>you</Box>
      <Box entityId={ENTITIES.prompt} className="how-to-bubble" style={{ left: 210, top: 25 }}>a topic</Box>
      {payload.showSkill && <Box entityId={ENTITIES.skill} className="how-to-node how-to-skill" style={{ left: 650, top: 34 }}>skill</Box>}
      {payload.showSkill && <Arrow entityId={ENTITIES.conversation} className="how-to-arrow how-to-conversation" style={{ left: 155, top: 62, width: 500 }} />}
      {payload.showQuestion && <SymbolChip entityId={ENTITIES.question} className="how-to-chip" style={{ left: 378, top: 4 }}>?</SymbolChip>}
      {payload.showTray && <div className="how-to-tray" data-presentation-overlap-allowed="step-cards">
        {Array.from({ length: payload.cards }, (_, index) => (
          <Box key={cardId(index)} entityId={cardId(index)} className={`how-to-card ${index === payload.cards - 1 && payload.showModify ? 'is-flagged' : ''}`} style={{ left: 64 + index * 154, top: 174 }}>
            <span className="how-to-card__number">0{index + 1}</span>
            <span>{index < 3 ? cardLabels[index] : 'beat'}</span>
            {index > 0 && <Arrow entityId={cardLinkId(index)} className="how-to-card__link" style={{ left: -24, top: 34, width: 18 }} />}
          </Box>
        ))}
      </div>}
      {payload.showDepth && <>
        <Box entityId={ENTITIES.ghost} className="how-to-card how-to-ghost" style={{ left: 606, top: 174 }}>…</Box>
        <Box entityId={ENTITIES.depth} className="how-to-depth" style={{ left: 54, top: 284 }}>partial ↔ full</Box>
        <Arrow entityId={ENTITIES.depth + ':link'} className="how-to-arrow how-to-depth-arrow" style={{ left: 112, top: 252, width: 40 }} />
      </>}
      {payload.showKit && <>
        <Box entityId={ENTITIES.kit} className="how-to-socket" style={{ left: 354, top: 300 }}>scene kit</Box>
        <Label entityId={ENTITIES.kit + ':label'} className="how-to-label" style={{ left: 470, top: 327 }}>boxes · arrows · motion</Label>
      </>}
      {payload.showVerify && <>
        <Box entityId={ENTITIES.verify} className="how-to-verify" style={{ left: 738, top: 174 }}>verify <span aria-label="passed">✓</span></Box>
        <Arrow entityId={ENTITIES.verify + ':link'} className="how-to-arrow how-to-verify-arrow" style={{ left: 605, top: 214, width: 124 }} />
      </>}
      {payload.showModify && <>
        <Emphasis entityId={ENTITIES.modify} className="how-to-arc" style={{ left: 248, top: 90, width: 360, height: 150 }} />
        <Label entityId={ENTITIES.route} className="how-to-route" style={{ left: 326, top: 116 }}>edit in place</Label>
      </>}
      {payload.showReveal && <Frame entityId={ENTITIES.reveal} className="how-to-reveal" style={{ left: 22, top: 0, width: 816, height: 360 }}><span>self-reference</span></Frame>}
    </SceneLayer>
  )
}

const makeStep = (id: string, era: string, title: string, caption: string, payload: Payload): Step<Payload> => ({ id, era, title, caption, payload, Scene, groupKey: 'how-to-evolving-scene' })

export const STEPS: readonly Step<Payload>[] = [
  makeStep('topic', 'the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.', { cards: 0, showSkill: false, showQuestion: false, showTray: false, showDepth: false, showKit: false, showVerify: false, showModify: false, showReveal: false }),
  makeStep('interview', 'the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.', { cards: 0, showSkill: true, showQuestion: true, showTray: false, showDepth: false, showKit: false, showVerify: false, showModify: false, showReveal: false }),
  makeStep('answers', 'the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', { cards: 1, showSkill: true, showQuestion: true, showTray: true, showDepth: false, showKit: false, showVerify: false, showModify: false, showReveal: false }),
  makeStep('grows', 'the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.', { cards: 3, showSkill: true, showQuestion: true, showTray: true, showDepth: false, showKit: false, showVerify: false, showModify: false, showReveal: false }),
  makeStep('depth', 'the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', { cards: 3, showSkill: true, showQuestion: true, showTray: true, showDepth: true, showKit: false, showVerify: false, showModify: false, showReveal: false }),
  makeStep('assemble', 'the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', { cards: 3, showSkill: true, showQuestion: true, showTray: true, showDepth: true, showKit: true, showVerify: false, showModify: false, showReveal: false }),
  makeStep('verify', 'the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.', { cards: 3, showSkill: true, showQuestion: true, showTray: true, showDepth: true, showKit: true, showVerify: true, showModify: false, showReveal: false }),
  makeStep('loop', 'the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', { cards: 3, showSkill: true, showQuestion: true, showTray: true, showDepth: true, showKit: true, showVerify: true, showModify: true, showReveal: false }),
  makeStep('reveal', 'the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.', { cards: 3, showSkill: true, showQuestion: true, showTray: true, showDepth: true, showKit: true, showVerify: true, showModify: true, showReveal: true }),
]
