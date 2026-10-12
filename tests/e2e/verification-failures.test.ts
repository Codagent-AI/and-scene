import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, symlinkSync, writeFileSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = process.cwd()
function copyRepository() {
  const target = mkdtempSync(path.join(os.tmpdir(), 'and-scene-fault-'))
  cpSync(source, target, { recursive: true, filter: name => !name.includes(`${path.sep}node_modules`) && !name.includes(`${path.sep}dist`) && !name.includes(`${path.sep}.git`) && !name.includes(`${path.sep}.inspection`) })
  symlinkSync(path.join(source, 'node_modules'), path.join(target, 'node_modules'), 'dir')
  for (const config of ['tsconfig.app.json', 'tsconfig.node.json']) {
    const configPath = path.join(target, config)
    writeFileSync(configPath, readFileSync(configPath, 'utf8').replace('./node_modules/.tmp/', './.tsbuildinfo/'))
  }
  return target
}
function replace(file: string, from: string, to: string) {
  const target = path.join(file, '')
  const content = readFileSync(target, 'utf8')
  if (!content.includes(from)) throw new Error(`fault injection anchor not found in ${target}`)
  writeFileSync(target, content.replace(from, to))
}
function verify(root: string) {
  return spawnSync('npm', ['run', 'verify'], { cwd: root, encoding: 'utf8', timeout: 180_000 })
}

describe('E2E-002 actionable verification failures', () => {
  it('names build, sample, runtime, and transition failures without passing', async () => {
    const cases: Array<{ name: string; file: string; from: string; to: string; phase: string; step?: number }> = [
      { name: 'build', file: 'src/Landing.tsx', from: 'export default function Landing()', to: 'export default function Landing( BROKEN', phase: 'build' },
      { name: 'missing sample', file: 'src/presentations/index.ts', from: "export const presentations: PresentationEntry[] = [", to: "export const presentations: PresentationEntry[] = [ // removed sample", phase: 'sample' },
      { name: 'altered outline', file: 'src/presentations/how-to-make-a-presentation/steps/outline.ts', from: 'You have a topic', to: 'Altered topic', phase: 'sample' },
      { name: 'runtime console error', file: 'src/main.tsx', from: "import './index.css'", to: "import './index.css'\nconsole.error('injected runtime failure')", phase: 'render', step: 0 },
      { name: 'stalled transition', file: 'src/presentation-kit/usePresentationNav.ts', from: 'const next = useCallback(() => goTo(index + 1), [goTo, index])', to: 'const next = useCallback(() => {}, [])', phase: 'render', step: 1 },
    ]
    for (const fault of cases) {
      const root = copyRepository()
      try {
        if (fault.name === 'missing sample') writeFileSync(path.join(root, fault.file), "import type { ComponentType } from 'react'\nexport type PresentationEntry = { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }\nexport const presentations: PresentationEntry[] = []\n")
        else replace(path.join(root, fault.file), fault.from, fault.to)
        const result = verify(root)
        const output = `${result.stdout}\n${result.stderr}`
        expect(result.status, fault.name).not.toBe(0)
        expect(output, fault.name).toContain(`[FAIL] ${fault.phase}`)
        if (fault.step !== undefined) expect(output, fault.name).toContain(`step ${fault.step}`)
        expect(output, fault.name).not.toContain('PASS:')
        const previewUrl = output.match(/preview host=(http:\/\/127\.0\.0\.1:\d+)/)?.[1]
        if (previewUrl) {
          const listening = await fetch(previewUrl, { signal: AbortSignal.timeout(500) }).then(() => true, () => false)
          expect(listening, `${fault.name} preview cleanup`).toBe(false)
        }
      } finally { rmSync(root, { recursive: true, force: true }) }
    }
  }, 900_000)
})
