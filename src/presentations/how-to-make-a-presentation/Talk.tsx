import { Presentation } from '../../presentation-kit'
import { useEffect, useState } from 'react'
import { STEPS } from './steps'
import './presentation.css'

export default function Talk() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 700px)').matches)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(max-width: 700px)')
    if (!media) return
    const update = () => setNarrow(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return <Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" designSize={narrow ? { width: 360, height: 560 } : undefined} />
}
