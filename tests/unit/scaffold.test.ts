import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { detectTarget } from '../../skills/presentation/scripts/detect-target.mjs'
import { BOOTSTRAP, scaffold } from '../../skills/presentation/scripts/scaffold.mjs'

const dirs: string[] = []
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), 'scaffold-'))
  dirs.push(d)
  return d
}
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })))

const read = (dir: string, file: string) => readFileSync(join(dir, file), 'utf8')

describe('scaffold', () => {
  it('does nothing when no anchor is missing', () => {
    const dir = tmp()
    expect(scaffold(dir, [])).toMatchObject({ copied: [], skipped: [] })
    expect(existsSync(join(dir, 'package.json'))).toBe(false)
  })

  it('scaffolds an empty directory into a complete app', () => {
    const dir = tmp()
    const report = scaffold(dir, detectTarget(dir).missing)
    expect(report.copied).toContain('package.json')
    expect(detectTarget(dir)).toMatchObject({ scaffold: 'none', anchors: { build: true, kit: true, index: true } })
    expect(read(dir, 'src/main.tsx')).toBe(readFileSync(join(BOOTSTRAP, 'src/main.tsx'), 'utf8'))
  })

  it('adds only the missing anchors of a partial app, merging dependencies without disturbing existing files', () => {
    const dir = tmp()
    // A host with its own build setup, its own scene-kit-less src, and an unrelated main.tsx.
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name: 'host',
        scripts: { build: 'my-build', lint: 'my-lint' },
        dependencies: { react: '^18.0.0' },
        devDependencies: { vite: '^5.0.0', typescript: '^5.0.0' },
      }),
    )
    writeFileSync(join(dir, 'vite.config.ts'), '// host config')
    writeFileSync(join(dir, 'tsconfig.json'), '{ "host": true }')
    mkdirSync(join(dir, 'src'), { recursive: true })
    writeFileSync(join(dir, 'src/main.tsx'), "console.log('host app')")
    cpSync(join(BOOTSTRAP, 'src/presentation-kit'), join(dir, 'src/presentation-kit'), { recursive: true })
    writeFileSync(join(dir, 'src/presentation-kit/Stage.tsx'), 'export function Stage() { return "customised" }')

    const before = detectTarget(dir)
    expect(before.missing).toEqual(['index'])
    const report = scaffold(dir, before.missing)

    // Index anchor installed; everything that existed is untouched.
    expect(detectTarget(dir).scaffold).toBe('none')
    expect(report.copied).toEqual(expect.arrayContaining(['src/presentations/index.ts', 'src/router.ts', 'src/Landing.tsx']))
    expect(read(dir, 'vite.config.ts')).toBe('// host config')
    expect(read(dir, 'tsconfig.json')).toBe('{ "host": true }')
    expect(read(dir, 'src/main.tsx')).toBe("console.log('host app')")
    expect(read(dir, 'src/presentation-kit/Stage.tsx')).toContain('customised')

    // Dependencies and scripts the infrastructure needs are declared, existing ones kept.
    const pkg = JSON.parse(read(dir, 'package.json'))
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.devDependencies.vite).toBe('^5.0.0')
    expect(pkg.scripts.build).toBe('my-build')
    expect(pkg.type).toBeUndefined()
    expect(pkg.dependencies).toHaveProperty('motion')
    expect(pkg.dependencies).toHaveProperty('lucide-react')
    expect(pkg.devDependencies).toHaveProperty('playwright')
    expect(pkg.scripts).toMatchObject({ verify: expect.any(String), inspect: expect.any(String) })
    expect(report.addedDependencies).toEqual(expect.arrayContaining(['motion', 'lucide-react', 'playwright', 'react-dom']))

    // The unrelated entry point cannot be rewritten safely: it is reported for a scoped edit.
    expect(report.wiring).toEqual([expect.stringContaining('src/main.tsx'), expect.stringContaining('"type"')])
    expect(existsSync(join(dir, 'scripts/verify.mjs'))).toBe(true)
  })

  it('does not request wiring when main.tsx already routes through the registry', () => {
    const dir = tmp()
    scaffold(dir, detectTarget(dir).missing)
    rmSync(join(dir, 'src/presentations/index.ts'))
    const report = scaffold(dir, ['index'])
    expect(report.wiring).toEqual([])
  })

  it('never overwrites existing kit files when re-adding the kit', () => {
    const dir = tmp()
    scaffold(dir, detectTarget(dir).missing)
    writeFileSync(join(dir, 'src/presentation-kit/constants.ts'), '// mine')
    const report = scaffold(dir, ['kit'])
    expect(read(dir, 'src/presentation-kit/constants.ts')).toBe('// mine')
    expect(report.skipped).toContain(join('src/presentation-kit', 'constants.ts'))
  })
})
