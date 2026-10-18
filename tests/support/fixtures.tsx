import type { SceneProps, Step } from '../../src/presentation-kit'

export interface Payload {
  items: string[]
}

export function ListScene({ payload }: SceneProps<Payload>) {
  return (
    <ul data-testid="list-scene">
      {payload.items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  )
}

export function OtherScene({ payload }: SceneProps<Payload>) {
  return <p data-testid="other-scene">{payload.items.join(',')}</p>
}

export function makeSteps(count: number, eras: string[] = []): Step<Payload>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    era: eras[i] ?? `era ${i + 1}`,
    title: `Title ${i + 1}`,
    caption: `Caption ${i + 1} first line. Second line of the caption.`,
    Scene: ListScene,
    groupKey: 'g',
    payload: { items: Array.from({ length: i + 1 }, (_, k) => `item-${k + 1}`) },
  }))
}

export function setViewport(width: number, height = 800) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
  window.dispatchEvent(new Event('resize'))
}
