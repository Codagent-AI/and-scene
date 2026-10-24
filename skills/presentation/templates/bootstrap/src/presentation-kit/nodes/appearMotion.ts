import { createContext, useContext } from 'react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

export interface AppearState {
  delay: number
}

export const AppearContext = createContext<AppearState | null>(null)

/** Enter motion for the nearest `Appear`, or none for a continuing entity. */
export function useAppearMotion() {
  const appear = useContext(AppearContext)
  if (!appear) return {}
  return {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: ENTER_T, delay: ENTER_DELAY + appear.delay, ease: EASE },
    },
  }
}
