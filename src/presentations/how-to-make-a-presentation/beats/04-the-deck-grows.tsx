import { ListChecks, Palette, Route } from 'lucide-react'
import { EDITED_CARD } from '../entities'
import { CardLink, StepCard } from '../StepCard'
import type { BeatProps } from './types'

const isEdited = (beat: number, card: number) => beat >= 8 && card === EDITED_CARD

/** Cards 2–4 land in the tray; card 1 (from the previous beat) is re-rendered untouched. */
export function Beat4({ beat }: BeatProps) {
  return (
    <>
      <StepCard index={1} Icon={ListChecks} edited={isEdited(beat, 1)} />
      <StepCard index={2} Icon={Palette} edited={isEdited(beat, 2)} />
      <StepCard index={3} Icon={Route} edited={isEdited(beat, 3)} />
      <CardLink index={0} />
      <CardLink index={1} />
      <CardLink index={2} />
    </>
  )
}

