import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { withPreview, openPresentation } from '../scripts/browser.mjs'
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

function assertResourcesCleaned(output) {
  const previews = [...output.matchAll(/preview: .* pid=(\d+)/g)]
  const browsers = [...output.matchAll(/^browser: pid=(\d+)/gm)]
  assert.equal(browsers.length, previews.length, 'each ready preview launched a tracked browser')
  for (const match of browsers) {
    const pid = Number(match[1])
    assert.match(output, new RegExp(`cleanup: browser pid=${pid} stopped connected=false`))
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' }, 'Chromium process has exited')
  }
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
    assertResourcesCleaned(output)
    let liveBrowser, livePid
    // Reuse the production build for real rendered-bounds regression checks.
    await withPreview(cwd, async ({ browser, origin, browserPid }) => {
      liveBrowser = browser; livePid = browserPid
      const { page, errors } = await openPresentation(browser, origin, 'how-to-make-a-presentation')
      for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 390, height: 480 }]) {
        await page.setViewportSize(viewport)
        for (const mode of ['browse', 'present']) {
          await page.locator('[data-presentation-mode-toggle]').evaluate((button, expected) => {
            if (document.querySelector('[data-presentation]').getAttribute('data-presentation-mode') !== expected) button.click()
          }, mode)
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          const geometry = await page.evaluate(() => {
            const canvas = document.querySelector('[data-presentation-stage]')
            const stage = canvas.getBoundingClientRect()
            const area = canvas.parentElement.getBoundingClientRect()
            return { stage: { left: stage.left, right: stage.right, top: stage.top, bottom: stage.bottom, width: stage.width, height: stage.height }, area: { left: area.left, right: area.right, top: area.top, bottom: area.bottom } }
          })
          const { stage, area } = geometry
          assert.ok(stage.left >= area.left - 1 && stage.right <= area.right + 1, JSON.stringify({ viewport, mode, geometry }))
          assert.ok(stage.top >= area.top - 1 && stage.bottom <= area.bottom + 1, JSON.stringify({ viewport, mode, geometry }))
          assert.ok(Math.abs((stage.left + stage.right) - (area.left + area.right)) < 1, 'canvas centered horizontally')
          assert.ok(Math.abs((stage.top + stage.bottom) - (area.top + area.bottom)) < 1, 'canvas centered vertically')
          assert.ok(Math.abs(stage.width / stage.height - 880 / 380) < .001, 'uniform fixed-canvas aspect ratio')
          console.log(`PASS rendered bounds ${viewport.width}x${viewport.height} ${mode}: ${JSON.stringify(stage)}`)
          if (viewport.width === 390 && mode === 'browse') {
            // The scaled canvas must keep visible scene labels at a readable rendered size.
            const smallest = await page.evaluate(() => {
              const scale = document.querySelector('[data-presentation-stage]').getBoundingClientRect().width / 880
              const sizes = [...document.querySelectorAll('[data-presentation-stage] [data-entity-name] span, [data-presentation-stage] [data-entity-name] small')]
                .filter(el => el.getClientRects().length && el.textContent.trim().length > 1)
                .map(el => parseFloat(getComputedStyle(el).fontSize) * scale)
              return Math.min(...sizes)
            })
            assert.ok(smallest >= 6, `scene labels render at ${smallest}px at 390px width`)
          }
        }
      }
      assert.deepEqual(errors, [])
    })
    assert.equal(liveBrowser.isConnected(), false)
    assert.throws(() => process.kill(livePid, 0), { code: 'ESRCH' })
  } finally { await rm(cwd, { recursive: true, force: true }) }
})

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
    ['out-of-order sample', async (cwd) => {
      const file = resolve(cwd, 'src/presentations/how-to-make-a-presentation/steps/index.ts')
      const lines = (await readFile(file, 'utf8')).split('\n')
      const first = lines.findIndex(line => line.includes('id: "beat-1"'))
      const second = lines.findIndex(line => line.includes('id: "beat-2"'))
      assert.ok(first >= 0 && second >= 0, 'reference steps found for order fault')
      ;[lines[first], lines[second]] = [lines[second], lines[first]]
      await writeFile(file, lines.join('\n'))
    }, /FAIL sample step 0/],
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
        assertResourcesCleaned(output)
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
    <svg width="880" height="380" style={{ position: 'absolute', inset: 0 }}>
      <title>Metadata title</title><desc>Metadata description</desc>
      <text x="40" y="120">SVG alpha</text><text x="40" y="120">SVG beta</text>
      <foreignObject x="40" y="145" width="240" height="60">
        <div style={{ position: 'absolute', top: 0, left: 0 }}>Foreign alpha</div>
        <div style={{ position: 'absolute', top: 0, left: 0 }}>Foreign beta</div>
      </foreignObject>
    </svg>
    <div data-presentation-allow-overlap="">
      <div data-presentation-allow-overlap=""><span style={{ position: 'absolute', left: 400, top: 230 }}>Nested alpha</span></div>
      <span style={{ position: 'absolute', left: 400, top: 230 }}>Nested beta</span>
    </div>
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
    for (const label of ['Collision', 'SVG', 'Foreign']) {
      assert.match(output, new RegExp(`WARN step 0: overlap:.*${label} alpha.*${label} beta`))
      assert.doesNotMatch(output, new RegExp(`WARN step 1: overlap:.*${label} alpha.*${label} beta`))
    }
    assert.doesNotMatch(output, /overlap:.*Nested alpha.*Nested beta/)
    assert.doesNotMatch(output, /overlap:.*Metadata/)
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
    assertResourcesCleaned(output)
  } finally { await rm(cwd, { recursive: true, force: true }) }
})
