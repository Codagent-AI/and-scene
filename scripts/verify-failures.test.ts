import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repo = resolve(process.cwd())
const sourceFiles = ['index.html', 'package.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']

describe('production verifier failure contract (E2E-002)', () => {
  it('fails isolated build, sample, browser, and transition faults with actionable phases', () => {
    const cases = [
      { name: 'build', expected: 'BUILD failed', mutate: failBuild },
      { name: 'sample', expected: 'SAMPLE failed', mutate: (dir: string) => edit(dir, 'src/presentations/index.ts', "slug: 'how-to-make-a-presentation'", "slug: 'missing-sample'") },
      { name: 'browser', expected: 'RENDER failed at step 1', mutate: (dir: string) => edit(dir, 'src/presentations/how-to-make-a-presentation/Scene.tsx', 'const n = payload.index', 'if (payload.index === 0) throw new Error("injected browser error")\n  const n = payload.index') },
      { name: 'transition', expected: 'TRANSITION failed after step 1', mutate: (dir: string) => edit(dir, 'src/presentation-kit/usePresentationNav.ts', 'Math.min(lastIndex, value + 1)', 'Math.min(lastIndex, value)') },
    ]
    const temps: string[] = []
    try {
      for (const item of cases) {
        const dir = mkdtempSync(join(tmpdir(), `and-scene-${item.name}-`))
        temps.push(dir)
        for (const file of sourceFiles) cpSync(join(repo, file), join(dir, file))
        cpSync(join(repo, 'src'), join(dir, 'src'), { recursive: true })
        cpSync(join(repo, 'scripts/verify.mjs'), join(dir, 'scripts/verify.mjs'), { recursive: true })
        symlinkSync(join(repo, 'node_modules'), join(dir, 'node_modules'), 'dir')
        item.mutate(dir)
        let output = ''
        try { output = execFileSync(process.execPath, [join(dir, 'scripts/verify.mjs')], { cwd: tmpdir(), encoding: 'utf8', stdio: 'pipe', timeout: 120000 }) }
        catch (error) {
          const failure = error as { stdout?: string; stderr?: string }
          output = `${failure.stdout ?? ''}${failure.stderr ?? ''}`
        }
        expect(output, item.name).toContain(item.expected)
        expect(output, item.name).toContain('FAIL:')
      }
      expect(readFileSync(join(repo, 'src/presentations/index.ts'), 'utf8')).toContain("slug: 'how-to-make-a-presentation'")
    } finally {
      for (const dir of temps) rmSync(dir, { recursive: true, force: true })
    }
  }, 480000)
})

function edit(dir: string, file: string, before: string, after: string) {
  const path = join(dir, file)
  const source = readFileSync(path, 'utf8')
  if (!source.includes(before)) throw new Error(`Fixture edit target not found: ${file}`)
  writeFileSync(path, source.replace(before, after))
}

function failBuild(dir: string) {
  const path = join(dir, 'package.json')
  const pkg = JSON.parse(readFileSync(path, 'utf8')) as { scripts: Record<string, string> }
  pkg.scripts.build = 'node -e "process.exit(1)"'
  writeFileSync(path, JSON.stringify(pkg, null, 2))
}
