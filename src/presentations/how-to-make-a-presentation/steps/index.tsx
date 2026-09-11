import type { Step } from '../../../presentation-kit/types.ts'
import { entities } from '../entities.ts'
import { ReferenceScene } from '../ReferenceScene.tsx'

export const REFERENCE_PRESENTATION_TITLE = 'How to Use This Skill to Make a Presentation'

type Card = {
  index: number
  title: string
  caption: string
  visual: string
}

export type ReferencePayload = {
  state: string
  cards: readonly Card[]
  showYou: boolean
  showPrompt: boolean
  showSkill: boolean
  showQuestion: boolean
  showConversationArrow: boolean
  showTray: boolean
  showMorph: boolean
  showGhost: boolean
  showDepth: boolean
  showSceneKit: boolean
  showVerify: boolean
  showPass: boolean
  showModify: boolean
  showModified: boolean
  showReveal: boolean
  newcomers: readonly string[]
}

const cardCopy: readonly Card[] = [
  { index: 1, title: 'title', caption: 'caption', visual: 'visual' },
  { index: 2, title: 'beat', caption: 'copy', visual: 'motion' },
  { index: 3, title: 'state', caption: 'story', visual: 'shape' },
  { index: 4, title: 'check', caption: 'proof', visual: 'pass' },
]

const newcomer = (...ids: string[]) => ids

export const REFERENCE_STEPS: readonly Step<ReferencePayload>[] = [
  {
    id: 'the-ask',
    era: 'the ask',
    title: 'You have a topic',
    caption: 'It starts with you, a topic, and mild overconfidence.',
    groupKey: 'reference-scene',
    Scene: ReferenceScene,
    payload: {
      state: 'ask', cards: [], showYou: true, showPrompt: true, showSkill: false, showQuestion: false,
      showConversationArrow: false, showTray: false, showMorph: false, showGhost: false, showDepth: false,
      showSceneKit: false, showVerify: false, showPass: false, showModify: false, showModified: false,
      showReveal: false, newcomers: newcomer(entities.you, entities.prompt),
    },
  },
  {
    id: 'the-interview',
    era: 'the ask',
    title: 'The skill interviews you',
    caption: 'One question at a time: the topic, the look, then each beat of the story.',
    groupKey: 'reference-scene',
    Scene: ReferenceScene,
    payload: {
      state: 'interview', cards: [], showYou: true, showPrompt: true, showSkill: true, showQuestion: true,
      showConversationArrow: true, showTray: false, showMorph: false, showGhost: false, showDepth: false,
      showSceneKit: false, showVerify: false, showPass: false, showModify: false, showModified: false,
      showReveal: false, newcomers: newcomer(entities.skill, entities.question, entities.conversationArrow),
    },
  },
  {
    id: 'answers-become-steps',
    era: 'the gathering',
    title: 'Answers become steps',
    caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
    groupKey: 'reference-scene',
    Scene: ReferenceScene,
    payload: {
      state: 'first-card', cards: cardCopy.slice(0, 1), showYou: true, showPrompt: true, showSkill: true, showQuestion: true,
      showConversationArrow: true, showTray: true, showMorph: true, showGhost: false, showDepth: false,
      showSceneKit: false, showVerify: false, showPass: false, showModify: false, showModified: false,
      showReveal: false, newcomers: newcomer(entities.tray, entities.cards[0], entities.morph),
    },
  },
  {
    id: 'the-deck-grows',
    era: 'the gathering',
    title: 'The deck grows',
    caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
    groupKey: 'reference-scene',
    Scene: ReferenceScene,
    payload: {
      state: 'deck-grows', cards: cardCopy.slice(0, 3), showYou: true, showPrompt: true, showSkill: true, showQuestion: true,
      showConversationArrow: true, showTray: true, showMorph: true, showGhost: false, showDepth: false,
      showSceneKit: false, showVerify: false, showPass: false, showModify: false, showModified: false,
      showReveal: false, newcomers: newcomer(entities.cards[1], entities.cards[2]),
    },
  },
  {
    id: 'set-the-depth',
    era: 'the gathering',
    title: 'You set the depth',
    caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
    groupKey: 'reference-scene',
    Scene: ReferenceScene,
    payload: {
      state: 'depth', cards: cardCopy.slice(0, 3), showYou: true, showPrompt: true, showSkill: true, showQuestion: true,
      showConversationArrow: true, showTray: true, showMorph: true, showGhost: true, showDepth: true,
      showSceneKit: false, showVerify: false, showPass: false, showModify: false, showModified: false,
      showReveal: false, newcomers: newcomer(entities.ghost, entities.depth),
    },
  },
  {
    id: 'assemble-the-scene',
    era: 'the build',
    title: 'It assembles the scene',
    caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
    groupKey: 'reference-scene',
    Scene: ReferenceScene,
    payload: {
      state: 'assemble', cards: cardCopy.slice(0, 3), showYou: true, showPrompt: true, showSkill: true, showQuestion: true,
      showConversationArrow: true, showTray: true, showMorph: true, showGhost: true, showDepth: true,
      showSceneKit: true, showVerify: false, showPass: false, showModify: false, showModified: false,
      showReveal: false, newcomers: newcomer(entities.sceneKit),
    },
  },
  {
    id: 'check-the-work',
    era: 'the build',
    title: 'It checks its own work',
    caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
    groupKey: 'reference-scene',
    Scene: ReferenceScene,
    payload: {
      state: 'verify', cards: cardCopy.slice(0, 4), showYou: true, showPrompt: true, showSkill: true, showQuestion: true,
      showConversationArrow: true, showTray: true, showMorph: true, showGhost: true, showDepth: true,
      showSceneKit: true, showVerify: true, showPass: true, showModify: false, showModified: false,
      showReveal: false, newcomers: newcomer(entities.cards[3], entities.verify, entities.pass),
    },
  },
  {
    id: 'loop-it',
    era: 'the loop',
    title: 'Changed your mind? Loop it.',
    caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
    groupKey: 'reference-scene',
    Scene: ReferenceScene,
    payload: {
      state: 'loop', cards: cardCopy.slice(0, 4), showYou: true, showPrompt: true, showSkill: true, showQuestion: true,
      showConversationArrow: true, showTray: true, showMorph: true, showGhost: true, showDepth: true,
      showSceneKit: true, showVerify: true, showPass: true, showModify: true, showModified: true,
      showReveal: false, newcomers: newcomer(entities.modify, entities.modified),
    },
  },
  {
    id: 'looking-at-one',
    era: 'the reveal',
    title: "You're looking at one",
    caption: 'This presentation was built exactly this way. Thanks for watching.',
    groupKey: 'reference-scene',
    Scene: ReferenceScene,
    payload: {
      state: 'reveal', cards: cardCopy.slice(0, 4), showYou: true, showPrompt: true, showSkill: true, showQuestion: true,
      showConversationArrow: true, showTray: true, showMorph: true, showGhost: true, showDepth: true,
      showSceneKit: true, showVerify: true, showPass: true, showModify: true, showModified: true,
      showReveal: true, newcomers: newcomer(entities.reveal),
    },
  },
]
