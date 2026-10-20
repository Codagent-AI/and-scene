import { cardLink, stepCard } from '../cards.tsx'

export const meta = {
  id: 'grows',
  era: 'the gathering',
  title: 'The deck grows',
  caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
}

export const entities = () => [...stepCard(2), ...cardLink(1, 'label, emphasis'), ...stepCard(3), ...cardLink(2, 'position, size')]
