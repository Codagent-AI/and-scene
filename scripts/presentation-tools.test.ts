import { describe, expect, it } from 'vitest'
import { attributionWarnings, findOverlaps, overlaps, stylesIndistinguishable } from './inspection-lib.mjs'
import { expectedSteps, parseArgs, validateSample } from './verification-lib.mjs'
import { parseInspectArgs } from './inspect-presentation.mjs'
import { mkdtemp, cp, rm, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

describe('verification metadata and arguments', () => {
  it('checks the registered canonical sample and ordered metadata', async () => {
    expect(await validateSample(process.cwd())).toBe(9)
    expect(expectedSteps).toHaveLength(9)
  })
  it('rejects missing, malformed, and out-of-order sample metadata', async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'and-scene-'))
    try {
      await cp('src/presentations', path.join(temp, 'src/presentations'), { recursive: true })
      const registry = await readFile('src/presentations/index.ts', 'utf8')
      await writeFile(path.join(temp, 'src/presentations/index.ts'), registry)
      const outlinePath = path.join(temp, 'src/presentations/how-to-make-a-presentation/steps/outline.mjs')
      await writeFile(outlinePath, 'export const outline = []')
      await expect(validateSample(temp)).rejects.toThrow(/expected 9/)
      await writeFile(outlinePath, `export const outline = ${JSON.stringify([...expectedSteps].reverse().map(([era,title,caption])=>({era,title,caption})))}`)
      await expect(validateSample(temp)).rejects.toThrow(/step 1/)
      await rm(outlinePath)
      await expect(validateSample(temp)).rejects.toThrow(/missing or malformed/)
    } finally { await rm(temp, { recursive: true, force: true }) }
  })
  it('parses repository and slug overrides', () => {
    expect(parseArgs(['--root', '/tmp/project', '--slug', 'demo', '--port', '4178'])).toMatchObject({ root: '/tmp/project', slug: 'demo', port: 4178 })
  })
  it('parses inspection viewport and settle options', () => {
    expect(parseInspectArgs(['demo', '--narrow', '--settle', '120'])).toMatchObject({ slug: 'demo', narrow: true, settle: 120 })
    expect(() => parseInspectArgs([])).toThrow(/usage/)
  })
})

describe('visual diagnostics', () => {
  const item = (label: string, left: number, allowed = false) => ({ label, text: label, allowed, rect: { left, right: left + 20, top: 0, bottom: 20 } })
  it('finds geometric collisions and exempts explicitly allowed subtrees', () => {
    expect(overlaps(item('a', 0).rect, item('b', 10).rect)).toBe(true)
    expect(findOverlaps([item('a', 0), item('b', 10)])).toHaveLength(1)
    expect(findOverlaps([item('a', 0, true), item('b', 10)])).toHaveLength(0)
  })
  it('compares active navigation styles and flags attribution defects', () => {
    const style = { color: 'red', backgroundColor: 'white', borderColor: 'black', fontWeight: '400', opacity: '1', textDecorationLine: 'none' }
    expect(stylesIndistinguishable(style, { ...style })).toBe(true)
    expect(stylesIndistinguishable(style, { ...style, backgroundColor: 'blue' })).toBe(false)
    expect(attributionWarnings(null)[0]).toMatch(/attribution link is missing/)
    expect(attributionWarnings({ fontSize: 10, defaultLike: true })).toHaveLength(2)
    expect(attributionWarnings({ fontSize: 13, defaultLike: false })).toEqual([])
  })
})
