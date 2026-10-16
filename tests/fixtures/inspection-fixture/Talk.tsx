// Controlled fixture for the INT-002 browser test. Copied into a throwaway project's
// src/presentations/inspection-fixture/ by the test; never registered in the shipping registry.
import { useEffect, useState } from 'react'
import { Presentation, type SceneProps, type Step } from '../../presentation-kit'

const abs = (top: number, left: number) => ({ position: 'absolute' as const, top, left, margin: 0, fontSize: 24 })

// Step 2: an unmarked text collision.
function Collision() {
  return (
    <div style={{ position: 'relative', width: 880, height: 380 }}>
      <p style={abs(100, 100)}>First colliding label</p>
      <p style={abs(106, 120)}>Second colliding label</p>
    </div>
  )
}

// Step 3: the same collision, explicitly allowed.
function Allowed() {
  return (
    <div data-presentation-allow-overlap style={{ position: 'relative', width: 880, height: 380 }}>
      <p style={abs(100, 100)}>Intentional base label</p>
      <p style={abs(106, 120)}>Intentional overlay label</p>
    </div>
  )
}

// Step 4: content that only enters after a delay, so it is missing unless capture waits.
function Delayed() {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 400)
    return () => clearTimeout(t)
  }, [])
  return (
    <div style={{ position: 'relative', width: 880, height: 380 }}>
      <p data-fixture-delayed style={{ ...abs(100, 100), opacity: shown ? 1 : 0 }}>
        Delayed entrance
      </p>
    </div>
  )
}

function Plain({ step }: SceneProps) {
  return <p style={abs(100, 100)}>{step.title}</p>
}

const steps: Step[] = [
  { id: 'plain', era: 'One', title: 'Plain', caption: 'No collision here.', Scene: Plain },
  { id: 'collision', era: 'One', title: 'Collision', caption: 'Unmarked collision.', Scene: Collision },
  { id: 'allowed', era: 'Two', title: 'Allowed', caption: 'Allowed overlap.', Scene: Allowed },
  { id: 'delayed', era: 'Two', title: 'Delayed', caption: 'Delayed entrance.', Scene: Delayed },
]

export default function Talk() {
  return (
    <>
      {/* Unpolished attribution: tiny text. Active chrome is deliberately left unstyled. */}
      <style>{'[data-presentation-attribution]{font-size:8px}'}</style>
      <Presentation steps={steps} title="Inspection fixture" initialMode="browse" />
    </>
  )
}
