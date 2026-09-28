import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { PresentationEntry } from './presentations'
import { resolveRoute } from './resolveRoute'
import { Router } from './router'

afterEach(cleanup)

const registry: PresentationEntry[] = [
  { slug: 'demo', title: 'Demo Talk', load: async () => ({ default: () => <div data-testid="demo">demo</div> }) },
]

describe('router', () => {
  it('resolves landing and registered routes', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/nope', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/demo/', registry)).toEqual({ kind: 'presentation', entry: registry[0] })
  })

  it('landing enumerates the registry', () => {
    render(<Router pathname="/" registry={registry} />)
    expect(screen.getByText('Demo Talk').getAttribute('href')).toBe('/demo')
  })

  it('lazy-loads a registered presentation', async () => {
    render(<Router pathname="/demo" registry={registry} />)
    expect(await screen.findByTestId('demo')).toBeTruthy()
  })
})
