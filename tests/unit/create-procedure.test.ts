// @vitest-environment node
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { parseRegistrySlugs } from '../../scripts/lib/registry.mjs'

const ROOT = join(__dirname, '../..')
const dirs: string[] = []
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

const snapshot = (dir: string, base = dir): Record<string, string> =>
  Object.fromEntries(
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n)
      return statSync(p).isDirectory() ? Object.entries(snapshot(p, base)) : [[relative(base, p), readFileSync(p, 'utf8')]]
    }),
  )

describe('the documented create procedure (copy the presentation template, add one registry line)', () => {
  it('adds a self-contained folder and one registry entry without touching existing presentations', () => {
    const app = mkdtempSync(join(tmpdir(), 'and-scene-create-'))
    dirs.push(app)
    cpSync(join(ROOT, 'src/presentations'), join(app, 'src/presentations'), { recursive: true })
    const before = snapshot(join(app, 'src/presentations/how-to-make-a-presentation'))
    const indexBefore = readFileSync(join(app, 'src/presentations/index.ts'), 'utf8')

    cpSync(join(ROOT, 'skills/presentation/templates/presentation'), join(app, 'src/presentations/second'), { recursive: true })
    writeFileSync(
      join(app, 'src/presentations/index.ts'),
      indexBefore.replace(/\n\]\n$/, "\n  { slug: 'second', title: 'Second', load: () => import('./second/Talk') },\n]\n"),
    )

    const indexAfter = readFileSync(join(app, 'src/presentations/index.ts'), 'utf8')
    expect(parseRegistrySlugs(indexAfter)).toEqual(['how-to-make-a-presentation', 'second'])
    expect(indexAfter.startsWith(indexBefore.replace(/\n\]\n$/, ''))).toBe(true)
    expect(snapshot(join(app, 'src/presentations/how-to-make-a-presentation'))).toEqual(before)
    const created = Object.keys(snapshot(join(app, 'src/presentations/second')))
    expect(created).toEqual(expect.arrayContaining(['entities.ts', 'Scene.tsx', 'Talk.tsx', 'presentation.css', 'steps/index.ts']))
  })

  it('every template path the skill names exists', () => {
    const t = join(ROOT, 'skills/presentation/templates')
    for (const rel of [
      'bootstrap/package.json', 'bootstrap/package-lock.json', 'bootstrap/index.html', 'bootstrap/vite.config.ts', 'bootstrap/tsconfig.json',
      'bootstrap/tsconfig.app.json', 'bootstrap/tsconfig.node.json', 'bootstrap/eslint.config.js', 'bootstrap/src/main.tsx',
      'bootstrap/src/index.css', 'bootstrap/public/favicon.svg', 'bootstrap/.gitignore', 'bootstrap/src/presentation-kit/Presentation.tsx',
      'bootstrap/src/presentations/index.ts', 'bootstrap/src/presentations/types.ts', 'bootstrap/src/Router.tsx',
      'bootstrap/src/resolveSlug.ts', 'bootstrap/src/Landing.tsx', 'bootstrap/scripts/verify.mjs',
      'bootstrap/scripts/inspect-presentation.mjs', 'bootstrap/scripts/lib/preview.mjs',
      'presentation/entities.ts', 'presentation/Scene.tsx', 'presentation/steps/index.ts', 'presentation/Talk.tsx', 'presentation/presentation.css',
    ]) {
      expect(statSync(join(t, rel)).isFile(), rel).toBe(true)
    }
  })
})
