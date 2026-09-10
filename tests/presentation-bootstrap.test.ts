import { access, cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import { chromium } from 'playwright'
import { preview } from 'vite'

const execFileAsync = promisify(execFile)
const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const bootstrapRoot = join(repositoryRoot, 'skills/presentation/templates/bootstrap')
const kitRoot = join(repositoryRoot, 'src/presentation-kit')
const temporaryDirectories: string[] = []

async function filesBelow(directory: string, root = directory): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory()
      ? filesBelow(path, root)
      : [relative(root, path)]
  }))).flat().sort()
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('presentation bootstrap template', () => {
  it('INT-001 materializes from outside the repository with complete anchors, dependencies, parity, and no kit style system', async () => {
    const target = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
    temporaryDirectories.push(target)
    await cp(bootstrapRoot, target, { recursive: true })

    await expect(access(join(target, 'package-lock.json'))).resolves.toBeUndefined()
    await execFileAsync('npm', ['ci', '--ignore-scripts'], { cwd: target, maxBuffer: 1024 * 1024 })

    const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    const installed = { ...manifest.dependencies, ...manifest.devDependencies }
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) {
      expect(installed[dependency]).toBeTypeOf('string')
    }
    expect(manifest.scripts.build).toBeTruthy()
    expect(manifest.scripts.verify).toBeTruthy()
    expect(manifest.scripts.inspect).toBeTruthy()

    for (const anchor of ['src/presentation-kit', 'src/presentations/index.ts', 'vite.config.ts', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      await expect(access(join(target, anchor))).resolves.toBeUndefined()
    }

    const sourceKitFiles = (await filesBelow(kitRoot)).filter((file) => !file.endsWith('.test.tsx'))
    expect(await filesBelow(join(target, 'src/presentation-kit'))).toEqual(sourceKitFiles)
    for (const file of sourceKitFiles) {
      expect(await readFile(join(target, 'src/presentation-kit', file), 'utf8')).toBe(await readFile(join(kitRoot, file), 'utf8'))
    }
    const scripts = await filesBelow(join(repositoryRoot, 'scripts'))
    expect(await filesBelow(join(target, 'scripts'))).toEqual(scripts)
    for (const script of scripts) {
      expect(await readFile(join(target, 'scripts', script), 'utf8')).toBe(await readFile(join(repositoryRoot, 'scripts', script), 'utf8'))
    }

    const kitText = (await Promise.all(sourceKitFiles.map((file) => readFile(join(target, 'src/presentation-kit', file), 'utf8')))).join('\n')
    expect(kitText).not.toMatch(/tailwind|font-family|background(?:-color)?\s*:|box-shadow|border(?:-color)?\s*:/i)
    await writeFile(join(target, 'src/presentations/Smoke.tsx'), `
      import { Presentation } from '../presentation-kit'
      const Scene = () => <div>Bootstrap route content</div>
      export default function Smoke() {
        return <Presentation title="Bootstrap smoke" steps={[
          { id: 'first', era: 'start', title: 'First step', caption: 'Ready to present', payload: null, Scene },
        ]} />
      }
    `)
    await writeFile(join(target, 'src/presentations/index.ts'), `
      export const presentations = [
        { slug: 'bootstrap-smoke', title: 'Bootstrap smoke', load: () => import('./Smoke') },
      ]
    `)
    await expect(execFileAsync('npm', ['run', 'build'], { cwd: target })).resolves.toMatchObject({ stderr: expect.any(String) })
    const server = await preview({ root: target, configFile: false, preview: { host: '127.0.0.1', port: 0 } })
    try {
      const browser = await chromium.launch()
      try {
        const page = await browser.newPage()
        const errors: string[] = []
        page.on('pageerror', (error) => errors.push(error.message))
        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
        await page.goto(new URL('/bootstrap-smoke', server.resolvedUrls!.local[0]).href)
        await page.locator('[data-step-index="0"]').waitFor()
        expect(await page.getByText('Bootstrap route content').isVisible()).toBe(true)
        // Headless Chromium may omit its automatic favicon request. Resolve the
        // document's icon (or browser fallback) explicitly to cover the asset.
        const iconUrl = await page.evaluate(() =>
          document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href ?? new URL('/favicon.ico', location.href).href,
        )
        const icon = await fetch(iconUrl)
        expect(icon.ok, `favicon ${iconUrl}: HTTP ${icon.status}`).toBe(true)
        expect(icon.headers.get('content-type')).toMatch(/^image\//)
        expect(errors).toEqual([])
      } finally {
        await browser.close()
      }
    } finally {
      await new Promise<void>((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
    }
  }, 60000)
})
