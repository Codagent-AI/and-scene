import { entities } from '../entities'
import { makeStep } from './shared'
export const step2 = makeStep({ id: 'step-2', era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.', payload: { prompt: true, skill: true, tray: false, cards: [], ghost: false, depth: false, kit: false, verify: false, modify: false, reveal: false }, entityIds: [entities.you, entities.prompt, entities.skill, entities.question, 'reference:conversation'] })
