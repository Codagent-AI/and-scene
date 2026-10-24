import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { collides } from '../../scripts/lib/overlap.mjs'

const repo = path.resolve(import.meta.dirname, '../..')
const box = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom })

describe('inspector overlap geometry', () => {
  it('flags line boxes that overlap by more than the tolerance', () => {
    expect(collides([box(0, 0, 100, 20)], [box(50, 10, 150, 30)])).toBe(true)
  })

  it('ignores boxes that only touch or sit within the tolerance', () => {
    expect(collides([box(0, 0, 100, 20)], [box(100, 0, 200, 20)])).toBe(false)
    expect(collides([box(0, 0, 100, 20)], [box(98, 0, 200, 20)])).toBe(false)
  })

  it('does not report a wrapped run whose union box spans another run but whose lines do not', () => {
    // "01" at the start of line 1; a wrapped era label with a fragment after it on line 1 and one on line 2.
    const number = [box(24, 10, 41.7, 26)]
    const era = [box(46.6, 10, 72.1, 26), box(24, 28, 50.5, 44)]
    expect(collides(number, era)).toBe(false)
    expect(collides(era, number)).toBe(false)
  })

  it('still reports a wrapped run when one of its lines collides', () => {
    const era = [box(46.6, 10, 72.1, 26), box(24, 28, 50.5, 44)]
    expect(collides([box(30, 30, 60, 40)], era)).toBe(true)
  })
})

describe('bootstrap template alignment', () => {
  it.each(['scripts/inspect-presentation.mjs', 'scripts/lib/overlap.mjs'])('keeps %s byte-aligned', (file) => {
    const template = path.join(repo, 'skills/presentation/templates/bootstrap', file)
    expect(readFileSync(template, 'utf8')).toBe(readFileSync(path.join(repo, file), 'utf8'))
  })
})
