import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { sh } from '../helpers/repo-copy'
import { launchBrowser, startPreview } from '../../scripts/lib/runtime.mjs'

const REPO = path.resolve(import.meta.dirname, '..', '..')
const BOOTSTRAP = path.join(REPO, 'skills/presentation/templates/bootstrap')
const SETUP = path.join(REPO, 'skills/presentation/scripts/setup.mjs')
const TITLE = 'He said "hi" \\ it\'s */ done'
let work: string
let app: string
let scaffoldOut: string

// A host app that has only the build anchor: its own Vite + React + TypeScript setup and entry module.
beforeAll(() => {
  work = mkdtempSync(path.join(os.tmpdir(), 'partial-int-'))
  app = path.join(work, 'host-app')
  mkdirSync(path.join(app, 'src'), { recursive: true })
  for (const f of ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html']) {
    cpSync(path.join(BOOTSTRAP, f), path.join(app, f))
  }
  writeFileSync(
    path.join(app, 'package.json'),
    JSON.stringify({
      name: 'host-app',
      private: true,
      type: 'module',
      scripts: { build: 'tsc -b && vite build' },
      dependencies: { react: '^19.2.6', 'react-dom': '^19.2.6' },
      devDependencies: {
        '@types/node': '^24.12.3', '@types/react': '^19.2.14', '@types/react-dom': '^19.2.3',
        '@vitejs/plugin-react': '^6.0.1', typescript: '~6.0.2', vite: '^8.0.12',
      },
    }),
  )
  writeFileSync(
    path.join(app, 'src/main.tsx'),
    "import { createRoot } from 'react-dom/client'\n\ncreateRoot(document.getElementById('root')!).render(<p>host app home</p>)\n",
  )
  const r = sh(process.execPath, [SETUP, 'scaffold', app], os.tmpdir())
  scaffoldOut = r.out
  expect(r.status, r.out).toBe(0)
  const c = sh(process.execPath, [SETUP, 'create', app, 'nasty-title', TITLE], os.tmpdir())
  expect(c.status, c.out).toBe(0)
})
afterAll(() => rmSync(work, { recursive: true, force: true }))

describe('partial scaffold into an existing app (I-33, I-35, I-42, I-49)', () => {
  it('installs the dependencies of the added anchors and keeps the host build setup', () => {
    expect(scaffoldOut).toContain('"installed": true')
    for (const dep of ['motion', 'lucide-react', 'playwright', 'eslint']) {
      expect(existsSync(path.join(app, 'node_modules', dep, 'package.json')), dep).toBe(true)
    }
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.scripts.verify).toContain('verify.mjs')
    expect(existsSync(path.join(app, 'src/main.host.tsx'))).toBe(true)
  })

  it('builds, including a presentation whose title has quotes, backslashes and a comment terminator', () => {
    const build = sh('npm', ['run', 'build'], app)
    expect(build.status, build.out).toBe(0)
  })

  it('renders every registered presentation through its own verification entry point', () => {
    const v = sh('npm', ['run', 'verify'], app)
    expect(v.status, v.out).toBe(0)
    expect(v.out).toContain('verify: [registry] PASS (starter, nasty-title)')
    expect(v.out).toContain('verify: [render] PASS nasty-title (3 steps)')
  })

  it('serves the new presentation routes while the host keeps its own home page', async () => {
    const preview = await startPreview(app)
    const browser = await launchBrowser(app)
    try {
      const page = await browser.newPage()
      await page.goto(`${preview.origin}/`, { waitUntil: 'load' })
      await page.waitForSelector('text=host app home')
      await page.goto(`${preview.origin}/nasty-title`, { waitUntil: 'load' })
      await page.waitForSelector('[data-presentation-root]')
      expect(await page.textContent('[data-presentation-title]')).toBe(TITLE)
    } finally {
      await browser.close()
      await preview.stop()
    }
  })
})
