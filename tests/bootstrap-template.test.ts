import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, readdir, rm, cp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repository = resolve(import.meta.dirname, '..')
const template = join(repository, 'skills/presentation/templates/bootstrap')
const canonicalKit = join(repository, 'src/presentation-kit')

async function filesBelow(directory: string, base = directory): Promise<string[]> {
  const paths: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) paths.push(...await filesBelow(path, base))
    else paths.push(relative(base, path))
  }
  return paths.sort()
}

describe('presentation bootstrap template', () => {
  it('materializes outside the repository, builds, and renders its registered route', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
    const app = join(parent, 'starter')
    try {
      await cp(template, app, { recursive: true })
      await cp(join(repository, 'skills/presentation/templates/presentation'), join(app, 'src/presentations/generated'), { recursive: true })
      await cp(join(repository, 'skills/presentation/templates/step/step-01.tsx'), join(app, 'src/presentations/generated/steps/step-01.tsx'))
      const registryPath = join(app, 'src/presentations/index.ts')
      const registry = await readFile(registryPath, 'utf8')
      await writeFile(registryPath, registry.replace(']\n', "  { slug: 'generated', title: 'Generated presentation', load: () => import('./generated/Talk') },\n]\n"))
      execFileSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: app, stdio: 'pipe' })
      const outsideWorkingDirectory = parent
      execFileSync('npm', ['run', 'lint', '--prefix', app], { cwd: outsideWorkingDirectory, stdio: 'pipe' })
      execFileSync('npm', ['run', 'verify', '--prefix', app], { cwd: outsideWorkingDirectory, stdio: 'pipe', timeout: 120_000 })
      execFileSync('npm', ['run', 'inspect', '--prefix', app, '--', 'generated'], { cwd: outsideWorkingDirectory, stdio: 'pipe', timeout: 60_000 })

      const anchors = await Promise.all([
        readFile(join(app, 'package.json'), 'utf8'), readFile(join(app, 'src/presentation-kit/Presentation.tsx'), 'utf8'),
        readFile(join(app, 'src/presentation-kit/Stage.tsx'), 'utf8'), readFile(join(app, 'src/presentation-kit/usePresentationNav.ts'), 'utf8'),
        readFile(join(app, 'src/presentation-kit/chrome/Footer.tsx'), 'utf8'), readFile(join(app, 'src/presentation-kit/chrome/Toc.tsx'), 'utf8'),
        readFile(join(app, 'src/presentation-kit/useFitScale.ts'), 'utf8'), readFile(join(app, 'src/presentations/index.ts'), 'utf8'),
      ])
      expect(anchors[0]).toContain('"build"')
      expect(anchors[1]).toContain('Presentation')
      expect(anchors[2]).toContain('AnimatePresence')
      expect(anchors[3]).toContain('goTo')
      expect(anchors[4]).toContain('caption')
      expect(anchors[5]).toContain('Toc')
      expect(anchors[6]).toContain('scale')
      expect(anchors[7]).toContain("import('./example/Talk')")

      expect(await filesBelow(join(app, 'src/presentation-kit'))).toEqual(await filesBelow(canonicalKit))
      for (const path of await filesBelow(canonicalKit)) {
        expect(await readFile(join(app, 'src/presentation-kit', path), 'utf8')).toBe(await readFile(join(canonicalKit, path), 'utf8'))
      }
      expect(await readFile(join(app, 'src/routeUtils.ts'), 'utf8')).toBe(await readFile(join(repository, 'src/routeUtils.ts'), 'utf8'))
      const manifest = JSON.parse(await readFile(join(app, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
      expect({ ...manifest.dependencies, ...manifest.devDependencies }).toEqual(expect.objectContaining({
        react: expect.any(String), 'react-dom': expect.any(String), motion: expect.any(String), 'lucide-react': expect.any(String), vite: expect.any(String),
        '@vitejs/plugin-react': expect.any(String), typescript: expect.any(String), '@types/react': expect.any(String), '@types/react-dom': expect.any(String),
        '@types/node': expect.any(String), eslint: expect.any(String), '@playwright/test': expect.any(String),
      }))
      const styleSources = await Promise.all((await filesBelow(join(app, 'src/presentation-kit'))).map((path) => readFile(join(app, 'src/presentation-kit', path), 'utf8')))
      expect(styleSources.join('\n')).not.toMatch(/#[0-9a-f]{3,8}\b|tailwind|font-family|box-shadow|border-radius/i)
      expect(await readFile(join(app, 'src/index.css'), 'utf8')).not.toMatch(/#[0-9a-f]{3,8}\b|font-family|box-shadow|border-radius/i)
      expect(await readFile(join(app, 'package.json'), 'utf8')).not.toMatch(/tailwind/i)
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  }, 240_000)
})
