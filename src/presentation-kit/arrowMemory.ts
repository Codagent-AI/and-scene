import { createContext } from 'react'

/** Last drawn path per arrow id, so an arrow in a new scene can morph from where it was. */
export const ArrowMemoryContext = createContext<Map<string, string>>(new Map())
