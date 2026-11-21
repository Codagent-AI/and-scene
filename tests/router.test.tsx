// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Router from '../src/Router'
import { createRoutes } from '../src/routes'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

function fixture() {
  const alpha = vi.fn(async () => ({ default: () => <h1>First scene</h1> }))
  const beta = vi.fn(async () => ({ default: () => <h1>Second scene</h1> }))
  const routes = createRoutes([
    { slug: 'first', title: 'First presentation', load: alpha },
    { slug: 'second', title: 'Second presentation', load: beta },
  ])

  return { alpha, beta, routes }
}

describe('presentation pathname routing', () => {
  it.each(['/', '/unregistered', '/first/extra'])('lists both landing links at %s without loading either scene', async (pathname) => {
    const { alpha, beta, routes } = fixture()

    await act(async () => root.render(<Router pathname={pathname} routes={routes} />))

    expect([...container.querySelectorAll('a')].map((link) => [
      link.getAttribute('href'),
      link.querySelector('span')?.textContent,
    ])).toEqual([
      ['/first', 'First presentation'],
      ['/second', 'Second presentation'],
    ])
    expect(alpha).not.toHaveBeenCalled()
    expect(beta).not.toHaveBeenCalled()
  })

  it('loads only the matching registry entry and keeps both routes reachable', async () => {
    const { alpha, beta, routes } = fixture()
    expect(alpha).not.toHaveBeenCalled()
    expect(beta).not.toHaveBeenCalled()

    await act(async () => root.render(<Router pathname="/second/" routes={routes} />))
    expect(container.querySelector('h1')?.textContent).toBe('Second scene')
    expect(alpha).not.toHaveBeenCalled()
    expect(beta).toHaveBeenCalledOnce()

    await act(async () => root.render(<Router pathname="/first" routes={routes} />))
    expect(container.querySelector('h1')?.textContent).toBe('First scene')
    expect(alpha).toHaveBeenCalledOnce()
    expect(beta).toHaveBeenCalledOnce()
  })
})
