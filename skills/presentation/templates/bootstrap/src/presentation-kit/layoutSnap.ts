import { createContext, useContext } from 'react'

/** True for the commit in which the fit geometry changed; entities then move without animating. */
export const LayoutSnapContext = createContext(false)

export function useLayoutSnap(): boolean {
  return useContext(LayoutSnapContext)
}
