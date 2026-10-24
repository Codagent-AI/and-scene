import { createContext } from 'react'

export interface StageState {
  /** False until the viewer has moved off the first rendered step. */
  hasNavigated: boolean
}

export const StageContext = createContext<StageState>({ hasNavigated: true })
