import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { inspectPresentation } from '../scripts/inspect-presentation.mjs'
import { withPreview } from '../scripts/browser-session.mjs'

const root = process.cwd()
async function copyProject() {
  const target = await mkdtemp(join(tmpdir(), 'and-scene-e2e-'))
  for (const item of ['src', 'scripts', 'package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html', 'public']) {
    await cp(join(root, item), join(target, item), { recursive: true })
  }
  await symlink(join(root, 'node_modules'), join(target, 'node_modules'), 'dir')
  return target
}
function runVerify(cwd) {
  return new Promise((done, reject) => {
    const child = spawn('npm', ['run', 'verify'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.on('error', reject)
    child.on('exit', (code) => done({ code, output }))
  })
}
function assertCleaned(output, expectBrowser) {
  for (const resource of ['preview', 'browser']) {
    const pids = [...output.matchAll(new RegExp(`${resource} ready .*pid=(\\d+)`, 'g'))].map(match => Number(match[1]))
    assert.equal(pids.length, expectBrowser ? 1 : 0, `${resource} launch count: ${output}`)
    for (const pid of pids) {
      assert.match(output, new RegExp(`${resource} stopped pid=${pid}`))
      assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
      console.log(`asserted ${resource} process ${pid} terminated`)
    }
  }
}

async function assertCanvasAndEditedAnimation(cwd) {
  await withPreview(async (page, origin) => {
    await page.goto(`${origin}/how-to-make-a-presentation`)
    await page.locator('[data-presentation-canvas]').waitFor()
    for (const viewport of [{width:390,height:844}, {width:700,height:480}, {width:1440,height:900}]) {
      await page.setViewportSize(viewport)
      for (const mode of ['browse', 'present']) {
        if (await page.locator('[data-presentation-root]').getAttribute('data-presentation-mode') !== mode) await page.locator('[data-presentation-mode-toggle]').click()
        // Measure after resize/mode rendering commits, independently of fit math.
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        const {canvas, stage} = await page.evaluate(() => {
          const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height} }
          return {canvas:rect('[data-presentation-canvas]'), stage:rect('[data-presentation-stage]')}
        })
        assert.ok(canvas.left >= -1 && canvas.right <= viewport.width + 1, JSON.stringify({canvas, viewport, mode}))
        assert.ok(canvas.top >= stage.top - 1 && canvas.bottom <= stage.bottom + 1, JSON.stringify({canvas, stage, mode}))
        assert.ok(Math.abs((canvas.left + canvas.right) / 2 - viewport.width / 2) < 1)
        assert.ok(Math.abs((canvas.top + canvas.bottom) / 2 - (stage.top + stage.bottom) / 2) < 1)
        assert.ok(Math.abs(canvas.width / 880 - canvas.height / 380) < .001)
        console.log(`I-30 rendered canvas fits ${viewport.width}x${viewport.height} ${mode}: ${JSON.stringify(canvas)}`)
      }
    }
    await page.setViewportSize({width:1440,height:900})
    await page.locator('[data-presentation-mode-toggle]').click()
    await page.locator('[data-presentation-progress]').nth(6).click()
    const card = await page.locator('[data-entity="card-2"]').elementHandle()
    const edited = page.locator('[data-entity-id="how-to-make-a-presentation:edited"]')
    assert.equal(await edited.count(), 0)
    await page.locator('[data-presentation-progress]').nth(7).click()
    await edited.waitFor({state:'attached'})
    assert.ok(Number(await edited.evaluate(el => getComputedStyle(el).opacity)) < .1, 'new edited label starts transparent')
    const intermediateOpacity = () => page.waitForFunction(() => {
      const element = document.querySelector('[data-entity-id="how-to-make-a-presentation:edited"]')
      const opacity = element && Number(getComputedStyle(element).opacity)
      return opacity > 0 && opacity < 1
    }, undefined, {polling:'raf',timeout:3000})
    await intermediateOpacity()
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('[data-entity-id="how-to-make-a-presentation:edited"]')).opacity) >= .99)
    await page.locator('[data-presentation-progress]').nth(6).click()
    assert.equal(await edited.count(), 1, 'departing edited label remains mounted during exit')
    await intermediateOpacity()
    await edited.waitFor({state:'detached'})
    assert.ok(await card.evaluate(el => el === document.querySelector('[data-entity="card-2"]')), 'continuing card instance persists')
    console.log('I-19 I-36 edited label enters and exits through intermediate opacity; card persists')
  }, {cwd})
}

