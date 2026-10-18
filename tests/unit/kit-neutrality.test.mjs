import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanKitForStyling } from '../helpers/kit-scan.mjs'

const root = path.resolve(import.meta.dirname, '../..')

describe('style-neutral kit', () => {
  it('declares no visual defaults, stylesheets, tokens or framework references', () => {
    expect(scanKitForStyling(path.join(root, 'src/presentation-kit'))).toEqual([])
  })

  it('the scan really catches violations', async () => {
    const { mkdtempSync, writeFileSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const dir = mkdtempSync(path.join(tmpdir(), 'kit-scan-'))
    writeFileSync(path.join(dir, 'a.tsx'), "export const s = { color: 'red', boxShadow: '0 0 1px #000' }\n")
    const problems = scanKitForStyling(dir)
    expect(problems.join('\n')).toMatch(/color/)
    expect(problems.join('\n')).toMatch(/boxShadow/)
    expect(problems.join('\n')).toMatch(/color literal/)
  })

  it('adds no required styling framework to the app dependencies', () => {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(names.filter((n) => /tailwind|styled|emotion|stitches/i.test(n))).toEqual([])
  })
})
