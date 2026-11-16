import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { delimiter, join, resolve, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:net'
const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const evidence = process.env.EVIDENCE_DIR
const artifacts = join(root, 'node_modules/.integration')
const within = (parent, path) => path === parent || path.startsWith(parent + sep)
await mkdir(artifacts, { recursive: true })
async function output(name, text) {
  if (evidence) { await mkdir(evidence, { recursive: true }); await writeFile(join(evidence, `${process.env.EVIDENCE_PREFIX ?? ''}${name}.log`), text) }
}
async function run(cwd, args, { ok = true } = {}) {
  return new Promise((resolveResult, reject) => {
    const env = { ...process.env, NO_COLOR: '1' }
    if (!within(root, resolve(cwd))) {
      env.NODE_PATH = ''
      env.PATH = env.PATH.split(delimiter).filter(path => !within(root, resolve(path))).join(delimiter)
    }
    const child = spawn('npm', args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let text = ''
    child.stdout.on('data', chunk => { text += chunk })
    child.stderr.on('data', chunk => { text += chunk })
    child.on('error', reject)
    child.on('exit', code => (ok && code !== 0) ? reject(new Error(`${args.join(' ')} exited ${code}\n${text}`)) : resolveResult({ text, code }))
  })
}
async function copyProject(prefix) {
  const dir = await mkdtemp(join(artifacts, prefix))
  for (const name of ['src', 'scripts', 'package.json', 'package-lock.json', 'index.html', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', '.npmrc']) await cp(join(root, name), join(dir, name), { recursive: true })
  await symlink(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
  // Only dependencies are shared; source/config files are independently copied.
  return dir
}
async function files(dir) {
  const result = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name)
    if (entry.isDirectory()) for (const nested of await files(file)) result.push(join(entry.name, nested))
    else result.push(entry.name)
  }
  return result
}
async function assertStopped(text) {
  const browsers = [...text.matchAll(/chromium started pid=(\d+)/g)]
  const previews = [...text.matchAll(/preview ready http:\/\/127\.0\.0\.1:(\d+) pid=(\d+)/g)]
  assert.equal(browsers.length, previews.length, 'each preview run must expose its launched Chromium PID')
  for (const [, pid] of browsers) {
    assert.match(text, new RegExp(`chromium stopped pid=${pid}`))
    assert.throws(() => process.kill(Number(pid), 0), { code: 'ESRCH' })
    console.log(`OS cleanup verified: Chromium pid=${pid} no longer exists`)
  }
  for (const match of text.matchAll(/preview ready http:\/\/127\.0\.0\.1:(\d+) pid=(\d+)/g)) {
    assert.match(text, new RegExp(`preview stopped pid=${match[2]}`))
    assert.throws(() => process.kill(Number(match[2]), 0), { code: 'ESRCH' })
    const server = createServer()
    await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(Number(match[1]), '127.0.0.1', resolveListen) })
    await new Promise(resolveClose => server.close(resolveClose))
  }
}
test('INT-001 materialized bootstrap is complete and style-neutral', { timeout: 240000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'and-scene-bootstrap-'))
  try {
    assert.ok(!within(await realpath(root), await realpath(dir)), 'bootstrap must be outside the source repository')
    const { scaffold, bootstrapDirectory } = await import('../skills/presentation/scripts/scaffold.mjs')
    assert.ok(bootstrapDirectory.startsWith(root))
    // Resolve template via installed skill module, independent of process.cwd().
    const before = process.cwd(); process.chdir(dir)
    try { await scaffold(dir) } finally { process.chdir(before) }
    await assert.rejects(scaffold(dir), /non-empty/)
    const kitFiles = await files(join(root, 'src/presentation-kit'))
    for (const file of kitFiles) assert.deepEqual(await readFile(join(dir, 'src/presentation-kit', file)), await readFile(join(root, 'src/presentation-kit', file)), file)
    for (const file of ['browser.mjs', 'verify.mjs', 'diagnostics.mjs', 'inspect-presentation.mjs']) assert.deepEqual(await readFile(join(dir, 'scripts', file)), await readFile(join(root, 'scripts', file)), file)
    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
    const required = ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']
    for (const dep of required) assert.ok(pkg.dependencies?.[dep] || pkg.devDependencies?.[dep], dep)
    assert.ok(!JSON.stringify(pkg).toLowerCase().includes('tailwind'))
    for (const file of ['src/main.tsx', 'src/presentations/index.ts', 'src/presentation-kit/Presentation.tsx']) assert.ok((await readFile(join(dir, file))).length)
    const css = await readFile(join(dir, 'src/index.css'), 'utf8')
    assert.equal(css.replace(/\/\*[\s\S]*?\*\//g, '').trim(), '')
    for (const file of kitFiles) assert.doesNotMatch(await readFile(join(dir, 'src/presentation-kit', file), 'utf8'), /(?:backgroundColor|fontFamily|boxShadow|borderRadius)\s*:/)
    const installed = await run(dir, ['ci', '--ignore-scripts'])
    for (const dep of required) assert.ok(within(await realpath(dir), await realpath(join(dir, 'node_modules', dep))), `${dep} must be installed inside external app`)
    const requireFromApp = createRequire(join(dir, 'package.json'))
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', 'typescript', 'eslint', 'playwright']) assert.ok(within(await realpath(dir), await realpath(requireFromApp.resolve(dep))), `${dep} resolved outside external app`)
    const linted = await run(dir, ['run', 'lint'])
    const verified = await run(dir, ['run', 'verify', '--', '--settle', '30'])
    assert.match(verified.text, /PASS verification/)
    await assertStopped(verified.text)
    const registryPath = join(dir, 'src/presentations/index.ts')
    await writeFile(registryPath, (await readFile(registryPath, 'utf8')).replace("slug: 'example'", "slug: 'how-to-make-a-presentation'"))
    const arbitrarySlug = await run(dir, ['run', 'verify', '--', '--slug', 'how-to-make-a-presentation', '--settle', '30'])
    assert.match(arbitrarySlug.text, /PASS verification/)
    await assertStopped(arbitrarySlug.text)
    await output('INT-001', `INT-001: external app ${dir}; sanitized PATH and NODE_PATH; declared dependencies physically installed and runtime/build imports resolve inside app; all anchors and dependencies present; kit and four browser scripts byte-aligned; style-neutral CSS; caller-independent templates; non-empty overwrite rejected.\n${installed.text}\n${linted.text}\n${verified.text}\nArbitrary generated slug without repository reference metadata:\n${arbitrarySlug.text}`)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
test('INT-002 screenshot helper captures settled artifacts and advisory diagnostics', { timeout: 180000 }, async () => {
  const dir = await copyProject('inspection-')
  try {
    await mkdir(join(dir, 'src/presentations/diagnostic'))
    await writeFile(join(dir, 'src/presentations/diagnostic/Talk.tsx'), `import { Presentation } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
import { useEffect, useState } from 'react'
import './test.css'
function Scene({payload}: SceneProps<number>) {
  const [settled,setSettled] = useState(0)
  useEffect(() => { const timer=setTimeout(()=>setSettled(payload),80); return ()=>clearTimeout(timer) },[payload])
  return <div data-settled={settled}><span className="collision a">unmarked A</span><span className="collision b">unmarked B</span><div className="nested">parent text<span>descendant text</span></div><div className="normal">normal parent<span>normal child</span></div><button className="labelled"><span>control label</span></button><div data-presentation-allow-overlap=""><span className="allowed a">allowed A</span><span className="allowed b">allowed B</span><div className="allowed-nested">allowed parent<span>allowed descendant</span></div></div></div>
}
const steps: Step<number>[] = [0,1,2].map(i=>({id:String(i),era:String(i),title:'Diagnostic '+i,caption:'Diagnostic caption '+i,Scene,groupKey:'diagnostics',payload:i}))
export default function Talk(){return <div className="diagnostic"><Presentation title="Diagnostic" steps={steps}/></div>}
`)
    await writeFile(join(dir, 'src/presentations/diagnostic/test.css'), `.collision,.allowed {position:absolute;left:120px;top:100px}.allowed {top:200px}.diagnostic [data-presentation-attribution] a {font-size:8px;color:rgb(0,0,238);text-decoration:underline}.diagnostic [data-presentation-progress], .diagnostic [data-presentation-toc-entry] {color:black;background:white;border:1px solid black;font-weight:400;box-shadow:none;opacity:1;transform:none;outline:none;text-decoration:none}.nested,.normal {position:absolute;left:120px;top:145px}.nested span,.allowed-nested span {position:absolute;left:0;top:0}.normal {left:400px}.normal span {display:block}.labelled {position:absolute;left:400px;top:250px}.allowed-nested {position:absolute;left:120px;top:240px}.diagnostic [data-presentation-progress]:nth-of-type(2),.diagnostic [data-presentation-toc-entry]:first-child {background:black;color:white}`)
    const registry = join(dir, 'src/presentations/index.ts')
    await writeFile(registry, (await readFile(registry, 'utf8')).replace('export const presentations: PresentationEntry[] = [', `export const presentations: PresentationEntry[] = [\n{slug:'diagnostic',title:'Diagnostic',load:()=>import('./diagnostic/Talk')},`))
    // Capture-time instrumentation asserts settled DOM state without viewing images.
    const inspectionFile = join(dir, 'scripts/inspect-presentation.mjs')
    await writeFile(inspectionFile, (await readFile(inspectionFile, 'utf8')).replace('const measurements = await page.evaluate(measurePage)', `if (await page.locator('[data-settled]').getAttribute('data-settled') !== String(index)) throw new Error('capture before fixture settled'); console.log('settled fixture confirmed step ' + index); const measurements = await page.evaluate(measurePage)`))
    const result = await run(dir, ['run', 'inspect', '--', 'diagnostic', '--settle', '200'])
    assert.equal(result.code, 0)
    assert.match(result.text, /browser viewport 1440x900/)
    const report = JSON.parse(await readFile(join(dir, 'artifacts/inspection/diagnostic/1440x900/report.json'), 'utf8'))
    assert.equal(report.length, 3)
    for (let i = 1; i < report.length; i++) assert.ok(report[i].capturedAt - report[i - 1].capturedAt >= 200)
    for (const step of report) {
      const png = await readFile(join(dir, step.file))
      assert.deepEqual([...png.subarray(0, 8)], [137,80,78,71,13,10,26,10])
      assert.equal(png.readUInt32BE(16), 1440); assert.equal(png.readUInt32BE(20), 900)
      assert.match(step.file, new RegExp(`step-0${step.index+1}\\.png$`))
      assert.ok(step.warnings.some(w=>w.includes('unmarked A') && w.includes('unmarked B')))
      assert.ok(step.warnings.some(w=>w.includes('parent text') && w.includes('descendant text')), 'ancestor/descendant text collision must warn')
      assert.ok(!step.warnings.some(w=>w.includes('allowed A') || w.includes('allowed B') || w.includes('allowed parent') || w.includes('allowed descendant')))
      assert.ok(!step.warnings.some(w=>w.includes('normal parent') && w.includes('normal child')))
      assert.ok(!step.warnings.some(w=>w.includes('control label')), 'a control and its own nested label must not be double-counted')
      for (const name of ['progress', 'toc-entry']) assert.equal(step.warnings.some(w=>w.includes(`indistinct active ${name}`)), step.index !== 0, 'compare active with every inactive peer, not only the differently styled first control')
      assert.ok(step.warnings.some(w=>w.includes('unpolished attribution')))
    }
    await assertStopped(result.text)
    await output('INT-002', `INT-002: three valid 1440x900 PNGs, configured settling verified against asynchronously updated fixture, warning-only zero exit, unmarked sibling and ancestor text collisions reported, allowed subtree exempt, ordinary nested control label deduplicated, heterogeneous active progress/ToC comparisons and attribution diagnostics confirmed.\n${result.text}\n${JSON.stringify(report,null,2)}`)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
test('E2E-001 reference presentation passes production verification', { timeout: 180000 }, async () => {
  const result = await run(root, ['run', 'verify'])
  assert.equal(result.code, 0)
  assert.match(result.text, /PASS verification/)
  for (let i=0;i<9;i++) assert.match(result.text, new RegExp(`step ${i} rendered`))
  assert.match(result.text, /preview ready http:\/\/127\.0\.0\.1:/)
  assert.match(result.text, /probe=http:\/\/127\.0\.0\.1:/)
  assert.match(result.text, /browser URL http:\/\/127\.0\.0\.1:/)
  await assertStopped(result.text)
  await output('E2E-001', result.text)
})
test('E2E-002 verification faults are actionable and clean up processes', { timeout: 360000 }, async t => {
  const faults = {
    build: async dir => writeFile(join(dir,'src/fault.ts'), 'export const value: number = "invalid"'),
    missing: async dir => { await rm(join(dir,'src/presentations/how-to-make-a-presentation'),{recursive:true}); const p=join(dir,'src/presentations/index.ts'); await writeFile(p,(await readFile(p,'utf8')).replace(/export const presentations:[\s\S]*/, 'export const presentations: PresentationEntry[] = []\n')) },
    order: async dir => { const p=join(dir,'src/presentations/how-to-make-a-presentation/outline.json'); const data=JSON.parse(await readFile(p,'utf8')); data.reverse(); await writeFile(p,JSON.stringify(data)) },
    console: async dir => inject(dir, `let fired=false;setInterval(()=>{if(!fired && document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')==='1'){fired=true; console.error('injected console failure')}},10)`),
    pageerror: async dir => inject(dir, `let fired=false;setInterval(()=>{if(!fired && document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')==='1'){fired=true; throw new Error('injected page failure')}},10)`),
    transition: async dir => inject(dir, `window.addEventListener('keydown',e=>{if(e.key==='ArrowRight')e.stopImmediatePropagation()},true)`),
  }
  for (const [name, fault] of Object.entries(faults)) await t.test(name, async () => {
    const dir = await copyProject(`fault-${name}-`)
    try {
      await fault(dir)
      const result = await run(dir,['run','verify','--','--settle','60'],{ok:false})
      await output(`E2E-002-${name}`, result.text)
      assert.notEqual(result.code,0)
      assert.doesNotMatch(result.text,/PASS verification/)
      assert.match(result.text,new RegExp(`FAIL ${name==='build'?'build':['missing','order'].includes(name)?'reference':'render'}`))
      if (['console','pageerror','transition'].includes(name)) assert.match(result.text,/step 1/)
      if (name==='console') assert.match(result.text,/console: injected console failure/)
      if (name==='pageerror') assert.match(result.text,/pageerror: injected page failure/)
      await assertStopped(result.text)
    } finally { await rm(dir,{recursive:true,force:true}) }
  })
  await output('E2E-002', 'E2E-002: build, missing, order, console, pageerror, and transition subtests assert nonzero outcomes, failed phase, destination step, no false success, terminated Chromium and preview PIDs, and released port. See E2E-002-<fault>.log for each command.\n')
})
async function inject(dir, source) {
  const path=join(dir,'src/main.tsx')
  await writeFile(path,source+'\n'+await readFile(path,'utf8'))
}