test('E2E-001 reference presentation passes production verification', { timeout: 180000 }, async () => {
  const cwd = await copyProject()
  try {
    const { code, output } = await runVerify(cwd)
    assert.equal(code, 0, output)
    assert.match(output, /PASS verification how-to-make-a-presentation/)
    assert.match(output, /preview ready http:\/\/127\.0\.0\.1:/)
    for (let i = 0; i < 9; i++) assert.match(output, new RegExp(`render step ${i} PASS`))
    assertCleaned(output, true)
    console.log(output)
    await assertCanvasAndEditedAnimation(cwd)
  } finally { await rm(cwd, { recursive: true, force: true }) }
})

for (const variant of ['build', 'missing', 'order', 'console', 'page', 'render', 'transition']) {
  test(`E2E-002 actionable ${variant} failure cleans preview`, { timeout: 180000 }, async () => {
    const cwd = await copyProject()
    try {
      const main = join(cwd, 'src/main.tsx')
      if (variant === 'build') await writeFile(main, 'const broken: number = "type error"; export default broken\n')
      if (variant === 'missing') await writeFile(join(cwd, 'src/presentations/index.ts'), (await readFile(join(cwd, 'src/presentations/index.ts'), 'utf8')).replace("slug: 'how-to-make-a-presentation'", "slug: 'unregistered-reference'"))
      if (variant === 'order') {
        const path = join(cwd, 'src/presentations/how-to-make-a-presentation/outline.json')
        const rows = JSON.parse(await readFile(path, 'utf8')); [rows[0], rows[1]] = [rows[1], rows[0]]
        await writeFile(path, JSON.stringify(rows))
      }
      if (variant === 'render') {
        const scene = join(cwd, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
        await writeFile(scene, (await readFile(scene, 'utf8')).replace('  return <SceneLayer>', '  if (payload >= 2) throw new Error("injected render failure")\n  return <SceneLayer>'))
      }
      if (['console', 'page', 'transition'].includes(variant)) {
        const fault = variant === 'console' ? 'console.error("injected console failure")' : variant === 'page' ? 'setTimeout(() => { throw new Error("injected page failure") }, 0)' : 'event.stopImmediatePropagation()'
        await writeFile(main, `${await readFile(main, 'utf8')}\nwindow.addEventListener('keydown', (event) => { if(event.key === 'ArrowRight') { ${fault} } }, true)\n`)
      }
      const { code, output } = await runVerify(cwd)
      assert.notEqual(code, 0, output)
      assert.doesNotMatch(output, /PASS verification/)
      assert.match(output, new RegExp(`FAIL ${variant === 'build' ? 'build' : ['missing', 'order'].includes(variant) ? 'sample' : 'render'}`))
      if (['console', 'page', 'render', 'transition'].includes(variant)) assert.match(output, /step [01]/)
      if (variant === 'console') assert.match(output, /injected console failure/)
      if (variant === 'page') assert.match(output, /injected page failure/)
      if (variant === 'render') assert.match(output, /injected render failure/)
      assertCleaned(output, ['console', 'page', 'render', 'transition'].includes(variant))
      console.log(output)
    } finally { await rm(cwd, { recursive: true, force: true }) }
  })
}

test('INT-002 screenshots settle and advisory diagnostics identify controlled defects', { timeout: 180000 }, async () => {
  const cwd = await copyProject()
  try {
    // This throwaway registered route makes diagnostic outcomes deterministic.
    await writeFile(join(cwd, 'src/presentations/index.ts'), (await readFile(join(cwd, 'src/presentations/index.ts'), 'utf8')).replace("slug: 'how-to-make-a-presentation'", "slug: 'controlled'"))
    await writeFile(join(cwd, 'src/main.tsx'), `
      import './index.css'
      document.body.innerHTML = '<div data-step-count="2" data-step-index="0"></div><div id="content"></div>'
      const hook = document.querySelector('[data-step-count]')!
      function render() {
        const step = Number(hook.getAttribute('data-step-index'))
        document.querySelector('#content')!.innerHTML = '<span>transitioning</span>'
        setTimeout(() => {
          document.querySelector('#content')!.innerHTML = '<div style="position:absolute;left:40px;top:100px"><span>collision one</span></div><div style="position:absolute;left:40px;top:100px"><span>collision two</span></div><div data-presentation-allow-overlap style="position:absolute;left:40px;top:200px"><span style="position:absolute">allowed first</span><span style="position:absolute">allowed second</span></div><button data-presentation-progress aria-current="step">active progress</button><button data-presentation-progress>inactive progress</button><button data-presentation-toc aria-current="step">active toc</button><button data-presentation-toc>inactive toc</button>' + (step ? '<a data-presentation-attribution style="font-size:9px" href="https://github.com">made by and-scene</a>' : '')
          document.querySelector('#content')!.insertAdjacentHTML('beforeend', '<span style="position:absolute;left:300px;top:300px">scene at icon</span><button data-presentation-next aria-label="icon-only next" style="position:absolute;left:300px;top:300px;width:100px;height:30px;background:gray"></button><span style="position:absolute;left:500px;top:300px">scene at dot</span><button data-presentation-progress aria-label="empty progress dot" style="position:absolute;left:500px;top:300px;width:100px;height:30px;background:gray"></button><button data-presentation-prev aria-label="overlapping previous" style="position:absolute;left:700px;top:300px;width:100px;height:30px"></button><button data-presentation-next aria-label="overlapping next" style="position:absolute;left:700px;top:300px;width:100px;height:30px"></button><div data-presentation-allow-overlap style="position:absolute;left:300px;top:400px"><span>allowed icon label</span><button data-presentation-next aria-label="allowed icon" style="position:absolute;left:0;top:0;width:100px;height:30px"></button></div><button data-presentation-next aria-label="own-label button" style="position:absolute;left:600px;top:400px"><span>own-label text</span></button>')
        }, 120)
      }
      render()
      window.addEventListener('keydown', (event) => { if(event.key === 'ArrowRight') { hook.setAttribute('data-step-index', '1'); render() } })
    `)
    await writeFile(join(cwd, 'src/index.css'), 'body { margin: 20px }')
    const rows = await inspectPresentation('controlled', { cwd, settle: 250 })
    assert.equal(rows.length, 2)
    for (const [index, row] of rows.entries()) {
      assert.equal(row.step, index)
      assert.ok(row.captureStartedAt - row.activeAt >= row.settle - 1, `step ${index}: capture started only ${row.captureStartedAt - row.activeAt}ms after observing its index; expected ${row.settle}ms`)
      console.log(`I-43 step ${index}: active-to-capture ${row.captureStartedAt - row.activeAt}ms, configured ${row.settle}ms`)
      assert.match(row.screenshot, new RegExp(`artifacts/inspection/controlled/1440x900/step-0${index + 1}.png$`))
      assert.equal((await readFile(row.screenshot)).subarray(1, 4).toString(), 'PNG')
      assert.ok(row.warnings.some((warning) => /overlap: collision one \/ collision two/.test(warning)))
      assert.ok(!row.warnings.some((warning) => /allowed first|allowed second|allowed icon|own-label/.test(warning)))
      for (const pair of [['scene at icon','icon-only next'], ['scene at dot','empty progress dot'], ['overlapping previous','overlapping next']]) {
        assert.ok(row.warnings.some(warning => warning.startsWith('overlap:') && pair.every(name => warning.includes(name))), `missing chrome geometry warning for ${pair}: ${row.warnings}`)
      }
      assert.ok(row.warnings.some((warning) => /indistinct active progress/.test(warning)))
      assert.ok(row.warnings.some((warning) => /indistinct active toc/.test(warning)))
      assert.ok(row.warnings.some((warning) => /attribution/.test(warning)))
    }
  } finally { await rm(cwd, { recursive: true, force: true }) }
})
