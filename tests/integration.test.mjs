import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { scaffold } from '../skills/presentation/scaffold.mjs'
const root = fileURLToPath(new URL('../', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'and-scene-tests-'))
after(async () => { await rm(temporary, { recursive: true, force: true }) })
function command(args, cwd, limit = 120000, executable = 'npm') {
  return new Promise((done, reject) => {
    const child = spawn(executable, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    const timeout = setTimeout(() => { child.kill('SIGTERM'); reject(new Error(`Timed out ${args.join(' ')}: ${output}`)) }, limit)
    child.once('error', error => { clearTimeout(timeout); reject(error) })
    child.once('exit', code => { clearTimeout(timeout); console.log(`COMMAND ${executable} ${args.join(' ')} in ${cwd} => ${code}\n${output}`); done({ code, output }) })
  })
}
async function assertCleanup(output) {
  const urls = [...output.matchAll(/PREVIEW (http:\/\/127\.0\.0\.1:\d+)/g)].map(match => match[1])
  for (const url of urls) {
    assert.match(output, new RegExp(`CLEANUP preview ${new URL(url).port}`))
    await assert.rejects(fetch(url), /fetch failed/)
  }
}
async function copyApp(name) {
  const target = join(temporary, name)
  await mkdir(target)
  for (const path of ['src', 'scripts', 'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'tests/type-contract.tsx']) {
    await mkdir(resolve(target, path, '..'), { recursive: true })
    await cp(resolve(root, path), resolve(target, path), { recursive: true })
  }
  await symlink(resolve(root, 'node_modules'), resolve(target, 'node_modules'), 'dir')
  return target
}
async function listFiles(dir, prefix = '') {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(entry => entry.isDirectory() ? listFiles(resolve(dir, entry.name), prefix + entry.name + '/') : prefix + entry.name))).flat()
}

test('INT-001 materialized bootstrap builds and verifies outside repository with full neutral aligned contracts', { timeout: 180000 }, async () => {
  const target = join(temporary, 'materialized')
  const materialized = await command([resolve(root, 'skills/presentation/scaffold.mjs'), '--target', target], temporary, 120000, process.execPath)
  assert.equal(materialized.code, 0, materialized.output)
  const installed = await command(['ci', '--ignore-scripts', '--no-audit', '--no-fund'], target)
  assert.equal(installed.code, 0, installed.output)
  const pkg = JSON.parse(await readFile(resolve(target, 'package.json')))
  for (const dep of ['react', 'react-dom', 'motion', 'lucide-react']) assert.ok(pkg.dependencies[dep], dep)
  for (const dep of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', '@eslint/js', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']) assert.ok(pkg.devDependencies[dep], dep)
  assert.ok(!Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some(dep => /tailwind/.test(dep)))
  for (const path of await listFiles(resolve(root, 'src/presentation-kit'))) {
    const canonical = await readFile(resolve(root, 'src/presentation-kit', path), 'utf8')
    assert.equal(await readFile(resolve(target, 'src/presentation-kit', path), 'utf8'), canonical, `kit drift: ${path}`)
    assert.doesNotMatch(canonical, /(?:background(?:Color)?|fontFamily|boxShadow|borderRadius|color)\s*:/, `kit visual default: ${path}`)
  }
  for (const path of ['verify.mjs', 'inspect-presentation.mjs', 'browser-runtime.mjs', 'visual-diagnostics.mjs', 'reference-outline.json']) assert.equal(await readFile(resolve(target, 'scripts', path), 'utf8'), await readFile(resolve(root, 'scripts', path), 'utf8'), `script drift: ${path}`)
  assert.equal(await readFile(resolve(target, 'src/index.css'), 'utf8'), 'html, body, #root { margin: 0; min-height: 100%; }\n')
  const result = await command(['run', 'verify'], target)
  assert.equal(result.code, 0, result.output); assert.match(result.output, /PASS verification: starter/)
  await assertCleanup(result.output)
})

test('INT-001 partial copy preserves existing anchors and refuses conflicting files before writes', async () => {
  const target = join(temporary, 'partial')
  await mkdir(target)
  const original = '{"name":"host","scripts":{"build":"custom-build"},"dependencies":{"react":"^19.0.0"}}\n'
  await writeFile(join(target, 'package.json'), original)
  await writeFile(join(target, 'unrelated.txt'), 'preserved')
  await scaffold(target, ['kit'])
  assert.equal((JSON.parse(await readFile(join(target, 'package.json')))).scripts.build, 'custom-build')
  assert.equal(await readFile(join(target, 'unrelated.txt'), 'utf8'), 'preserved')
  const conflict = join(temporary, 'conflict')
  await mkdir(join(conflict, 'src/presentation-kit'), { recursive: true })
  await writeFile(join(conflict, 'src/presentation-kit/types.ts'), 'custom contract')
  await assert.rejects(scaffold(conflict), /Refusing to overwrite/)
  assert.deepEqual(await readdir(conflict), ['src'])
  await assert.rejects(scaffold(conflict, ['unknown']), /Unknown scaffold anchor/)
})

test('E2E-001 canonical npm verification builds production and visits all nine clean steps over IPv4', { timeout: 120000 }, async () => {
  const result = await command(['run', 'verify'], root)
  assert.equal(result.code, 0, result.output)
  for (let i = 0; i < 9; i++) assert.match(result.output, new RegExp(`STEP ${i} PASS`))
  assert.match(result.output, /PREVIEW http:\/\/127\.0\.0\.1:/)
  assert.match(result.output, /PASS verification: how-to-make-a-presentation/)
  await assertCleanup(result.output)
})

