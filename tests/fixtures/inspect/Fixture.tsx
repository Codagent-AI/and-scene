// Controlled presentation for the screenshot-helper integration test. It is
// copied into a disposable app copy and registered once per variant.
import { useEffect } from 'react'
import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './fixture.css'

export interface Variant {
  /** Style the active progress indicator distinctly. */
  progress: boolean
  /** Style the active table-of-contents entry distinctly. */
  toc: boolean
  attribution: 'good' | 'small' | 'default' | 'missing'
  collision: 'none' | 'unmarked' | 'allowed'
}

interface Payload {
  collision: Variant['collision']
}

/** Fixed-position text placed exactly over the title chrome. */
function TitleCollider() {
  useEffect(() => {
    const title = document.querySelector('[data-presentation-title]')
    if (!title) return
    const range = document.createRange()
    range.selectNodeContents(title)
    const rect = range.getBoundingClientRect()
    const collider = document.createElement('div')
    collider.setAttribute('data-fx-collider', '')
    collider.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px`
    collider.textContent = 'COLLIDING TEXT'
    document.body.append(collider)
    return () => collider.remove()
  }, [])
  return null
}

function FixtureScene({ index, payload }: SceneProps<Payload>) {
  const overlapping = index === 1 && payload.collision !== 'none'
  const pair = [
    <Label key="a" id="a" x={100} y={120} width={300} height={40}>first overlapping label</Label>,
    <Label key="b" id="b" x={160} y={130} width={300} height={40}>second overlapping label</Label>,
  ]
  return (
    <SceneLayer>
      <div key={`pulse-${index}`} data-fx-pulse="" style={{ position: 'absolute', left: 600, top: 20 }}>step {index + 1}</div>
      <Label key="steady" id="steady" x={100} y={20} width={300} height={40}>steady label</Label>
      {overlapping && payload.collision === 'allowed' && <div key="allowed" data-presentation-allow-overlap="">{pair}</div>}
      {overlapping && payload.collision === 'unmarked' && pair}
      {index === 2 && payload.collision === 'unmarked' && <TitleCollider key="collider" />}
    </SceneLayer>
  )
}

export function makeTalk(slug: string, variant: Variant) {
  const steps: Step<Payload>[] = [0, 1, 2].map((i) => ({
    id: `${slug}-${i}`,
    era: i === 0 ? 'first era' : 'second era',
    title: `Fixture step ${i + 1}`,
    caption: `Caption for fixture step ${i + 1}.`,
    Scene: FixtureScene,
    groupKey: slug,
    payload: { collision: variant.collision },
  }))
  const className = [
    'fx',
    variant.progress && 'fx-progress',
    variant.toc && 'fx-toc',
    `fx-attr-${variant.attribution}`,
  ].filter(Boolean).join(' ')
  return function Talk() {
    return <Presentation steps={steps} title={slug} className={className} attribution={variant.attribution === 'missing' ? false : undefined} />
  }
}
