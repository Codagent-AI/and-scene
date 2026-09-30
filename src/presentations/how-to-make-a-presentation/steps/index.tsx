import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entities } from '../entities'

/* eslint-disable react-refresh/only-export-components */

type ScenePayload = {
  cardCount: number
  depth?: boolean
  kit?: boolean
  modify?: boolean
  question?: boolean
  reveal?: boolean
  skill?: boolean
  verify?: boolean
}

const cardTitles = ['topic', 'interview', 'steps', 'growth']

function StepCard({ index }: { index: number }) {
  return (
    <Box className={`skill-step-card skill-step-card-${index}`} layoutId={entities.card(index)}>
      <Label layoutId={entities.cardLabel(index)}>step {String(index).padStart(2, '0')}<small>{cardTitles[index - 1]}</small></Label>
      {index === 1 ? <span className="skill-card-parts">title · caption · visual</span> : null}
      {index > 1 ? <Arrow className="skill-card-link" layoutId={entities.cardLink(index)} /> : null}
    </Box>
  )
}

function SkillScene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer className="skill-scene">
      {payload.reveal ? <Appear><Frame className="skill-reveal-frame" layoutId={entities.frame}><span>self-reference reveal</span></Frame></Appear> : null}

      <Box className="skill-you" layoutId={entities.you}><Label layoutId={`${entities.you}:label`}>you</Label></Box>
      <Box className="skill-prompt" layoutId={entities.prompt}><Label layoutId={`${entities.prompt}:label`}>a topic, maybe</Label></Box>

      {payload.skill ? <Appear><Box className="skill-node" layoutId={entities.skill}><Label layoutId={`${entities.skill}:label`}>the skill</Label></Box></Appear> : null}
      {payload.skill ? <Arrow className="skill-ask-arrow skill-ask-arrow-forward" layoutId={entities.askArrow} /> : null}
      {payload.skill ? <Arrow className="skill-ask-arrow skill-ask-arrow-back" layoutId={`${entities.askArrow}:back`} /> : null}
      {payload.question ? <Appear><SymbolChip className="skill-question" layoutId={entities.question}>one question</SymbolChip></Appear> : null}
      {payload.depth ? <Appear><SymbolChip className="skill-depth" layoutId={entities.depth}>partial ↔ full</SymbolChip></Appear> : null}

      {payload.cardCount ? <Box className="skill-tray" layoutId={entities.tray}><Label layoutId={`${entities.tray}:label`}>your evolving scene</Label></Box> : null}
      {Array.from({ length: payload.cardCount }, (_, offset) => {
        const index = offset + 1
        return index === payload.cardCount && index > 1 ? <Appear key={index}><StepCard index={index} /></Appear> : <StepCard index={index} key={index} />
      })}
      {payload.depth ? <Appear><Box className="skill-ghost-card" layoutId={`${entities.tray}:ghost`}>unspecified</Box></Appear> : null}
      {payload.kit ? <Appear><Box className="skill-kit" layoutId={entities.kit}><Label layoutId={`${entities.kit}:label`}>scene kit</Label><span>boxes · arrows · motion</span></Box></Appear> : null}
      {payload.verify ? <Appear><Box className="skill-verify" layoutId={entities.verify}><Label layoutId={`${entities.verify}:label`}>verify <Emphasis layoutId={`${entities.verify}:pass`}>✓ pass</Emphasis></Label></Box></Appear> : null}
      {payload.modify ? <Appear><Arrow className="skill-modify" layoutId={entities.modify} /><SymbolChip className="skill-edited" layoutId={`${entities.modify}:flag`}>edited</SymbolChip></Appear> : null}
    </SceneLayer>
  )
}

export const STEPS: readonly Step<ScenePayload>[] = [
  { id: 'topic', era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.', Scene: SkillScene, payload: { cardCount: 0 }, groupKey: 'how-to-make-a-presentation' },
  { id: 'interview', era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.', Scene: SkillScene, payload: { cardCount: 0, question: true, skill: true }, groupKey: 'how-to-make-a-presentation' },
  { id: 'answers', era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', Scene: SkillScene, payload: { cardCount: 1, question: true, skill: true }, groupKey: 'how-to-make-a-presentation' },
  { id: 'growth', era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.', Scene: SkillScene, payload: { cardCount: 3, question: true, skill: true }, groupKey: 'how-to-make-a-presentation' },
  { id: 'depth', era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', Scene: SkillScene, payload: { cardCount: 3, depth: true, question: true, skill: true }, groupKey: 'how-to-make-a-presentation' },
  { id: 'assemble', era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', Scene: SkillScene, payload: { cardCount: 3, depth: true, kit: true, question: true, skill: true }, groupKey: 'how-to-make-a-presentation' },
  { id: 'verify', era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.', Scene: SkillScene, payload: { cardCount: 4, depth: true, kit: true, question: true, skill: true, verify: true }, groupKey: 'how-to-make-a-presentation' },
  { id: 'modify', era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', Scene: SkillScene, payload: { cardCount: 4, depth: true, kit: true, modify: true, question: true, skill: true, verify: true }, groupKey: 'how-to-make-a-presentation' },
  { id: 'reveal', era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.', Scene: SkillScene, payload: { cardCount: 4, depth: true, kit: true, modify: true, question: true, reveal: true, skill: true, verify: true }, groupKey: 'how-to-make-a-presentation' },
]
