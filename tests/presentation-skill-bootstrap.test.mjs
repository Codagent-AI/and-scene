/** @vitest-environment node */
import { cp, mkdtemp, readFile, readdir, rm, symlink } from 'node:fs/promises'
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
  })

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
  })

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
})
