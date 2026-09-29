import { mkdtemp, cp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, relative } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const template = join(root, 'skills/presentation/templates/bootstrap')
const canonicalKit = join(root, 'src/presentation-kit')
const temp = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
const app = join(temp, 'materialized app')
const run = (cmd, args, cwd) => {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed with ${result.status}`)
}
async function files(dir) {
  const result = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) result.push(...(await files(path)).map(child => join(entry.name, child)))
    else result.push(entry.name)
  }
  return result.sort()
}
let server
let browser
let browserContext
let sharedBrowser = false
try {
  await cp(template, app, { recursive: true })
  const packageJson = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'))
  const required = ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'globals', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']
  for (const name of required) {
    if (!packageJson.dependencies?.[name] && !packageJson.devDependencies?.[name]) throw new Error(`Bootstrap is missing dependency ${name}`)
  }
  if (/tailwind/i.test(JSON.stringify(packageJson))) throw new Error('Bootstrap must not add Tailwind')
  const canonical = await files(canonicalKit)
  const copied = await files(join(app, 'src/presentation-kit'))
  if (JSON.stringify(copied) !== JSON.stringify(canonical)) throw new Error('Bootstrap kit file list differs from canonical kit')
  for (const file of canonical) {
    const [a, b] = await Promise.all([readFile(join(canonicalKit, file)), readFile(join(app, 'src/presentation-kit', file))])
    if (!a.equals(b)) throw new Error(`Bootstrap kit drift: ${file}`)
  }
  const kitText = (await Promise.all(canonical.map(file => readFile(join(canonicalKit, file), 'utf8')))).join('\n')
  if (/#[0-9a-f]{3,8}\b|font-family|box-shadow|border-radius|--[\w-]+\s*:/i.test(kitText)) throw new Error('Reusable kit contains visual theme defaults')

  // Add a tiny registered route to prove template imports work from an unrelated cwd.
  const sample = join(app, 'src/presentations/bootstrap-smoke')
  await (await import('node:fs/promises')).mkdir(join(sample, 'steps'), { recursive: true })
  await writeFile(join(sample, 'Talk.tsx'), `import { Presentation } from '../../presentation-kit/Presentation.tsx'\nimport { Smoke } from './steps/Smoke.tsx'\nexport default function Talk() { return <Presentation title="Smoke" steps={[{ id: 'one', era: 'Start', title: 'One', caption: 'Rendered', Scene: Smoke, payload: undefined }]} /> }\n`)
  await writeFile(join(sample, 'steps/Smoke.tsx'), `import { SceneLayer, Box } from '../../../presentation-kit/nodes/index.ts'\nexport function Smoke() { return <SceneLayer><Box id="smoke">Smoke route</Box></SceneLayer> }\n`)
  const registry = join(app, 'src/presentations/index.ts')
  await writeFile(registry, `import type React from 'react'\nexport interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: React.ComponentType }> }\nexport const presentations: PresentationEntry[] = [{ slug: 'bootstrap-smoke', title: 'Smoke', load: () => import('./bootstrap-smoke/Talk') }]\n`)
  run('npm', ['install', '--no-audit', '--no-fund'], app)
  run('npm', ['run', 'lint'], app)
  run('npm', ['run', 'build'], app)
  run('npm', ['run', 'verify'], app)
  server = spawn(process.execPath, [join(app, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4187', '--strictPort'], { cwd: app, stdio: 'ignore' })
  const url = 'http://127.0.0.1:4187/bootstrap-smoke'
  let ready = false
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(url)).ok) { ready = true; break } } catch {}
    if (server.exitCode !== null) throw new Error('Materialized preview exited early')
    await delay(250)
  }
  if (!ready) throw new Error('Materialized app did not serve its route on 127.0.0.1')
  const { chromium } = await import(join(app, 'node_modules/playwright/index.mjs'))
  try {
    if (process.env.PLAYWRIGHT_CDP_ENDPOINT) {
      browser = await chromium.connectOverCDP(process.env.PLAYWRIGHT_CDP_ENDPOINT)
      sharedBrowser = true
    } else browser = await chromium.launch({ headless: true })
  } catch { throw new Error('Chromium is unavailable; install it with `npx playwright install chromium` or set PLAYWRIGHT_CDP_ENDPOINT to a running Chromium CDP endpoint') }
  browserContext = await browser.newContext()
  const page = await browserContext.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(url, { waitUntil: 'networkidle' })
  if (!(await page.getByText('Smoke route').count())) throw new Error('Materialized route did not render the smoke scene')
  if (errors.length) throw new Error(`Materialized route browser errors: ${errors.join('; ')}`)
  console.log('INT-001 passed: materialized bootstrap builds, serves and renders; kit parity and neutral styling confirmed.')
} catch (error) {
  console.error(`INT-001 failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browserContext?.close()
  if (!sharedBrowser) await browser?.close()
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await delay(150) }
  await rm(temp, { recursive: true, force: true })
}
