import { useEffect, useState } from 'react'
import { Presentation } from '../../../src/presentation-kit/Presentation'
import type { SceneProps } from '../../../src/presentation-kit/types'
import './style.css'

function Scene({ payload }: SceneProps<{ beat: number }>) {
  const [settledBeat, setSettledBeat] = useState(0)
  const settled = settledBeat === payload.beat
  useEffect(() => {
    if (payload.beat === 3) document.querySelector('[data-presentation-attribution]')?.remove()
    const timer = setTimeout(() => setSettledBeat(payload.beat), 450)
    return () => clearTimeout(timer)
  }, [payload.beat])
  return <div data-fixture-beat={payload.beat}>
    <div className="collision first">{settled ? 'SETTLED collision A' : 'UNSETTLED collision A'}</div>
    <div className="collision second">collision B</div>
    <div data-presentation-allow-overlap>
      <span className="allowed">allowed A</span><span className="allowed">allowed B</span>
    </div>
    <div className="settle-pixel" style={{ background: settled ? '#00ff00' : '#ff0000' }} />
  </div>
}

const steps = [1, 2, 3].map(beat => ({
  id: `fixture-${beat}`, era: `era ${beat}`, title: `Fixture ${beat}`, caption: `Caption ${beat}`,
  groupKey: 'fixture', Scene, payload: { beat },
}))

export default function Talk() {
  return <Presentation steps={steps} title="Inspection fixture" initialMode="browse" className="inspection-fixture" />
}
