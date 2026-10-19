import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { expectations } from '../../scripts/verify.expectations.mjs'
import { checkSample } from '../../scripts/lib/sample-check.mjs'
import { HOST, readRegistry, run } from '../../scripts/lib/preview.mjs'

const [sample] = expectations

describe('sample checks', () => {
  const registry = [{ slug: sample.slug, title: sample.title }]

  it('accepts the registered canonical sample', () => {
    expect(checkSample.registered(sample, registry)).toBeNull()
    expect(checkSample.count(sample, 9)).toBeNull()
    sample.steps.forEach((step, i) => expect(checkSample.step(sample, i, step)).toBeNull())
  })

  it('fails a missing or retitled sample', () => {
    expect(checkSample.registered(sample, [])).toMatch(/not registered/)
    expect(checkSample.registered(sample, [{ slug: sample.slug, title: 'Other' }])).toMatch(/does not match/)
  })

  it('fails a wrong step count', () => {
    expect(checkSample.count(sample, 8)).toMatch(/expected 9 steps/)
    expect(checkSample.count(sample, 10)).toMatch(/expected 9 steps/)
  })

  it.each(['era', 'title', 'caption'] as const)('fails a wrong or out-of-order %s', (field) => {
    const wrong = { ...sample.steps[1], [field]: 'nope' }
    expect(checkSample.step(sample, 1, wrong)).toMatch(new RegExp(`${field} is "nope"`))
    expect(checkSample.step(sample, 0, sample.steps[1])).not.toBeNull() // swapped order
  })

  it('has nine expectation rows matching the approved definition table', () => {
    const spec = readFileSync('openspec/changes/create-and-scene/specs/presentation-verification/spec.md', 'utf8')
    const rows = [...spec.matchAll(/^\| \d \| ([^|]+?) \| "(.+?)" \| (.+?) \| .+ \|$/gm)]
    expect(sample.steps).toEqual(rows.map((r) => ({ era: r[1], title: r[2], caption: r[3] })))
  })
})

describe('preview helpers', () => {
  const dirs: string[] = []
  afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })))

  it('uses the IPv4 loopback address', () => {
    expect(HOST).toBe('127.0.0.1')
  })

  it('reads registered slugs and titles from the registry source', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'reg-'))
    dirs.push(dir)
    mkdirSync(path.join(dir, 'src/presentations'), { recursive: true })
    writeFileSync(
      path.join(dir, 'src/presentations/index.ts'),
      `export const presentations = [
  { slug: 'one', title: 'First "one"', load: () => import('./one/Talk') },
  { slug: "two-x", title: "Second's", load: () => import('./two/Talk') },
]`,
    )
    // titles with the other quote kind inside are out of scope; plain titles are read exactly
    expect(readRegistry(dir).map((e: { slug: string }) => e.slug)).toEqual(['one', 'two-x'])
  })

  it('reads entries whatever their property order, quoting or nesting', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'reg-'))
    dirs.push(dir)
    mkdirSync(path.join(dir, 'src/presentations'), { recursive: true })
    writeFileSync(
      path.join(dir, 'src/presentations/index.ts'),
      `import type { ComponentType } from 'react'
export const presentations: readonly PresentationEntry[] = [
  { title: 'Reordered', slug: 'reordered', load: () => import('./a/Talk') },
  {
    load: () => import('./b/Talk').then((m) => ({ default: m.Named })),
    title: "It's quoted",
    slug: "second",
  },
  { slug: 'third', load: () => import('./c/Talk'), title: 'Third' },
]
export const other = [{ slug: 'ignored', title: 'Ignored' }]`,
    )
    expect(readRegistry(dir)).toEqual([
      { slug: 'reordered', title: 'Reordered' },
      { slug: 'second', title: "It's quoted" },
      { slug: 'third', title: 'Third' },
    ])
  })

  it('reads the real registry', () => {
    expect(readRegistry('.')).toEqual([{ slug: sample.slug, title: sample.title }])
  })

  it('captures output and exit code of subprocesses', async () => {
    expect((await run(process.execPath, ['-e', 'console.log("hi")'])).output).toContain('hi')
    expect((await run(process.execPath, ['-e', 'process.exit(3)'])).code).toBe(3)
    expect((await run('definitely-not-a-command-xyz', [])).code).toBe(1)
  })
})

describe('verification scripts address only 127.0.0.1', () => {
  it.each(['scripts/verify.mjs', 'scripts/lib/preview.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/inspect-run.mjs'])(
    '%s never uses localhost',
    (file) => {
      const source = readFileSync(file, 'utf8')
      expect(source).not.toMatch(/localhost|\[::1\]|0\.0\.0\.0/)
    },
  )

  it('builds preview host, probe and browser URLs from HOST', () => {
    const preview = readFileSync('scripts/lib/preview.mjs', 'utf8')
    expect(preview).toMatch(/'--host', HOST/)
    expect(preview).toMatch(/const base = `http:\/\/\$\{HOST\}:\$\{port\}`/)
    expect(preview).toMatch(/fetch\(`\$\{base\}\/`\)/)
    expect(readFileSync('scripts/verify.mjs', 'utf8')).toMatch(/http:\/\/\$\{HOST\}:/)
  })
})
