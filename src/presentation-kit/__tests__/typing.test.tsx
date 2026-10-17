import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation } from '../Presentation'
import { defineStep } from '../steps'
import type { SceneProps } from '../types'

interface Grid {
  columns: number
}
interface Flow {
  nodes: string[]
}

function GridScene({ payload }: SceneProps<Grid>) {
  return <p>{payload.columns}</p>
}
function FlowScene({ payload }: SceneProps<Flow>) {
  return <p>{payload.nodes.join(',')}</p>
}

const meta = { era: 'e', caption: 'c' }

// Typed payloads of different shapes reach <Presentation> with no casts.
const steps = [
  defineStep({ ...meta, id: 'a', title: 'A', Scene: GridScene, groupKey: 'g', payload: { columns: 3 } }),
  defineStep({ ...meta, id: 'b', title: 'B', Scene: FlowScene, payload: { nodes: ['x', 'y'] } }),
]

describe('typed step payloads', () => {
  it('accepts a mixed typed step array at the presentation boundary', () => {
    const view = render(<Presentation title="Typed" steps={steps} />)
    expect(view.container.textContent).toContain('3')
  })

  it('rejects mismatched payloads and scene props at compile time', () => {
    // @ts-expect-error payload does not match the scene's payload type
    defineStep({ ...meta, id: 'x', title: 'X', Scene: GridScene, payload: { nodes: [] } })
    // @ts-expect-error scene props are not the payload type
    defineStep({ ...meta, id: 'y', title: 'Y', Scene: (props: { wrong: number }) => <p>{props.wrong}</p>, payload: { columns: 1 } })
    // @ts-expect-error a step needs its narration fields
    defineStep({ id: 'z', Scene: GridScene, payload: { columns: 1 } })
    expect(true).toBe(true)
  })
})
