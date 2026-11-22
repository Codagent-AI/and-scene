import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile, readdir, stat } from 'node:fs/promises'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { withBrowser } from '../scripts/browser.mjs'
import { inspectPresentation } from '../scripts/inspect-presentation.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const template = fileURLToPath(new URL('../skills/presentation/templates/bootstrap/', import.meta.url))
const scratch = resolve(root, '.test-tmp')
await mkdir(scratch, { recursive: true })
async function temporary() { return mkdtemp(join(scratch, 'app-')) }
async function command(args, cwd) {
  return new Promise((accept, reject) => {
    const child = spawn(args[0], args.slice(1), { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    const timer = setTimeout(() => { child.kill('SIGTERM') }, 180000)
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    child.once('error', reject)
    child.once('exit', (code, signal) => { clearTimeout(timer); accept({ code, signal, output }) })
  })
}
async function must(args, cwd) {
  const result = await command(args, cwd)
  console.log(result.output)
  assert.equal(result.code, 0, result.output)
  return result.output
}
async function disposableCopy() {
  const cwd = await temporary()
  for (const path of ['src', 'scripts', 'index.html', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.app.json', 'tsconfig.node.json']) {
    await cp(resolve(root, path), resolve(cwd, path), { recursive: true })
  }
  await writeFile(resolve(cwd, 'tsconfig.json'), JSON.stringify({ files: [], references: [{ path: './tsconfig.app.json' }, { path: './tsconfig.node.json' }] }))
  await symlink(resolve(root, 'node_modules'), resolve(cwd, 'node_modules'), 'dir')
  return cwd
}
async function edit(cwd, path, change) {
  const file = resolve(cwd, path)
  await writeFile(file, change(await readFile(file, 'utf8')))
}
function assertStopped(output) {
  const started = [...output.matchAll(/preview ready http:\/\/127\.0\.0\.1:\d+ pid=(\d+)/g)].map(match => match[1])
  assert.ok(started.length > 0, output)
  for (const pid of started) {
    assert.ok(output.includes(`preview stopped pid=${pid}`), output)
    assert.throws(() => process.kill(Number(pid), 0), { code: 'ESRCH' })
  }
}

async function assertBrowserResourcesClosed(cwd, fail) {
  let browser
  let context
  let page
  let contextClosed = false
  try {
    const operation = withBrowser(async (createdPage, url) => {
      page = createdPage
      context = page.context()
      browser = context.browser()
      context.on('close', () => { contextClosed = true })
      assert.equal(browser.isConnected(), true)
      assert.equal(page.isClosed(), false)
      assert.ok(browser.contexts().includes(context))
      await page.goto(url)
      if (fail) throw new Error('injected cleanup failure')
    }, { cwd })
    if (fail) await assert.rejects(operation, /injected cleanup failure/)
    else await operation
    assert.equal(browser.isConnected(), false, 'owned Browser disconnects')
    assert.equal(page.isClosed(), true, 'owned Page closes')
    assert.equal(contextClosed, true, 'owned BrowserContext emits close')
    assert.deepEqual(context.pages(), [], 'closed context retains no pages')
    assert.deepEqual(browser.contexts(), [], 'closed browser retains no contexts')
    console.log(`browser resources verified closed after ${fail ? 'action failure' : 'success'}`)
  } finally {
    // Keep the regression test itself safe if the production close call is removed.
    await browser?.close()
  }
}

test('INT-001 materialized bootstrap builds renders outside caller cwd and remains complete style-neutral and aligned', { timeout: 180000 }, async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
  assert.ok(!cwd.startsWith(root + '/'))
  console.log(`materialized bootstrap outside source repository: ${cwd}`)
  try {
    await cp(template, cwd, { recursive: true })
    const pkg = JSON.parse(await readFile(resolve(cwd, 'package.json'), 'utf8'))
    for (const dependency of ['react', 'react-dom', 'motion', 'lucide-react']) assert.ok(pkg.dependencies[dependency])
    for (const dependency of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', '@eslint/js', 'eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', 'playwright']) assert.ok(pkg.devDependencies[dependency])
    assert.doesNotMatch(JSON.stringify(pkg), /tailwind/)
    assert.equal((await readFile(resolve(cwd, 'src/index.css'), 'utf8')).trim(), 'body { margin: 0; }')
    async function compare(relative) {
      for (const entry of await readdir(resolve(root, relative), { withFileTypes: true })) {
        const path = `${relative}/${entry.name}`
        if (entry.isDirectory()) await compare(path)
        else assert.equal(await readFile(resolve(cwd, path), 'utf8'), await readFile(resolve(root, path), 'utf8'), path)
      }
    }
    await compare('src/presentation-kit')
    await compare('scripts')
    await must(['npm', 'ci', '--offline', '--no-audit', '--no-fund'], cwd)
    await must(['npm', 'run', 'lint'], cwd)
    // The script location is absolute and cwd is the materialized target, outside the source files.
    const output = await must(['npm', 'run', 'verify'], cwd)
    assert.match(output, /render PASS step 0/)
    assert.match(output, /render PASS step 1/)
    assert.match(output, /PASS build, sample, render/)
    assertStopped(output)
    assert.ok(await stat(resolve(cwd, 'src/presentations/index.ts')))
    assert.ok(await stat(resolve(cwd, 'src/presentation-kit/Presentation.tsx')))
    await cp(new URL('../skills/presentation/templates/presentation/', import.meta.url), resolve(cwd, 'src/presentations/template-demo'), { recursive: true })
    await edit(cwd, 'src/presentations/index.ts', text => text + "\npresentations.push({ slug: 'template-demo', title: 'Template demo', load: () => import('./template-demo/Talk') })\n")
    const generated = await must(['node', 'scripts/verify.mjs', 'template-demo'], cwd)
    assert.match(generated, /render PASS step 0/)
    assertStopped(generated)
  } finally { await rm(cwd, { recursive: true, force: true }) }
})

test('INT-002 inspection captures settled per-step screenshots and reports advisory collisions chrome and attribution with overlap exemptions', { timeout: 180000 }, async () => {
  const cwd = await disposableCopy()
  try {
    await writeFile(resolve(cwd, 'src/presentations/index.ts'), `export const presentations = [{ slug: 'diagnostic', title: 'Diagnostic fixture', load: () => import('./diagnostic/Talk') }]
export function findPresentation(pathname: string) { return presentations.find(entry => '/' + entry.slug === pathname) }
`)
    await mkdir(resolve(cwd, 'src/presentations/diagnostic'))
    await writeFile(resolve(cwd, 'src/presentations/diagnostic/Talk.tsx'), `import { useEffect, useState } from 'react'
import { Presentation } from '../../presentation-kit/Presentation'
import type { SceneProps, Step } from '../../presentation-kit/types'
function Scene({ payload }: SceneProps<number>) {
  const [settled, setSettled] = useState(false)
  useEffect(() => { setSettled(false); const timer = setTimeout(() => setSettled(true), 650); return () => clearTimeout(timer) }, [payload])
  return <div data-entity-id="fixture:shared-parent" data-presentation-allow-overlap={payload === 1 ? '' : undefined}>
    <span style={{ position: 'absolute', left: 50, top: 50 }}>collision-alpha</span>
    <span style={{ position: 'absolute', left: 50, top: 50 }}>collision-beta</span>
    <svg width="200" height="50" style={{ position: 'absolute', left: 500, top: 50 }}>
      <text x="10" y="20">svg-alpha</text><text x="10" y="20">svg-beta</text>
    </svg>
    <div data-presentation-navigation="" style={{ position: 'absolute', inset: 0 }}>
      <button aria-label="icon-alpha" style={{ position: 'absolute', left: 500, top: 120, width: 40, height: 40 }}><svg width="12" height="12"><circle cx="6" cy="6" r="5" /></svg></button>
      <button aria-label="icon-beta" style={{ position: 'absolute', left: 520, top: 120, width: 40, height: 40 }}><svg width="12" height="12"><circle cx="6" cy="6" r="5" /></svg></button>
      <button aria-label="padded-control" style={{ position: 'absolute', left: 50, top: 130, width: 160, height: 50 }}><span style={{ position: 'absolute', left: 5, top: 5 }}>control-label</span></button>
      <span style={{ position: 'absolute', left: 180, top: 166 }}>padded-target</span>
    </div>
    <div style={{ position: 'absolute', width: 50, height: 50, left: 300, top: 100, background: settled ? 'rgb(0, 255, 0)' : 'rgb(255, 0, 0)' }} />
  </div>
}
const steps: Step<number>[] = [0,1].map(payload => ({ id: String(payload), era: String(payload), title: 'Step ' + payload, caption: 'Diagnostic caption.', Scene, payload, groupKey: 'fixture' }))
export default function Talk() { return <><style>{'[data-presentation-attribution] { font-size: 8px } [data-presentation-progress-entry], [data-presentation-toc-entry] { border: 0; border-color: blue } [data-active=\"true\"] { border-color: red }'}</style><Presentation steps={steps} title="Diagnostic fixture" /></> }
`)
    await must(['npm', 'run', 'build'], cwd)
    const start = Date.now()
    const captures = await inspectPresentation('diagnostic', { cwd, settle: 800 })
    assert.equal(captures.length, 2)
    assert.ok(Date.now() - start >= 1600)
    assert.ok(captures[0].warnings.some(warning => /step 0: overlap collision-alpha \/ collision-beta/.test(warning)))
    assert.ok(!captures[1].warnings.some(warning => /overlap collision/.test(warning)))
    assert.ok(captures[0].warnings.some(warning => /overlap svg-alpha \/ svg-beta/.test(warning)))
    assert.ok(!captures[1].warnings.some(warning => /overlap svg-alpha/.test(warning)))
    assert.ok(captures[0].warnings.some(warning => /overlap chrome icon-alpha \/ chrome icon-beta/.test(warning)))
    assert.ok(captures[0].warnings.some(warning => /overlap padded-target \/ chrome padded-control/.test(warning)))
    assert.ok(!captures[1].warnings.some(warning => /overlap.*(?:icon-alpha|padded-control)/.test(warning)))
    assert.ok(!captures[0].warnings.some(warning => /overlap control-label \/ chrome padded-control/.test(warning)))
    for (const capture of captures) {
      assert.ok(capture.warnings.some(warning => /indistinct active progress/.test(warning)))
      assert.ok(capture.warnings.some(warning => /indistinct active toc/.test(warning)))
      assert.ok(capture.warnings.some(warning => /data-presentation-attribution/.test(warning)))
      assert.equal(capture.path, resolve(cwd, 'artifacts/inspections/diagnostic/1440x900', `step-0${capture.index + 1}.png`))
      const png = await readFile(capture.path)
      assert.equal(png.subarray(1,4).toString(), 'PNG')
      assert.equal(png.readUInt32BE(16), 1440)
      assert.equal(png.readUInt32BE(20), 900)
    }
    // Decode through Chromium's canvas, asserting the captured late-state green marker.
    await withBrowser(async page => {
      for (const capture of captures) {
        const png = await readFile(capture.path)
        const pixel = await page.evaluate(async source => {
          const image = new Image(); image.src = source; await image.decode()
          const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
          const context = canvas.getContext('2d'); context.drawImage(image, 0, 0)
          // Canvas is centered in the browse stage, uniformly scaled by 1.5636 at this viewport.
          const scale = Math.min((1440 - 64) / 880, (900 - 112 - 206) / 380)
          const x = (1440 - 880 * scale) / 2 + 320 * scale
          const y = 112 + (582 - 380 * scale) / 2 + 120 * scale
          return [...context.getImageData(x, y, 1, 1).data]
        }, 'data:image/png;base64,' + png.toString('base64'))
        assert.deepEqual(pixel, [0,255,0,255])
      }
    }, { cwd })
    await assert.rejects(inspectPresentation('../unsafe', { cwd }), /Invalid presentation slug/)
    await assert.rejects(inspectPresentation('diagnostic', { cwd, settle: 100 }), /Settle interval/)
    await assert.rejects(inspectPresentation('absent', { cwd }), /Unregistered/)
  } finally { await rm(cwd, { recursive: true, force: true }) }
})

test('E2E-001 reference production verification builds and renders all nine ordered steps over IPv4', { timeout: 180000 }, async () => {
  const output = await must(['npm', 'run', 'verify'], root)
  for (let index = 0; index < 9; index++) assert.match(output, new RegExp(`render PASS step ${index}`))
  assert.match(output, /PASS build, sample, render/)
  assert.match(output, /http:\/\/127\.0\.0\.1:/)
  assertStopped(output)
  await assertBrowserResourcesClosed(root, false)
})

test('E2E-002 injected build sample console page render and transition faults fail actionably and clean up previews', { timeout: 540000 }, async () => {
  const faults = [
    { name: 'build', path: 'src/presentations/how-to-make-a-presentation/Talk.tsx', change: text => text + '\nconst broken: string = 123; console.log(broken)\n', expected: /FAIL build:/ },
    { name: 'missing sample', path: 'src/presentations/index.ts', change: text => text.replace("slug: 'how-to-make-a-presentation'", "slug: 'absent'"), expected: /FAIL sample: missing registered presentation/ },
    { name: 'out of order', path: 'src/presentations/how-to-make-a-presentation/steps/index.ts', change: text => text.replace('outline.map', '[...outline].reverse().map'), expected: /FAIL sample: step 0/ },
    { name: 'console', path: 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', change: text => text.replace('return <SceneLayer>', "if (beat === 3) console.error('injected console fault')\n  return <SceneLayer>"), expected: /FAIL render: step 2:.*injected console fault/ },
    { name: 'pageerror', path: 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', change: text => text.replace('return <SceneLayer>', "if (beat === 3) setTimeout(() => { throw new Error('injected page fault') }, 20)\n  return <SceneLayer>"), expected: /FAIL render: step 2:.*injected page fault/ },
    { name: 'render error', path: 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', change: text => text.replace('return <SceneLayer>', "if (beat === 3) throw new Error('injected render fault')\n  return <SceneLayer>"), expected: /FAIL render: step 2:/ },
    { name: 'stalled transition', path: 'src/presentation-kit/usePresentationNav.ts', change: text => text.replace("['ArrowRight', ' ', 'PageDown']", "[' ', 'PageDown']"), expected: /FAIL render: step 1:/ },
  ]
  for (const fault of faults) {
    const cwd = await disposableCopy()
    try {
      await edit(cwd, fault.path, fault.change)
      const result = await command(['npm', 'run', 'verify'], cwd)
      console.log(`fault ${fault.name}\n${result.output}`)
      assert.notEqual(result.code, 0, fault.name)
      assert.match(result.output, fault.expected, fault.name)
      assert.doesNotMatch(result.output, /PASS build, sample, render/)
      if (fault.name !== 'build') assertStopped(result.output)
      if (fault.name === 'console') await assertBrowserResourcesClosed(cwd, true)
    } finally { await rm(cwd, { recursive: true, force: true }) }
  }
})
