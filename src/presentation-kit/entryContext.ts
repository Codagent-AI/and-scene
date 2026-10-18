import { createContext } from 'react'

/** True when the Scene mounted because of a step change, so its newcomers should animate in. */
export const EntryContext = createContext(false)
