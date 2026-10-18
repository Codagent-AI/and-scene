import { createContext, useContext } from 'react'

export interface StageState {
  /** True when the canvas was remounted by a mode switch: entities show without entering. */
  instant: boolean
}

export const StageContext = createContext<StageState>({ instant: false })

export function useStageState(): StageState {
  return useContext(StageContext)
}
