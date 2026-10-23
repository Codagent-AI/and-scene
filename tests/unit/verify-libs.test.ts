import { describe, expect, it, vi } from 'vitest'
import { checkRegistration, compareOutline } from '../../scripts/lib/outline.mjs'
import { freePort, waitForReady } from '../../scripts/lib/preview.mjs'
import { specOutline } from '../helpers/spec-outline'

const outline = specOutline()

describe('compareOutline', () => {
  it('accepts the exact outline', () => {
    expect(compareOutline(structuredClone(outline), outline)).toEqual([])
  })

  it('rejects a wrong count, missing steps and extra steps', () => {
    expect(compareOutline(outline.slice(0, 8), outline)).toEqual(['expected 9 steps, found 8', 'step 9 is missing'])
    expect(compareOutline([...outline, outline[0]], outline)).toEqual(['expected 9 steps, found 10'])
    expect(compareOutline([], outline)[0]).toBe('expected 9 steps, found 0')
  })

  it('rejects out-of-order steps', () => {
    const swapped = structuredClone(outline)
    ;[swapped[2], swapped[3]] = [swapped[3], swapped[2]]
    const problems = compareOutline(swapped, outline)
    expect(problems.some((p) => p.startsWith('step 3 title'))).toBe(true)
    expect(problems.some((p) => p.startsWith('step 4 title'))).toBe(true)
  })

  it.each(['era', 'title', 'caption'] as const)('rejects a wrong %s', (field) => {
    const wrong = structuredClone(outline)
    wrong[6][field] = 'something else'
    expect(compareOutline(wrong, outline)).toHaveLength(1)
    expect(compareOutline(wrong, outline)[0]).toContain(`step 7 ${field}`)
  })

  it('rejects non-array input', () => {
    expect(compareOutline(undefined, outline)).toEqual(['steps are not an array'])
  })
})

describe('checkRegistration', () => {
  const ref = { slug: 'sample', title: 'Sample' }
  it('requires the reference to be registered with its title and a loader', () => {
    expect(checkRegistration([], ref)).toEqual(['reference presentation "sample" is not registered'])
    expect(checkRegistration([{ slug: 'other', title: 'Sample', load: () => null }], ref)).toHaveLength(1)
    expect(checkRegistration([{ slug: 'sample', title: 'Wrong', load: () => null }], ref)[0]).toContain('registered title')
    expect(checkRegistration([{ slug: 'sample', title: 'Sample' }], ref)[0]).toContain('no loader')
    expect(checkRegistration([{ slug: 'sample', title: 'Sample', load: () => null }], ref)).toEqual([])
  })
})

describe('preview helpers', () => {
  it('picks a free port and polls the IPv4 loopback probe until ready', async () => {
    expect(await freePort()).toBeGreaterThan(0)
    const urls: string[] = []
    let calls = 0
    const fetchImpl = vi.fn(async (url: string) => {
      urls.push(url)
      if (++calls < 3) throw new Error('refused')
      return { ok: true } as Response
    })
    await waitForReady('http://127.0.0.1:1234/', { fetchImpl: fetchImpl as unknown as typeof fetch })
    expect(urls).toHaveLength(3)
    expect(urls.every((u) => u.startsWith('http://127.0.0.1:'))).toBe(true)
  })

  it('gives up with a clear error', async () => {
    const fetchImpl = (async () => { throw new Error('refused') }) as unknown as typeof fetch
    await expect(waitForReady('http://127.0.0.1:1/', { timeoutMs: 300, fetchImpl })).rejects.toThrow(/did not become ready/)
  })
})
