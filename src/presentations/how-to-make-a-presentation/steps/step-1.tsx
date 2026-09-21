import { entities } from '../entities'
import { makeStep } from './shared'
export const step1 = makeStep({ id: 'step-1', era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.', payload: { prompt: true, skill: false, tray: false, cards: [], ghost: false, depth: false, kit: false, verify: false, modify: false, reveal: false }, entityIds: [entities.you, entities.prompt] })
