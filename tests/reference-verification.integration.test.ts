import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const projectFiles = ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'src', 'scripts']

async function verificationCopy(name: string, mutate: (project: string) => Promise<void>) {
  const temp = await mkdtemp(join(tmpdir(), `and-scene-${name}-`))
  const project = join(temp, 'project')
  await mkdir(project)
  try {
    for (const file of projectFiles) await cp(join(root, file), join(project, file), { recursive: true })
    await symlink(join(root, 'node_modules'), join(project, 'node_modules'), 'dir')
    await mutate(project)
    let output = ''
    let status = 0
    try { output = execFileSync('npm', ['run', 'verify'], { cwd: project, encoding: 'utf8', timeout: 60_000, stdio: ['ignore', 'pipe', 'pipe'] }) }
    catch (error) { status = error.status ?? 1; output = `${error.stdout ?? ''}${error.stderr ?? ''}` }
    return { status, output }
  } finally { await rm(temp, { recursive: true, force: true }) }
}

describe('reference verification failure contract (E2E-002)', () => {
  it('reports isolated build, sample, browser-runtime, and transition faults as failures', async () => {
    const cases: Array<{ name: string; file: string; change: (text: string) => string; message: RegExp }> = [
      { name: 'build-fault', file: 'src/presentations/how-to-make-a-presentation/Talk.tsx', change: (text) => `${text}\nconst = ;\n`, message: /BUILD FAILED/ },
      { name: 'sample-fault', file: 'src/presentations/how-to-make-a-presentation/Talk.tsx', change: (text) => text.replace('The deck grows', 'The deck gets bigger'), message: /SAMPLE CHECK FAILED.*The deck grows/ },
      { name: 'runtime-fault', file: 'src/presentations/how-to-make-a-presentation/steps/ReferenceScene.tsx', change: (text) => text.replace('export function ReferenceScene({ index }: SceneProps<undefined>) {', "export function ReferenceScene({ index }: SceneProps<undefined>) {\n  if (index === 1) throw new Error('injected render fault')"), message: /BROWSER ERROR at step 2|TRANSITION FAILED at step 2/ },
      { name: 'transition-fault', file: 'src/presentation-kit/usePresentationNav.ts', change: (text) => text.replace('goTo(safeIndex + 1)', 'goTo(safeIndex)'), message: /TRANSITION FAILED at step 2/ },
    ]
    for (const testCase of cases) {
      const result = await verificationCopy(testCase.name, async (project) => {
        const file = join(project, testCase.file)
        const before = await readFile(file, 'utf8')
        const after = testCase.change(before)
        expect(after).not.toBe(before)
        await writeFile(file, after)
      })
      expect(result.status, testCase.name).not.toBe(0)
      expect(result.output, testCase.name).toMatch(testCase.message)
    }
  }, 180_000)

  it('captures settled fixture steps and diagnoses collisions, active chrome, and attribution (INT-002)', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'and-scene-inspection-'))
    const project = join(temp, 'project')
    await mkdir(project)
    try {
      for (const file of projectFiles) await cp(join(root, file), join(project, file), { recursive: true })
      await symlink(join(root, 'node_modules'), join(project, 'node_modules'), 'dir')
      const sample = join(project, 'src/presentations/diagnostic-fixture')
      await mkdir(sample, { recursive: true })
      await writeFile(join(sample, 'Talk.tsx'), `import { Presentation, SceneLayer } from '../../presentation-kit';\nimport type { SceneProps, Step } from '../../presentation-kit';\nimport './fixture.css';\nfunction Scene(_props: SceneProps<undefined>) { return <SceneLayer><span className="collision-a">COLLISION A</span><span className="collision-b">COLLISION B</span><div data-presentation-allow-overlap="" className="intentional"><span>INTENTIONAL A</span><span>INTENTIONAL B</span></div></SceneLayer> }\nconst steps: Step<undefined>[] = [{id:'one',section:'First',title:'First',caption:'Fixture first',Scene,payload:undefined},{id:'two',section:'Second',title:'Second',caption:'Fixture second',Scene,payload:undefined}];\nexport default function Talk(){return <Presentation steps={steps} title="Diagnostics fixture" className="fixture"/>}\n`)
      await writeFile(join(sample, 'fixture.css'), `.fixture [data-presentation-progress-item],.fixture [data-presentation-toc-item]{color:rgb(20,20,20)!important;background:rgb(200,200,200)!important;border:1px solid rgb(100,100,100)!important;font-weight:400!important}.fixture [data-presentation-active="true"]{color:rgb(20,20,20)!important;background:rgb(200,200,200)!important;border-color:rgb(100,100,100)!important;font-weight:400!important}.fixture [data-presentation-attribution]{font-size:9px!important;color:rgb(0,0,238)!important;text-decoration:underline!important}.fixture .collision-a,.fixture .collision-b{position:absolute;left:120px;top:80px;width:100px;height:40px}.fixture .intentional{position:absolute;left:260px;top:80px}.fixture .intentional span{position:absolute;left:0;top:0;width:100px;height:40px}.fixture .intentional span+span{left:10px}`)
      const registry = join(project, 'src/presentations/index.ts')
      await writeFile(registry, `import type React from 'react';\nexport interface PresentationEntry { slug:string; title:string; load:()=>Promise<{default:React.ComponentType}> }\nexport const presentations: PresentationEntry[] = [{slug:'diagnostic-fixture',title:'Diagnostics fixture',load:()=>import('./diagnostic-fixture/Talk')}];\n`)
      execFileSync('npm', ['run', 'build'], { cwd: project, stdio: 'pipe', timeout: 60_000 })
      const inspection = spawnSync('npm', ['run', 'inspect', '--', 'diagnostic-fixture'], { cwd: project, encoding: 'utf8', timeout: 40_000, env: { ...process.env, INSPECT_SETTLE_MS: '800' } })
      const output = `${inspection.stdout}${inspection.stderr}`
      expect(inspection.status).toBe(0)
      expect(output).toMatch(/possible text\/chrome overlap/)
      expect(output).toMatch(/active progress state looks indistinguishable/)
      expect(output).toMatch(/active table-of-contents state looks indistinguishable/)
      expect(output).toMatch(/attribution is undersized/)
      expect(output).toMatch(/attribution appears browser-default/)
      expect(output).not.toContain('INTENTIONAL A')
      expect(await readdir(join(project, 'artifacts/diagnostic-fixture'))).toHaveLength(2)
    } finally { await rm(temp, { recursive: true, force: true }) }
  }, 90_000)
})
