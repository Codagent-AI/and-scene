import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { REFERENCE_STEPS } from '../scripts/reference.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function checkout() {
  const cwd = await mkdtemp(resolve(tmpdir(), 'and-scene-browser-'))
  for (const entry of ['src', 'public', 'scripts', 'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html']) {
    await cp(resolve(root, entry), resolve(cwd, entry), { recursive: true })
  }
  await symlink(resolve(root, 'node_modules'), resolve(cwd, 'node_modules'), 'dir')
  return cwd
}

async function run(cwd, args) {
  const child = spawn('npm', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk })
  child.stderr.on('data', (chunk) => { output += chunk })
  const timer = setTimeout(() => child.kill('SIGTERM'), 120_000)
  const code = await new Promise((accept, reject) => {
    child.once('error', reject)
    child.once('exit', accept)
  })
  clearTimeout(timer)
  console.log(output)
  return { code, output }
}

function assertPreviewCleaned(output) {
  for (const match of output.matchAll(/preview: .* pid=(\d+)/g)) {
    const pid = Number(match[1])
    assert.match(output, new RegExp(`cleanup: preview pid=${pid} stopped`))
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
  }
}

test('E2E-001: reference presentation passes production verification', { timeout: 150_000 }, async () => {
  const cwd = await checkout()
  try {
    const { code, output } = await run(cwd, ['run', 'verify'])
    assert.equal(code, 0, output)
    for (let index = 0; index < 9; index++) assert.match(output, new RegExp(`PASS step ${index}/8`))
    assert.match(output, /PASS verify how-to-make-a-presentation/)
    assert.match(output, /preview: http:\/\/127\.0\.0\.1:\d+ \(readiness http:\/\/127\.0\.0\.1:\d+\)/)
    assertPreviewCleaned(output)
  } finally { await rm(cwd, { recursive: true, force: true }) }
})

