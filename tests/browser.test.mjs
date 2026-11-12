import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { REFERENCE_STEPS } from '../scripts/reference.mjs'

const root = resolve(import.meta.dirname, '..')
async function run(cwd, args, { fail = false, timeout = 180000 } = {}) {
  return await new Promise((done, reject) => {
    const child = spawn('npm', args, { cwd, env: process.env })
    let output = ''
    child.stdout.on('data', (s) => { output += s })
    child.stderr.on('data', (s) => { output += s })
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error(`timeout: npm ${args.join(' ')}\n${output}`)) }, timeout)
    child.on('error', reject)
    child.on('exit', (code) => {
      clearTimeout(timer)
      console.log(output)
      try { assert.equal(code === 0, !fail, output); done(output) } catch (error) { reject(error) }
    })
  })
}
async function copyApp() {
  const dir = await mkdtemp(join(tmpdir(), 'and-scene-test-'))
  for (const entry of ['src', 'scripts', 'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html', 'eslint.config.js']) await cp(join(root, entry), join(dir, entry), { recursive: true })
  await symlink(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
  return dir
}
async function noPreview(output) {
  const ports = [...output.matchAll(/preview: cleaned up (\d+)/g)].map((match) => match[1])
  for (const port of ports) await assert.rejects(fetch(`http://127.0.0.1:${port}`))
}
function fixture({ fault = '', diagnostics = false } = {}) {
  return `import { useEffect, useState } from 'react'; import { createRoot } from 'react-dom/client';
const metadata=${JSON.stringify(fault === 'order' ? [...REFERENCE_STEPS].reverse() : REFERENCE_STEPS)};
function App(){const [index,setIndex]=useState(0); useEffect(()=>{const listener=(event:KeyboardEvent)=>{if(event.key==='ArrowRight')setIndex(i=>Math.min(i+1,8))}; ${fault === 'transition' ? '' : "window.addEventListener('keydown',listener);"} return ()=>window.removeEventListener('keydown',listener)},[]);
useEffect(()=>{if(index===1){${fault === 'console' ? "console.error('injected console failure')" : fault === 'page' ? "setTimeout(()=>{throw new Error('injected page failure')},0)" : ''}}},[index]);
return <main data-step-count="9" data-step-index={index} style={{fontFamily:'Arial'}}><a href="/how-to-make-a-presentation">Sample</a><div data-presentation-era>{metadata[index][0]}</div><h1 data-presentation-title>{metadata[index][1]}</h1><p data-presentation-caption>{metadata[index][2]}</p>${diagnostics ? `<div style={{position:'absolute',top:300,left:50}}><span style={{position:'absolute',width:200}}>unmarked first collision</span><span style={{position:'absolute',width:200}}>unmarked second collision</span></div><div data-presentation-allow-overlap style={{position:'absolute',top:400,left:50}}><span style={{position:'absolute',width:200}}>allowed first collision</span><span style={{position:'absolute',width:200}}>allowed second collision</span></div><nav data-presentation-progress><button aria-current="step">current</button><button>other</button></nav><nav data-presentation-toc><button aria-current="step">current era</button><button>other era</button></nav><a data-presentation-attribution href="https://github.com/Codagent-AI/and-scene" style={{fontSize:8}}>made by and-scene</a>` : '<a data-presentation-attribution href="https://github.com/Codagent-AI/and-scene" style={{fontSize:14,color:"black",textDecoration:"none"}}>made by and-scene</a>'}</main>}
createRoot(document.getElementById('root')!).render(<App/>);`
}
async function compareTree(actual, expected) {
  for (const entry of await readdir(actual, { withFileTypes: true })) {
    if (entry.name.includes('.test.')) continue
    const a = join(actual, entry.name), b = join(expected, entry.name)
    if (entry.isDirectory()) await compareTree(a, b)
    else assert.deepEqual(await readFile(a), await readFile(b), a)
  }
}

test('INT-001 materialized bootstrap builds and renders outside repository with complete style-neutral kit', { timeout: 240000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
  try {
    // Resolve templates from the installed skill's location, never this process cwd.
    const template = resolve(root, 'skills/presentation/templates/bootstrap')
    const tool = resolve(root, 'skills/presentation/tools/scaffold.mjs')
    const result = await new Promise((done, reject) => {
      const child = spawn(process.execPath, [tool, dir, '--write'], { cwd: tmpdir() })
      let output = ''; child.stdout.on('data', s => { output += s }); child.stderr.on('data', s => { output += s });
      child.on('exit', code => code === 0 ? done(output) : reject(new Error(output)))
    })
    console.log(result)
    assert.ok(template.endsWith('templates/bootstrap'))
    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
    for (const name of ['react', 'react-dom', 'motion', 'lucide-react']) assert.ok(pkg.dependencies[name], name)
    for (const name of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) assert.ok(pkg.devDependencies[name], name)
    assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
    await compareTree(join(root, 'src/presentation-kit'), join(dir, 'src/presentation-kit'))
    for (const name of await readdir(join(root, 'scripts'))) if (name.endsWith('.mjs')) assert.deepEqual(await readFile(join(root, 'scripts', name)), await readFile(join(dir, 'scripts', name)), name)
    await run(dir, ['ci', '--ignore-scripts'])
    const registry = await readFile(join(dir, 'src/presentations/index.ts'), 'utf8')
    const slug = registry.match(/slug:\s*['"]([^'"]+)/)?.[1]
    assert.ok(slug, 'explicit registered bootstrap route')
    const output = await run(dir, ['run', 'verify', '--', slug])
    assert.match(output, /PASS:/)
    await noPreview(output)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('INT-002 inspection writes settled screenshots and step-specific advisory diagnostics with exemptions', { timeout: 120000 }, async () => {
  const dir = await copyApp()
  try {
    await writeFile(join(dir, 'src/main.tsx'), fixture({ diagnostics: true }))
    const output = await run(dir, ['run', 'inspect', '--', 'how-to-make-a-presentation'])
    const target = join(dir, 'artifacts/inspect/how-to-make-a-presentation/1440x900')
    const report = JSON.parse(await readFile(join(target, 'report.json'), 'utf8'))
    assert.equal(report.length, 9)
    for (const [index, step] of report.entries()) {
      assert.equal(step.step, index)
      assert.equal(step.filename, `step-${String(index+1).padStart(2, '0')}.png`)
      assert.ok((await readFile(join(target, step.filename))).length > 1000)
      assert.ok(step.settle >= 1000)
      if (index) assert.ok(step.capturedAt - report[index-1].capturedAt >= step.settle)
      assert.ok(step.warnings.some((s) => s.includes('overlap:') && s.includes('unmarked')))
      assert.ok(!step.warnings.some((s) => s.includes('allowed first')))
      assert.ok(step.warnings.some((s) => s.includes('active navigation indistinct')))
      assert.ok(step.warnings.some((s) => s.includes('attribution unpolished')))
    }
    assert.match(output, /ADVISORY step 0/)
    assert.match(output, /warnings are advisory/)
    await noPreview(output)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('E2E-001 reference passes production verification with all nine steps and IPv4 preview', { timeout: 120000 }, async () => {
  const dir = await copyApp()
  try {
    const output = await run(dir, ['run', 'verify'])
    assert.match(output, /PASS: build, registration, 9 steps/)
    assert.match(output, /host=127\.0\.0\.1 readiness=http:\/\/127\.0\.0\.1:\d+ browser=http:\/\/127\.0\.0\.1:/)
    for (let i = 0; i < 9; i++) assert.match(output, new RegExp(`render: step ${i}/8 passed`))
    await noPreview(output)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('E2E-002 verification faults fail actionably and clean up preview processes', { timeout: 300000 }, async (t) => {
  for (const fault of ['build', 'missing', 'order', 'console', 'page', 'transition']) await t.test(fault, async () => {
    const dir = await copyApp()
    try {
      await writeFile(join(dir, 'src/main.tsx'), fault === 'build' ? 'this is invalid TypeScript' : fault === 'missing' ? "import {createRoot} from 'react-dom/client';createRoot(document.getElementById('root')!).render(<p>No registered sample</p>)" : fixture({ fault }))
      const output = await run(dir, ['run', 'verify'], { fail: true })
      assert.match(output, /FAIL:/)
      assert.ok(!output.includes('PASS:'))
      if (fault === 'build') assert.match(output, /FAIL: build:/)
      else if (fault === 'missing') assert.match(output, /FAIL: sample: missing registered/)
      else if (fault === 'order') assert.match(output, /FAIL: sample: normative metadata mismatch at step 0/)
      else assert.match(output, /FAIL: render: step 1:/)
      if (fault !== 'build') assert.match(output, /preview: cleaned up/)
      await noPreview(output)
    } finally { await rm(dir, { recursive: true, force: true }) }
  })
})