test('INT-002 local helper writes settled artifacts and faithful advisory diagnostics', { timeout: 120000 }, async () => {
  const target = await copyApp('diagnostics')
  const fixture = `import { useEffect, useState } from 'react'
import { Presentation, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
function Fixture({ payload }: SceneProps<number>) {
 const [settled, setSettled] = useState(false)
 useEffect(() => { const timer = setTimeout(() => setSettled(true), 100); return () => clearTimeout(timer) }, [payload])
 return <SceneLayer><div style={{position:'absolute',left:100,top:100}}><span style={{position:'absolute'}}>collision-a</span><span style={{position:'absolute',opacity:settled?1:0}}>collision-b</span></div><div data-presentation-allow-overlap="" style={{position:'absolute',left:400,top:100}}><span style={{position:'absolute'}}>allowed-a</span><span style={{position:'absolute'}}>allowed-b</span></div><div style={{opacity:0,position:'absolute',left:600,top:100}}><span style={{position:'absolute'}}>hidden-a</span><span style={{position:'absolute'}}>hidden-b</span></div><span data-settled={settled} style={{position:'absolute',top:200}}>settled {String(settled)}</span></SceneLayer>
}
const steps: Step<number>[] = [0,1].map(i=>({id:'x'+i,era:'era'+i,title:'Title '+i,caption:'Caption '+i,Scene:Fixture,payload:i,groupKey:'shared'}))
export default function Talk(){return <Presentation steps={steps} title="Diagnostics" />}`
  await writeFile(resolve(target, 'src/presentations/how-to-make-a-presentation/Talk.tsx'), fixture)
  const result = await command(['run', 'inspect', '--', 'how-to-make-a-presentation', '--settle-ms', '250'], target)
  assert.equal(result.code, 0, result.output)
  const directory = resolve(target, '.artifacts/inspections/how-to-make-a-presentation/1440x900')
  const report = JSON.parse(await readFile(resolve(directory, 'report.json')))
  assert.equal(report.length, 2)
  for (const [i, entry] of report.entries()) {
    assert.equal(entry.index, i); assert.equal(entry.settleMs, 250)
    assert.match(entry.filename, /^step-0[12]\.png$/)
    const png = await readFile(resolve(directory, entry.filename)); assert.equal(png.subarray(1, 4).toString(), 'PNG')
    assert.ok(entry.warnings.some(w => /overlap/.test(w) && /collision/.test(w)), JSON.stringify(entry.warnings))
    assert.ok(!entry.warnings.some(w => /allowed|hidden/.test(w)), JSON.stringify(entry.warnings))
    assert.ok(entry.warnings.some(w => /indistinct active chrome: data-presentation-progress-item/.test(w)))
    assert.ok(entry.warnings.some(w => /indistinct active chrome: data-presentation-toc-item/.test(w)))
    assert.ok(entry.warnings.some(w => /unpolished attribution/.test(w)))
  }
  assert.ok(report[1].capturedAt - report[0].capturedAt >= 250)
  assert.match(result.output, /ADVISORY step 0/); assert.match(result.output, /ADVISORY step 1/)
  await assertCleanup(result.output)
})

test('E2E-002 verification failures identify phases and steps and clean subprocesses', { timeout: 300000 }, async t => {
  const faults = {
    build: async dir => writeFile(resolve(dir, 'src/main.tsx'), 'this is not valid TypeScript'),
    missing: async dir => { await writeFile(resolve(dir, 'src/presentations/index.ts'), `export const presentations = [] as {slug:string;title:string;load:()=>Promise<{default:()=>null}>}[]; export function findPresentation(path: string){return presentations.find(p=>p.slug===path)}`); await rm(resolve(dir, 'src/presentations/how-to-make-a-presentation'), { recursive: true }) },
    order: async dir => { const path = resolve(dir, 'src/presentations/how-to-make-a-presentation/outline.json'); const outline = JSON.parse(await readFile(path)); await writeFile(path, JSON.stringify(outline.reverse())) },
    console: async dir => editScene(dir, "if (beat === 3) console.error('injected console failure')"),
    page: async dir => editScene(dir, "if (beat === 3) setTimeout(() => { throw new Error('injected page failure') }, 20)"),
    render: async dir => editScene(dir, "if (beat === 3) throw new Error('injected render failure')"),
    transition: async dir => { const path = resolve(dir, 'src/presentation-kit/usePresentationNav.ts'); await writeFile(path, (await readFile(path, 'utf8')).replace("if (['ArrowRight', ' ', 'PageDown'].includes(event.key))", "if ([' ', 'PageDown'].includes(event.key))")) },
  }
  async function editScene(dir, addition) {
    const path = resolve(dir, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx')
    await writeFile(path, (await readFile(path, 'utf8')).replace('  return <SceneLayer>', `  ${addition}\n  return <SceneLayer>`))
  }
  for (const [name, inject] of Object.entries(faults)) await t.test(name, async () => {
    const target = await copyApp(`fault-${name}`)
    await inject(target)
    const result = await command(['run', 'verify'], target)
    assert.notEqual(result.code, 0, result.output)
    const phase = name === 'build' ? 'build' : ['missing', 'order'].includes(name) ? 'reference' : 'render'
    assert.match(result.output, new RegExp(`FAIL ${phase}`), result.output)
    assert.doesNotMatch(result.output, /PASS verification/)
    if (phase === 'render') assert.match(result.output, new RegExp(`step ${name === 'transition' ? 1 : 2}`))
    await assertCleanup(result.output)
  })
})
