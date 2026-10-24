import { useState } from 'react'

/**
 * The beat shown before the current one (0 on the first render). Entities born after it
 * are newcomers for this transition, including those skipped over by a direct jump, so a
 * scene passes `def.beat > seen` as `Appear`'s `active`. `Appear`'s enter motion only applies
 * when an element mounts, so it is harmless that `seen` stays put until the beat changes again.
 */
export function useSeenBeat(beat: number): number {
  const [state, setState] = useState({ beat, seen: 0 })
  if (state.beat !== beat) setState({ beat, seen: state.beat })
  return state.beat === beat ? state.seen : state.beat
}
