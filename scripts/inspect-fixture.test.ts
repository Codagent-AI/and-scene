import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repo = resolve(process.cwd())
const capture = (cmd: string, args: string[], cwd: string) => {
  try { return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'pipe', timeout: 90000 }) }
  catch (error) { const failure = error as { stderr?: string; stdout?: string }; throw new Error(`${failure.stdout ?? ''}${failure.stderr ?? ''}`, { cause: error }) }
}

describe('project screenshot diagnostics (INT-002)', () => {
  it('captures every settled step and reports overlap, active chrome, and attribution defects', () => {
    const dir = mkdtempSync(join(tmpdir(), 'and-scene-inspect-'))
    try {
      for (const file of ['index.html', 'package.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) cpSync(join(repo, file), join(dir, file))
      cpSync(join(repo, 'src/presentation-kit'), join(dir, 'src/presentation-kit'), { recursive: true })
      cpSync(join(repo, 'src/main.tsx'), join(dir, 'src/main.tsx'))
      cpSync(join(repo, 'src/Landing.tsx'), join(dir, 'src/Landing.tsx'))
      cpSync(join(repo, 'src/index.css'), join(dir, 'src/index.css'))
      cpSync(join(repo, 'scripts/inspect-presentation.mjs'), join(dir, 'scripts/inspect-presentation.mjs'))
      mkdirSync(join(dir, 'src/presentations'), { recursive: true })
      writeFileSync(join(dir, 'src/presentations/index.ts'), "import type { ComponentType } from 'react'\nexport type PresentationRegistration = { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }\nexport const presentations: PresentationRegistration[] = [{ slug: 'fixture', title: 'Fixture', load: () => import('./fixture/Talk') }]\n")
      mkdirSync(join(dir, 'src/presentations/fixture'), { recursive: true })
      writeFileSync(join(dir, 'src/presentations/fixture/Talk.tsx'), `import { Presentation, Box } from '../../presentation-kit'
import type { Step, SceneProps } from '../../presentation-kit'
import './style.css'
function Scene({ payload }: SceneProps<number>) { return <div style={{ position: 'relative', width: 880, height: 380 }}><Box id="overlap-a" className="fixture-box" style={{ position: 'absolute', left: 80, top: 60, width: 140, height: 80 }}>UNMARKED TEXT</Box><Box id="overlap-b" className="fixture-box" style={{ position: 'absolute', left: 100, top: 70, width: 140, height: 80 }}>COLLIDING TEXT</Box><div data-presentation-allow-overlap=""><Box id="intentional" className="fixture-box" style={{ position: 'absolute', left: 110, top: 80, width: 30, height: 20 }}>INTENTIONAL</Box></div><span>{payload}</span></div> }
const steps: Step<number>[] = [0, 1].map((payload) => ({ id: String(payload), era: 'Fixture', title: 'Fixture', caption: 'Fixture', Scene, payload }))
export default function Talk() { return <Presentation steps={steps} title="Fixture" /> }
`)
      writeFileSync(join(dir, 'src/presentations/fixture/style.css'), `.fixture-box{z-index:2;border:1px solid #222;background:white;color:#222}.presentation-progress button{width:12px;height:12px;background:#aaa;border:0}.presentation-attribution{font-size:8px!important;color:blue!important;text-decoration:underline!important}`)
      symlinkSync(join(repo, 'node_modules'), join(dir, 'node_modules'), 'dir')
      capture('npm', ['run', 'build'], dir)
      const inspection = spawnSync(process.execPath, [join(dir, 'scripts/inspect-presentation.mjs'), 'fixture'], { cwd: dir, encoding: 'utf8', timeout: 90000 })
      const output = `${inspection.stdout ?? ''}${inspection.stderr ?? ''}`
      expect(inspection.status).toBe(0)
      expect(output).toContain('Captured 2 settled screenshots')
      expect(output).toMatch(/WARN step 1: possible text\/chrome overlap: .*UNMARKED TEXT/)
      expect(output).not.toContain('INTENTIONAL')
      expect(output).toContain('active progress state may be visually indistinct')
      expect(output).toContain('style [data-presentation-attribution]')
      expect(existsSync(join(dir, 'artifacts/presentations/fixture/step-01.png'))).toBe(true)
      expect(existsSync(join(dir, 'artifacts/presentations/fixture/step-02.png'))).toBe(true)
      expect(readFileSync(join(dir, 'src/presentations/index.ts'), 'utf8')).toContain("slug: 'fixture'")
    } finally { rmSync(dir, { recursive: true, force: true }) }
  }, 120000)
})
