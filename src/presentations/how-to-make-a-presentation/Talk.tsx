import { useSyncExternalStore } from 'react'
import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './presentation.css'

// Below 700px the scene reflows into two columns on a 360x560 design canvas (see presentation.css).
const NARROW_QUERY = '(max-width: 699px)'
const WIDE_SIZE = { width: 880, height: 380 }
const NARROW_SIZE = { width: 360, height: 560 }

// Environments without matchMedia fall back to the kit's default design size.
const canMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

function subscribe(onChange: () => void) {
  if (!canMatchMedia()) return () => {}
  const query = window.matchMedia(NARROW_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function useNarrow() {
  return useSyncExternalStore(subscribe, () => canMatchMedia() && window.matchMedia(NARROW_QUERY).matches, () => false)
}

export default function Talk() {
  const narrow = useNarrow()
  const designSize = narrow ? NARROW_SIZE : canMatchMedia() ? WIDE_SIZE : undefined
  return <Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" designSize={designSize} />
}
