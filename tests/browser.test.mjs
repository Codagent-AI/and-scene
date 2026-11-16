import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { inspectPresentation } from '../scripts/inspect-presentation.mjs'

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
function assertCleaned(output) {
  const pids = [...output.matchAll(/preview ready .*pid=(\d+)/g)].map((match) => Number(match[1]))
  for (const pid of pids) {
    assert.match(output, new RegExp(`preview stopped pid=${pid}`))
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
  }
}

test('E2E-001 reference presentation passes production verification', { timeout: 180000 }, async () => {
  const cwd = await copyProject()
  try {
    const { code, output } = await runVerify(cwd)
    assert.equal(code, 0, output)
    assert.match(output, /PASS verification how-to-make-a-presentation/)
    assert.match(output, /preview ready http:\/\/127\.0\.0\.1:/)
    for (let i = 0; i < 9; i++) assert.match(output, new RegExp(`render step ${i} PASS`))
    assertCleaned(output)
    console.log(output)
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
      assertCleaned(output)
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
        }, 120)
      }
      render()
      window.addEventListener('keydown', (event) => { if(event.key === 'ArrowRight') { hook.setAttribute('data-step-index', '1'); render() } })
    `)
    await writeFile(join(cwd, 'src/index.css'), 'body { margin: 20px }')
    const started = Date.now()
    const rows = await inspectPresentation('controlled', { cwd, settle: 250 })
    assert.equal(rows.length, 2)
    assert.ok(Date.now() - started >= 500)
    for (const [index, row] of rows.entries()) {
      assert.equal(row.step, index)
      assert.match(row.screenshot, new RegExp(`artifacts/inspection/controlled/1440x900/step-0${index + 1}.png$`))
      assert.equal((await readFile(row.screenshot)).subarray(1, 4).toString(), 'PNG')
      assert.ok(row.warnings.some((warning) => /overlap: collision one \/ collision two/.test(warning)))
      assert.ok(!row.warnings.some((warning) => /allowed first|allowed second/.test(warning)))
      assert.ok(row.warnings.some((warning) => /indistinct active progress/.test(warning)))
      assert.ok(row.warnings.some((warning) => /indistinct active toc/.test(warning)))
      assert.ok(row.warnings.some((warning) => /attribution/.test(warning)))
    }
    assert.ok(rows[1].capturedAt - rows[0].capturedAt >= 250)
  } finally { await rm(cwd, { recursive: true, force: true }) }
})
