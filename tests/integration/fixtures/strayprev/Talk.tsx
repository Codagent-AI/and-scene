import { useEffect } from 'react'
import { Presentation } from '../../presentation-kit/index.ts'
import { Plain } from '../_shared/scenes.tsx'
import { twoSteps } from '../_shared/steps.ts'
import '../_shared/active.css'
import '../_shared/attribution.css'

/** Stray text laid exactly over the icon-only "previous" control. */
function useStrayOverPrev() {
  useEffect(() => {
    const box = document.querySelector('[data-presentation-prev]')!.getBoundingClientRect()
    const stray = document.createElement('span')
    stray.textContent = 'oops'
    Object.assign(stray.style, { position: 'fixed', left: `${box.left}px`, top: `${box.top}px`, fontSize: '12px', zIndex: '5' })
    document.body.append(stray)
    return () => stray.remove()
  }, [])
}

export default function Talk() {
  useStrayOverPrev()
  return <Presentation steps={twoSteps(Plain)} title="strayprev" />
}
