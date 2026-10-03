import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, readdir, cp, rm, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrapSource = path.join(repositoryRoot, 'skills/presentation/templates/bootstrap')

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async entry => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? filesBelow(absolute) : [absolute]
  }))
  return nested.flat()
}

describe('presentation bootstrap template', () => {
  it('materializes, builds, routes, and verifies outside the source checkout', async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), 'and-scene-bootstrap-'))
    const appRoot = path.join(tempRoot, 'app')
    try {
      await cp(bootstrapSource, appRoot, { recursive: true })

      const sourceKit = path.join(repositoryRoot, 'src/presentation-kit')
      const templateKit = path.join(appRoot, 'src/presentation-kit')
      const sourceFiles = (await filesBelow(sourceKit)).filter(file => !/\.test\.[^.]+$/.test(file)).map(file => path.relative(sourceKit, file)).sort()
      const templateFiles = (await filesBelow(templateKit)).map(file => path.relative(templateKit, file)).sort()
      expect(templateFiles).toEqual(sourceFiles)
      for (const relative of sourceFiles) {
        expect(await readFile(path.join(templateKit, relative))).toEqual(await readFile(path.join(sourceKit, relative)))
      }

      const manifest = JSON.parse(await readFile(path.join(appRoot, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
      const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
      for (const name of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'globals', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']) {
        expect(dependencies[name], `${name} must be in the bootstrap dependency contract`).toBeTruthy()
      }
      expect(Object.keys(dependencies).some(name => /tailwind|postcss-preset-env|styled-components/i.test(name))).toBe(false)
      expect(JSON.parse(await readFile(path.join(appRoot, 'package-lock.json'), 'utf8')).packages[''].devDependencies.playwright).toBe(dependencies.playwright)

      const fixtureDir = path.join(appRoot, 'src/presentations/bootstrap-check')
      await mkdir(fixtureDir, { recursive: true })
      await writeFile(path.join(fixtureDir, 'Talk.tsx'), `import { Presentation, Box, SceneLayer, type Step } from '../../presentation-kit'\nconst Scene = ({ payload }: { payload: { label: string } }) => <SceneLayer><Box id="bootstrap-check:entity">{payload.label}</Box></SceneLayer>\nconst steps: Step<{ label: string }>[] = [{ id: 'only', era: 'Start', title: 'Bootstrap route', caption: 'The materialized app route renders.', payload: { label: 'Ready' }, Scene }]\nexport default function Talk() { return <Presentation title="Bootstrap check" steps={steps} /> }\n`)
      await writeFile(path.join(appRoot, 'src/presentations/index.ts'), `import type { ComponentType } from 'react'\nexport interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }\nexport const presentations: PresentationEntry[] = [{ slug: 'bootstrap-check', title: 'Bootstrap check', load: () => import('./bootstrap-check/Talk') }]\n`)

      execFileSync('npm', ['ci'], { cwd: appRoot, stdio: 'pipe' })
      execFileSync('npm', ['run', 'build'], { cwd: appRoot, stdio: 'pipe' })
      execFileSync('npm', ['run', 'lint'], { cwd: appRoot, stdio: 'pipe' })
      execFileSync('npm', ['--prefix', appRoot, 'run', 'verify'], {
        cwd: tempRoot,
        stdio: 'pipe',
        env: { ...process.env, PRESENTATION_ROUTE: '/bootstrap-check', PREVIEW_PORT: '43891' },
      })
      execFileSync('npm', ['--prefix', appRoot, 'run', 'inspect', '--', 'bootstrap-check', '--narrow'], {
        cwd: tempRoot,
        stdio: 'pipe',
        env: { ...process.env, PREVIEW_PORT: '43892' },
      })
      expect((await readFile(path.join(appRoot, 'artifacts/inspection/bootstrap-check/390x844-narrow/step-01.png'))).byteLength).toBeGreaterThan(0)

      const bootstrapCss = await readFile(path.join(appRoot, 'src/index.css'), 'utf8')
      expect(bootstrapCss).not.toMatch(/font-family\s*:|#[\da-f]{3,8}\b|rgb\(|box-shadow\s*:|border\s*:/i)
      const kitText = (await Promise.all((await filesBelow(templateKit)).map(file => readFile(file, 'utf8')))).join('\n')
      expect(kitText).not.toMatch(/#[\da-f]{3,8}\b|rgb\(|font-family\s*:|box-shadow\s*:|border\s*:/i)
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  }, 300_000)
})
