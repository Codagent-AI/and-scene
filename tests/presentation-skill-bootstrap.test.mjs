/** @vitest-environment node */
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const repositoryRoot = resolve(new URL('..', import.meta.url).pathname)
const skillRoot = resolve(repositoryRoot, 'skills/presentation')
const bootstrapRoot = resolve(skillRoot, 'templates/bootstrap')

async function read(relativePath) {
  return readFile(resolve(bootstrapRoot, relativePath), 'utf8')
}

describe('presentation skill bootstrap', () => {
  it('INT-001 materializes a style-neutral, buildable app with aligned scene-kit anchors', async () => {
    const skill = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8')
    const packageJson = JSON.parse(await read('package.json'))
    const materializedRoot = await mkdtemp(resolve(tmpdir(), 'and-scene-bootstrap-'))

    try {
      await cp(bootstrapRoot, materializedRoot, { recursive: true })

      const kitFiles = [
        'constants.ts', 'index.ts', 'types.ts', 'useFitScale.ts', 'usePresentationNav.ts',
        'Stage.tsx', 'Presentation.tsx', 'chrome/Footer.tsx', 'chrome/Header.tsx', 'chrome/Toc.tsx',
        'nodes/Appear.tsx', 'nodes/Arrow.tsx', 'nodes/Box.tsx', 'nodes/Emphasis.tsx',
        'nodes/Frame.tsx', 'nodes/Label.tsx', 'nodes/SceneLayer.tsx', 'nodes/SymbolChip.tsx',
      ]

      expect(skill).toContain('templates/bootstrap')
      expect(skill).toContain('one question at a time')
      expect(skill).toContain('presentations/')
      expect(packageJson.scripts.build).toBe('tsc -b && vite build')
      expect(packageJson.scripts.inspect).toContain('inspect-presentation.mjs')
      expect(await read('package-lock.json')).toContain('playwright')
      expect(packageJson.dependencies).toMatchObject({ react: expect.any(String), 'react-dom': expect.any(String), motion: expect.any(String), 'lucide-react': expect.any(String) })
      expect(packageJson.devDependencies).toMatchObject({ vite: expect.any(String), typescript: expect.any(String), playwright: expect.any(String), eslint: expect.any(String) })
      expect(JSON.stringify(packageJson)).not.toMatch(/tailwind/i)

      for (const relativePath of kitFiles) {
        const canonical = await readFile(resolve(repositoryRoot, 'src/presentation-kit', relativePath), 'utf8')
        expect(await read(`src/presentation-kit/${relativePath}`)).toBe(canonical)
      }

      expect(await read('src/presentations/index.ts')).toContain('presentations')
      expect(await read('scripts/inspect-presentation.mjs')).toContain('data-step-count')
      await execFileAsync('npm', ['ci', '--ignore-scripts'], { cwd: materializedRoot })
      await execFileAsync('npm', ['run', 'build'], { cwd: materializedRoot })
    } finally {
      await rm(materializedRoot, { force: true, recursive: true })
    }
  }, 15_000)

  it('INT-001 exposes a registered route through the local browser verifier', async () => {
    const materializedRoot = await mkdtemp(resolve(tmpdir(), 'and-scene-bootstrap-route-'))

    try {
      await cp(bootstrapRoot, materializedRoot, { recursive: true })
      await symlink(resolve(repositoryRoot, 'node_modules'), resolve(materializedRoot, 'node_modules'), 'dir')
      expect(await read('src/presentations/index.ts')).toContain("slug: 'bootstrap-example'")
      await execFileAsync('npm', ['run', 'verify', '--', 'bootstrap-example'], { cwd: materializedRoot })
    } finally {
      await rm(materializedRoot, { force: true, recursive: true })
    }
  }, 15_000)

  it('INT-001 captures a settled inspection artifact through the project-local helper', async () => {
    const materializedRoot = await mkdtemp(resolve(tmpdir(), 'and-scene-bootstrap-inspect-'))

    try {
      await cp(bootstrapRoot, materializedRoot, { recursive: true })
      await symlink(resolve(repositoryRoot, 'node_modules'), resolve(materializedRoot, 'node_modules'), 'dir')
      await execFileAsync('npm', ['run', 'build'], { cwd: materializedRoot })
      await execFileAsync('npm', ['run', 'inspect', '--', 'bootstrap-example'], { cwd: materializedRoot })
      expect(await readdir(resolve(materializedRoot, 'artifacts/presentation-inspection/bootstrap-example'))).toContain('step-01.png')
    } finally {
      await rm(materializedRoot, { force: true, recursive: true })
    }
  })

  it('INT-002 reports controlled text and chrome defects after settling while exempting allowed overlap', async () => {
    const materializedRoot = await mkdtemp(resolve(tmpdir(), 'and-scene-bootstrap-diagnostics-'))

    try {
      await cp(bootstrapRoot, materializedRoot, { recursive: true })
      await symlink(resolve(repositoryRoot, 'node_modules'), resolve(materializedRoot, 'node_modules'), 'dir')
      const presentationRoot = resolve(materializedRoot, 'src/presentations/bootstrap-example')
      await writeFile(resolve(presentationRoot, 'steps.tsx'), `import { useEffect, useState } from 'react'
import { SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'

type Payload = { phase: number }

function DiagnosticScene({ payload }: SceneProps<Payload>) {
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    setSettled(false)
    const timer = window.setTimeout(() => setSettled(true), 600)
    return () => window.clearTimeout(timer)
  }, [payload.phase])

  return <SceneLayer>
    {payload.phase === 1 ? <>
      <p className="fixture-text fixture-collision-a">collision one</p>
      <p className="fixture-text fixture-collision-b">collision two</p>
    </> : <>
      <div data-presentation-allow-overlap>
        <p className="fixture-text fixture-allowed-a">allowed one</p>
        <p className="fixture-text fixture-allowed-b">allowed two</p>
      </div>
      <p className="fixture-text fixture-settling-a">settling one</p>
      <p className={\`fixture-text fixture-settling-b \${settled ? 'fixture-settled' : ''}\`}>settling two</p>
    </>}
  </SceneLayer>
}

export const STEPS: readonly Step<Payload>[] = [
  { id: 'defects', era: 'fixture', title: 'Defects', caption: 'Controlled defects.', groupKey: 'diagnostics', Scene: DiagnosticScene, payload: { phase: 1 } },
  { id: 'settled', era: 'fixture', title: 'Settled', caption: 'Settled and exempt.', groupKey: 'diagnostics', Scene: DiagnosticScene, payload: { phase: 2 } },
]
`)
      await writeFile(resolve(presentationRoot, 'presentation.css'), `
[data-presentation-root] { min-height: 100vh; padding: 2rem; position: relative; }
[data-presentation-chrome] { position: relative; }
[data-presentation-mode-toggle] { position: absolute; right: 0; top: 0; }
[data-presentation-stage] { margin: 5rem auto; }
[data-presentation-header] { display: flex; gap: 1rem; }
[data-presentation-footer] { display: flex; gap: 1rem; justify-content: space-between; }
.fixture-text { margin: 0; position: absolute; }
.fixture-collision-a, .fixture-collision-b { left: 40px; top: 40px; }
.fixture-allowed-a, .fixture-allowed-b { left: 40px; top: 120px; }
.fixture-settling-a, .fixture-settling-b { left: 260px; top: 200px; }
.fixture-settling-b.fixture-settled { left: 460px; }
`)

      const { stdout, stderr } = await execFileAsync('npm', ['run', 'inspect', '--', 'bootstrap-example'], { cwd: materializedRoot })
      const diagnostics = `${stdout}${stderr}`
      expect(await readdir(resolve(materializedRoot, 'artifacts/presentation-inspection/bootstrap-example'))).toEqual(['step-01.png', 'step-02.png'])
      expect(diagnostics).toContain('WARN step 0: overlap:')
      expect(diagnostics).toContain('WARN step 0: indistinct active chrome:')
      expect(diagnostics).toContain('WARN step 0: unpolished attribution:')
      expect(diagnostics.split('\n').filter((line) => line.includes(': overlap:'))).toEqual(['WARN step 0: overlap: p and p'])
    } finally {
      await rm(materializedRoot, { force: true, recursive: true })
    }
  }, 15_000)

  it('fails inspection when the rendered presentation emits a browser error', async () => {
    const materializedRoot = await mkdtemp(resolve(tmpdir(), 'and-scene-bootstrap-inspection-error-'))

    try {
      await cp(bootstrapRoot, materializedRoot, { recursive: true })
      await symlink(resolve(repositoryRoot, 'node_modules'), resolve(materializedRoot, 'node_modules'), 'dir')
      await execFileAsync('npm', ['run', 'build'], { cwd: materializedRoot })
      const talkPath = resolve(materializedRoot, 'src/presentations/bootstrap-example/Talk.tsx')
      await writeFile(talkPath, (await readFile(talkPath, 'utf8')).replace("import './presentation.css'", "import './presentation.css'\n\nconsole.error('intentional inspection failure')"))
      await execFileAsync('npm', ['run', 'build'], { cwd: materializedRoot })

      await expect(execFileAsync('npm', ['run', 'inspect', '--', 'bootstrap-example'], { cwd: materializedRoot })).rejects.toThrow('intentional inspection failure')
    } finally {
      await rm(materializedRoot, { force: true, recursive: true })
    }
  }, 15_000)

  it('waits for browser transitions and terminates the preview process group', async () => {
    const verifier = await read('scripts/verify.mjs')
    const inspector = await read('scripts/inspect-presentation.mjs')

    expect(verifier).toContain("await chrome.waitFor({ state: 'attached' })")
    expect(verifier).toContain('await delay(50)')
    expect(verifier).toContain('assertNoBrowserErrors(errors, count - 1)')
    expect(verifier).toContain('await terminatePreview(preview)')
    expect(inspector).toContain("page.on('console'")
    expect(inspector).toContain('await terminatePreview(preview)')
  })

  it('documents explicit presentation-skill activation and scope boundaries', async () => {
    const skill = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8')

    expect(skill).toContain('Creates or modifies routed React presentations')
    expect(skill).toContain("'create a presentation,'")
    expect(skill).toContain('## Out of Scope')
    expect(skill).toContain('PowerPoint')
  })
})
