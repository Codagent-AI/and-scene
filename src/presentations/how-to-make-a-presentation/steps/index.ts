import type { Step } from '../../../presentation-kit/types.ts'
import { Scene } from './scene.tsx'

const beat = (id: string, era: string, title: string, caption: string): Step<null> => ({
  id,
  era,
  title,
  caption,
  Scene,
  payload: null,
  groupKey: 'how-to-make-a-presentation',
})

export const STEPS: Step<null>[] = [
  beat("topic", "the ask", "You have a topic", "It starts with you, a topic, and mild overconfidence."),
  beat("interview", "the ask", "The skill interviews you", "One question at a time: the topic, the look, then each beat of the story."),
  beat("steps", "the gathering", "Answers become steps", "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next."),
  beat("deck-grows", "the gathering", "The deck grows", "Same shapes, new beats. Every answer extends the story without redrawing it."),
  beat("depth", "the gathering", "You set the depth", "Spell out every step, or sketch a few and see how it looks. You hold the gate."),
  beat("assemble", "the build", "It assembles the scene", "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph."),
  beat("verify", "the build", "It checks its own work", "Before saying done, it builds and renders every step — and fixes what breaks."),
  beat("loop", "the loop", "Changed your mind? Loop it.", "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch."),
  beat("reveal", "the reveal", "You're looking at one", "This presentation was built exactly this way. Thanks for watching."),
]
