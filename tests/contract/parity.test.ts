import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ROOT, TEMPLATE, nonTestFiles } from '../helpers/repo.ts'

const bytes = (path: string) => readFileSync(path)

describe('template parity', () => {
  const kit = 'src/presentation-kit'

  it('has the same non-test kit file inventory as the bootstrap template', () => {
    const canonical = nonTestFiles(join(ROOT, kit))
    expect(canonical.length).toBeGreaterThan(10)
    expect(nonTestFiles(join(TEMPLATE, kit))).toEqual(canonical)
  })

  it('keeps every non-test kit file byte-identical to its template copy', () => {
    for (const file of nonTestFiles(join(ROOT, kit))) {
      expect(bytes(join(TEMPLATE, kit, file)).equals(bytes(join(ROOT, kit, file))), file).toBe(true)
    }
  })

  it('ships no test files in the template kit', () => {
    expect(nonTestFiles(join(TEMPLATE, kit))).toEqual(
      nonTestFiles(join(TEMPLATE, kit)).filter((f) => !/\.test\./.test(f)),
    )
  })

  it.each(['verify.mjs', 'inspect-presentation.mjs', 'lib/preview.mjs'])('keeps scripts/%s byte-identical with no exceptions', (file) => {
    expect(bytes(join(TEMPLATE, 'scripts', file)).equals(bytes(join(ROOT, 'scripts', file)))).toBe(true)
  })

  it.each(['tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'src/main.tsx', 'src/AppRouter.tsx', 'src/router.ts', 'src/Landing.tsx'])(
    'keeps shared app file %s aligned',
    (file) => {
      expect(bytes(join(TEMPLATE, file)).equals(bytes(join(ROOT, file)))).toBe(true)
    },
  )

  it('differs only in outline data: the verify data file is not part of the parity set', () => {
    const rootData = JSON.parse(readFileSync(join(ROOT, 'scripts/verify.config.json'), 'utf8'))
    const templateData = JSON.parse(readFileSync(join(TEMPLATE, 'scripts/verify.config.json'), 'utf8'))
    expect(templateData.slug).not.toBe(rootData.slug)
    expect(rootData.steps).toHaveLength(9)
  })
})
