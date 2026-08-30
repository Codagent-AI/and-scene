/* eslint-disable react-refresh/only-export-components -- step data and its typed scene stay together. */
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps, type Step } from '../../../presentation-kit'
import { entities } from '../entities'

interface SceneState {
  beat: number
}

function StepCard({ id, className, children }: { id: string; className: string; children: React.ReactNode }) {
  return <Box className={`how-to-card ${className}`} id={id}>{children}</Box>
}

function ReferenceScene({ payload }: SceneProps<SceneState>) {
  const { beat } = payload
  return (
    <SceneLayer className="how-to-scene">
      <Box className="how-to-person how-to-you" id={entities.you} key={entities.you}>
        <strong>you</strong><span>topic in hand</span>
      </Box>
      <Box className="how-to-prompt" id={entities.prompt} key={entities.prompt}>
        <span>“I need a presentation about…”</span>
      </Box>

      {beat >= 2 ? <Appear key="skill-arrival" id="skill-arrival"><Box className="how-to-person how-to-skill" id={entities.skill}>
        <strong>skill</strong><span>one question at a time</span>
      </Box></Appear> : null}
      {beat >= 2 ? <Appear key="conversation-arrival" id="conversation-arrival"><Arrow className="how-to-conversation-link" id={entities.conversationLink}>↔</Arrow></Appear> : null}
      {beat >= 2 ? <Appear key="question-arrival" id="question-arrival"><SymbolChip className="how-to-question" id={entities.question} symbol="?">topic · look · beats</SymbolChip></Appear> : null}

      {beat >= 3 ? <Appear key="tray-arrival" id="tray-arrival"><div className="how-to-tray" data-presentation-entity={entities.tray} /></Appear> : null}
      {beat >= 3 ? <Appear key="card-one-arrival" id="card-one-arrival"><StepCard className="how-to-card-one" id={entities.stepOne}>
        <b>01</b><strong>step</strong><span>title · caption · visual</span>
      </StepCard></Appear> : null}
      {beat >= 4 ? <Appear key="card-two-arrival" id="card-two-arrival"><StepCard className="how-to-card-two" id={entities.stepTwo}>
        <b>02</b><strong>beat</strong><span>same shapes, next state</span>
      </StepCard></Appear> : null}
      {beat >= 4 ? <Appear key="card-three-arrival" id="card-three-arrival"><StepCard className="how-to-card-three" id={entities.stepThree}>
        <b>03</b><strong>beat</strong><span>story keeps growing</span>
      </StepCard></Appear> : null}
      {beat >= 4 ? <Appear key="card-four-arrival" id="card-four-arrival"><StepCard className="how-to-card-four" id={entities.stepFour}>
        <b>04</b><strong>beat</strong><span>entities persist</span>
      </StepCard></Appear> : null}
      {beat >= 4 ? <Arrow className="how-to-morph-link" id="how-to-make-a-presentation:morph-link" key="how-to-make-a-presentation:morph-link">morphs →</Arrow> : null}

      {beat === 5 ? <Appear key="ghost-card-arrival" id="ghost-card-arrival"><Box className="how-to-ghost-card" id={entities.ghostStep}>… unspecified steps</Box></Appear> : null}
      {beat >= 5 ? <Appear key="depth-control-arrival" id="depth-control-arrival"><SymbolChip className="how-to-depth-control" id={entities.depthControl}>partial ↔ full</SymbolChip></Appear> : null}

      {beat >= 6 ? <Appear key="scene-kit-arrival" id="scene-kit-arrival"><Box className="how-to-scene-kit" id={entities.sceneKit}>
        <span>shared</span><strong>scene kit</strong><span>boxes · arrows · motion</span>
      </Box></Appear> : null}
      {beat >= 6 ? <Appear key="kit-plug-arrival" id="kit-plug-arrival"><div data-presentation-allow-overlap><Arrow className="how-to-kit-plug" id="how-to-make-a-presentation:kit-plug">⌁</Arrow></div></Appear> : null}

      {beat >= 7 ? <Appear key="verify-arrival" id="verify-arrival"><Box className="how-to-verify" id={entities.verify}>
        <strong>verify</strong><span>build + render</span>
      </Box></Appear> : null}
      {beat >= 7 ? <Appear key="verify-link-arrival" id="verify-link-arrival"><Arrow className="how-to-verify-link" id={entities.verifyLink}>→</Arrow></Appear> : null}
      {beat >= 7 ? <Appear key="pass-arrival" id="pass-arrival"><Emphasis className="how-to-pass" id={entities.pass}>✓ pass</Emphasis></Appear> : null}

      {beat >= 8 ? <Appear key="modify-arc-arrival" id="modify-arc-arrival"><Arrow className="how-to-modify-arc" id={entities.modifyArc}>modify in place ↘</Arrow></Appear> : null}
      {beat >= 8 ? <Appear key="edited-flag-arrival" id="edited-flag-arrival"><div data-presentation-allow-overlap><Label className="how-to-edited-flag" id={entities.editedFlag}>edited</Label></div></Appear> : null}

      {beat >= 9 ? <Appear key="reveal-arrival" id="reveal-arrival"><Frame className="how-to-reveal" id={entities.reveal}>
        <span>this is one</span>
      </Frame></Appear> : null}
    </SceneLayer>
  )
}

const outline = [
  ['ask-topic', 'the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['interview', 'the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['answers-to-steps', 'the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['deck-grows', 'the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['set-depth', 'the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['assemble', 'the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['verify', 'the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['loop', 'the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['reveal', 'the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

export const steps: readonly [Step<SceneState>, ...Step<SceneState>[]] = outline.map(
  ([id, era, title, caption], index) => ({
    id,
    era,
    title,
    caption,
    Scene: ReferenceScene,
    groupKey: 'how-to-make-a-presentation-scene',
    payload: { beat: index + 1 },
  }),
) as unknown as readonly [Step<SceneState>, ...Step<SceneState>[]]
