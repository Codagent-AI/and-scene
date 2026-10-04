import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { resolvePresentationSlug } from '../src/route'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SymbolChip } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit/types'

afterEach(cleanup)

let mounts = 0
function TypedScene({ payload }: SceneProps<{ value: number }>) {
  useEffect(() => { mounts += 1 }, [])
  return <div data-testid="payload">{payload.value}</div>
}

const typedSteps: readonly Step<{ value: number }>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'First caption', groupKey: 'story', Scene: TypedScene, payload: { value: 1 } },
  { id: 'two', era: 'Build', title: 'Second', caption: 'Second caption', groupKey: 'story', Scene: TypedScene, payload: { value: 2 } },
]

describe('presentation kit contract', () => {
  it('accepts typed grouped payloads at the Presentation boundary and retains the scene', () => {
    mounts = 0
    render(<Presentation steps={typedSteps} title="Typed" attribution={false} />)
    expect(screen.getByTestId('payload').textContent).toBe('1')
    const initialMounts = mounts
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('payload').textContent).toBe('2')
    expect(mounts).toBe(initialMounts)
  })

  it('clamps navigation and exposes semantic active state', () => {
    const view = render(<Presentation steps={typedSteps} title="Typed" attribution={false} />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    fireEvent.click(screen.getByRole('button', { name: 'Step 2: Second' }))
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    expect(screen.getByRole('button', { name: 'Step 2: Second' }).getAttribute('aria-current')).toBe('step')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    view.rerender(<Presentation steps={typedSteps.slice(0, 1)} title="Typed" attribution={false} />)
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  })

  it('resolves routes below the configured Vite base path', () => {
    expect(resolvePresentationSlug('/studio/architecture/', '/studio/')).toBe('architecture')
    expect(resolvePresentationSlug('/studio/', '/studio/')).toBe('')
    expect(resolvePresentationSlug('/elsewhere/architecture', '/studio/')).toBe('elsewhere/architecture')
  })

  it('switches modes without changing position and renders default attribution', () => {
    render(<Presentation steps={typedSteps} title="Typed" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    expect(screen.getByRole('main').getAttribute('data-presentation-mode')).toBe('present')
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('')
  })

  it('does not steal navigation keys from focused controls', () => {
    render(<Presentation steps={typedSteps} title="Typed" />)
    screen.getByRole('button', { name: 'Step 2: Second' }).focus()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Step 2: Second' }), { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  })

  it('keeps visual styling out of kit primitives, chrome, and source', () => {
    function AllPrimitives() {
      return (
        <div>
          <Box entityId="box">Box</Box>
          <Arrow entityId="arrow" />
          <Label entityId="label">Label</Label>
          <Frame entityId="frame">Frame</Frame>
          <Emphasis entityId="emphasis">Emphasis</Emphasis>
          <SymbolChip entityId="chip" label="Chip" />
          <Appear>Appear</Appear>
        </div>
      )
    }
    const steps: readonly Step<null>[] = [{ id: 'one', era: 'Start', title: 'First', caption: 'Caption', Scene: AllPrimitives, payload: null }]
    const { container } = render(<Presentation steps={steps} title="Unstyled" />)
    const visual = /^(color|background|font|border|box-shadow|text-shadow|outline|padding|margin|gap|filter|letter-spacing)/
    for (const element of container.querySelectorAll<HTMLElement>('[style]')) {
      const properties = Array.from(element.style, (name) => name)
      expect(properties.filter((name) => visual.test(name)), element.outerHTML.slice(0, 120)).toEqual([])
    }
    for (const hook of ['box', 'arrow', 'label', 'frame', 'emphasis', 'symbol-chip']) {
      expect(container.querySelector(`[data-presentation-node="${hook}"]`), hook).not.toBeNull()
    }
    expect(container.querySelector('[data-presentation-appear]')).not.toBeNull()

    const sources: string[] = []
    const walk = (directory: string) => {
      for (const entry of readdirSync(directory)) {
        const path = join(directory, entry)
        if (statSync(path).isDirectory()) walk(path)
        else sources.push(path)
      }
    }
    walk('src/presentation-kit')
    expect(sources.filter((path) => /\.(css|scss|sass|less)$/.test(path))).toEqual([])
    for (const path of sources) {
      const text = readFileSync(path, 'utf8')
      expect(text, path).not.toMatch(/tailwind|styled-components|@emotion|\.css['"]/)
      expect(text, path).not.toMatch(/(?:color|background(?:Color)?|fontFamily|boxShadow|border(?:Color|Radius)?)\s*:/)
    }
  })
})
