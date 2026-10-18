import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderTemplate } from '../../skills/presentation/scripts/new-presentation.mjs'
import { BOOTSTRAP, listFiles, ROOT } from './helpers'

const PAIRS = [
  ['scene kit', 'src/presentation-kit'],
  ['verification and inspection scripts', 'scripts'],
] as const

describe.each(PAIRS)('%s stays byte-aligned with its bootstrap copy', (_name, rel) => {
  const canonical = path.join(ROOT, rel)
  const template = path.join(BOOTSTRAP, rel)
  const canonicalFiles = listFiles(canonical, { skipTests: true })
  const templateFiles = listFiles(template, { skipTests: true })

  it('has the same files in both directions', () => {
    expect(templateFiles).toEqual(canonicalFiles)
    expect(canonicalFiles.length).toBeGreaterThan(0)
  })

  it.each(canonicalFiles)('%s is identical', (file) => {
    expect(fs.readFileSync(path.join(template, file)).equals(fs.readFileSync(path.join(canonical, file)))).toBe(true)
  })
})

describe('bootstrap example presentation', () => {
  it('is the rendered presentation template', () => {
    const tpl = path.join(ROOT, 'skills/presentation/templates/presentation')
    const example = path.join(BOOTSTRAP, 'src/presentations/example')
    expect(listFiles(example)).toEqual(listFiles(tpl))
    for (const f of listFiles(tpl)) {
      const expected = renderTemplate(fs.readFileSync(path.join(tpl, f), 'utf8'), { slug: 'example', title: 'Example presentation' })
      expect(fs.readFileSync(path.join(example, f), 'utf8'), f).toBe(expected)
    }
  })
})
