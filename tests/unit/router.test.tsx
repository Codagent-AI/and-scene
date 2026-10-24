// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppRoot } from '../../src/AppRoot'
import { presentations } from '../../src/presentations'
import { resolveRoute, validateRegistry, type PresentationEntry } from '../../src/router'

const entry = (slug: string, title = slug, text = slug): PresentationEntry => ({
  slug,
  title: `Title of ${title}`,
  load: vi.fn(async () => ({ default: () => <p>loaded {text}</p> })),
})

const entries = [entry('alpha'), entry('beta'), entry('gamma-3')]

describe('resolveRoute', () => {
  it('maps / to the landing page', () => {
    expect(resolveRoute('/', entries)).toEqual({ kind: 'landing' })
    expect(resolveRoute('', entries)).toEqual({ kind: 'landing' })
  })

  it('resolves every registered slug, with or without a trailing slash, to its own entry', () => {
    for (const e of entries) {
      expect(resolveRoute(`/${e.slug}`, entries)).toEqual({ kind: 'presentation', entry: e })
      expect(resolveRoute(`/${e.slug}/`, entries)).toEqual({ kind: 'presentation', entry: e })
    }
  })

  it('reports unknown and nested paths as not found', () => {
    expect(resolveRoute('/missing', entries).kind).toBe('not-found')
    expect(resolveRoute('/alpha/extra', entries).kind).toBe('not-found')
  })
})

describe('validateRegistry', () => {
  it('accepts well-formed entries', () => {
    expect(validateRegistry(entries)).toEqual([])
  })

  it('rejects duplicate, non URL-safe, untitled and loader-less entries', () => {
    const bad = [
      entry('alpha'),
      entry('alpha'),
      entry('Not Safe'),
      { ...entry('beta'), title: '' },
      { ...entry('gamma'), load: undefined as never },
    ]
    const problems = validateRegistry(bad)
    expect(problems).toEqual(
      expect.arrayContaining(['duplicate slug "alpha"', 'invalid slug "Not Safe"', 'missing title for "beta"', 'missing loader for "gamma"']),
    )
  })

  it('the committed registry is valid and explicit { slug, title, load }', () => {
    expect(validateRegistry(presentations)).toEqual([])
    expect(presentations.map((p) => p.slug)).toContain('how-to-make-a-presentation')
    for (const p of presentations) expect(Object.keys(p).sort()).toEqual(['load', 'slug', 'title'])
  })
})

describe('AppRoot', () => {
  it('lists every registered presentation on the landing page', () => {
    render(<AppRoot pathname="/" entries={entries} />)
    for (const e of entries) {
      expect(screen.getByRole('link', { name: e.title })).toHaveAttribute('href', `/${e.slug}`)
    }
  })

  it.each(['/beta', '/beta/'])('lazy-loads only the matching presentation at %s, preserving the others', async (pathname) => {
    const local = [entry('alpha'), entry('beta'), entry('gamma-3')]
    render(<AppRoot pathname={pathname} entries={local} />)
    expect(await screen.findByText('loaded beta')).toBeInTheDocument()
    expect(local[1].load).toHaveBeenCalledTimes(1)
    expect(local[0].load).not.toHaveBeenCalled()
    expect(local[2].load).not.toHaveBeenCalled()
    expect(local.map((e) => e.slug)).toEqual(['alpha', 'beta', 'gamma-3'])
  })

  it('shows a not-found view with a link home for unknown paths', async () => {
    render(<AppRoot pathname="/nope" entries={entries} />)
    await waitFor(() => expect(screen.getByRole('link', { name: /back to all presentations/i })).toHaveAttribute('href', '/'))
  })
})