async function replaceInSample(cwd, from, to) {
  const folder = resolve(cwd, 'src/presentations/how-to-make-a-presentation')
  for (const entry of await readdir(folder, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue
    const path = resolve(entry.parentPath || entry.path, entry.name)
    const source = await readFile(path, 'utf8')
    if (source.includes(from)) {
      await writeFile(path, source.replace(from, to))
      return
    }
  }
  throw new Error(`Fault injection could not find ${from}`)
}

async function injectBrowserFault(cwd, action) {
  // Observe the public step hook, so each fault happens deterministically at step 1.
  const script = `let fired = false; new MutationObserver(() => { if (!fired && document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === '1') { fired = true; ${action} } }).observe(document.body, {subtree:true, childList:true, attributes:true});`
  await writeFile(resolve(cwd, 'src/verification-fault.ts'), script)
  const main = resolve(cwd, 'src/main.tsx')
  await writeFile(main, `import './verification-fault'\n${await readFile(main, 'utf8')}`)
}

test('E2E-002: verification failures are actionable and clean up preview processes', { timeout: 720_000 }, async (t) => {
  const faults = [
    ['build', async (cwd) => {
      const file = resolve(cwd, 'src/main.tsx')
      await writeFile(file, `${await readFile(file, 'utf8')}\nconst broken: never = 1\n`)
    }, /FAIL build/],
    ['missing sample', async (cwd) => {
      await rm(resolve(cwd, 'src/presentations/how-to-make-a-presentation'), { recursive: true })
      const file = resolve(cwd, 'src/presentations/index.ts')
      await writeFile(file, (await readFile(file, 'utf8')).split('\n').filter((line) => !line.includes("slug: 'how-to-make-a-presentation'")).join('\n'))
    }, /FAIL sample/],
    ['malformed sample', async (cwd) => replaceInSample(cwd, 'You have a topic', 'Incorrect first title'), /FAIL sample step 0/],
    ['console error', async (cwd) => injectBrowserFault(cwd, "console.error('injected console error')"), /FAIL render step 1:.*injected console error/],
    ['uncaught page error', async (cwd) => injectBrowserFault(cwd, "setTimeout(() => { throw new Error('injected page error') }, 0)"), /FAIL render step 1:.*injected page error/],
    ['scene render error', async (cwd) => {
      await writeFile(resolve(cwd, 'src/presentations/how-to-make-a-presentation/Talk.tsx'), `import { Presentation } from '../../presentation-kit/Presentation'
function Scene(): never { throw new Error('injected render error') }
const steps = ${JSON.stringify(REFERENCE_STEPS)}.map(([era, title, caption], index) => ({ id: String(index), era, title, caption, Scene, payload: index }))
export default function Talk() { return <Presentation steps={steps} title="Broken rendering" /> }
`)
    }, /FAIL render step 0:.*injected render error/],
    ['failed transition', async (cwd) => {
      await writeFile(resolve(cwd, 'src/verification-fault.ts'), "document.addEventListener('keydown', (event) => { if(event.key === 'ArrowRight') event.stopImmediatePropagation() }, true)\n")
      const main = resolve(cwd, 'src/main.tsx')
      await writeFile(main, `import './verification-fault'\n${await readFile(main, 'utf8')}`)
    }, /FAIL transition step 1/],
  ]
  for (const [name, inject, diagnostic] of faults) {
    await t.test(name, async () => {
      const cwd = await checkout()
      try {
        await inject(cwd)
        const { code, output } = await run(cwd, ['run', 'verify'])
        assert.notEqual(code, 0, output)
        assert.match(output, diagnostic)
        assert.doesNotMatch(output, /PASS verify/)
        assertPreviewCleaned(output)
      } finally { await rm(cwd, { recursive: true, force: true }) }
    })
  }
})

test('INT-002: screenshot helper emits settled artifacts and advisory warnings', { timeout: 150_000 }, async () => {
  const cwd = await checkout()
  try {
    await writeFile(resolve(cwd, 'src/presentations/InspectionFixture.tsx'), `import { Presentation } from '../presentation-kit/Presentation'
function Scene({ payload }: { payload: number }) {
  return <div data-presentation-allow-overlap={payload === 1 ? '' : undefined}>
    <span style={{ position: 'absolute', left: 40, top: 60 }}>Collision alpha</span>
    <span style={{ position: 'absolute', left: 40, top: 60 }}>Collision beta</span>
  </div>
}
const steps = [0, 1].map(payload => ({ id: String(payload), era: String(payload), title: 'Inspection fixture', caption: 'Advisory warning fixture.', Scene, payload, groupKey: 'fixture' }))
export default function InspectionFixture() { return <Presentation steps={steps} title="Inspection fixture" /> }
`)
    await writeFile(resolve(cwd, 'src/presentations/index.ts'), `export const presentations = [{ slug: 'inspection-fixture', title: 'Inspection fixture', load: () => import('./InspectionFixture') }]\n`)
    // Keep fixture styling controlled: no host reset changes the browser-default attribution.
    await writeFile(resolve(cwd, 'src/index.css'), '')
    const { code, output } = await run(cwd, ['run', 'inspect', '--', 'inspection-fixture'])
    assert.equal(code, 0, output)
    assert.match(output, /WARN step 0: overlap:.*Collision alpha.*Collision beta/)
    assert.doesNotMatch(output, /WARN step 1: overlap:.*Collision alpha.*Collision beta/)
    for (const index of [0, 1]) {
      assert.match(output, new RegExp(`WARN step ${index}: indistinct active progress`))
      assert.match(output, new RegExp(`WARN step ${index}: indistinct active toc`))
      assert.match(output, new RegExp(`WARN step ${index}: attribution:`))
    }
    const folder = resolve(cwd, 'artifacts/inspection/inspection-fixture/1440x900')
    const files = await readdir(folder)
    assert.deepEqual(files.sort(), ['manifest.json', 'step-01.png', 'step-02.png'])
    const manifest = JSON.parse(await readFile(resolve(folder, 'manifest.json'), 'utf8'))
    assert.equal(manifest.captures.length, 2)
    for (const capture of manifest.captures) {
      assert.ok(capture.captureAt - capture.transitionAt >= capture.settleMs)
      assert.deepEqual((await readFile(resolve(folder, capture.filename))).subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    }
    assertPreviewCleaned(output)
  } finally { await rm(cwd, { recursive: true, force: true }) }
})
