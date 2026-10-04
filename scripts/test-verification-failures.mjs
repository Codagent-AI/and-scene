import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const project = resolve(new URL('..', import.meta.url).pathname)
const temp = await mkdtemp(join(tmpdir(), 'and-scene-verification-'))
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const inputPaths = ['index.html', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'src', 'scripts', 'public']

async function makeCopy(name) {
  const target = join(temp, name)
  await mkdir(target)
  for (const path of inputPaths) await cp(join(project, path), join(target, path), { recursive: true })
  await symlink(join(project, 'node_modules'), join(target, 'node_modules'), 'junction')
  return target
}
async function run(target) {
  return await new Promise((resolveRun, reject) => {
    const child = spawn(npm, ['run', 'verify'], { cwd: target, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.once('error', reject)
    child.once('exit', (code) => resolveRun({ code: code ?? 1, output }))
  })
}
async function fault(name, inject, expected) {
  const target = await makeCopy(name)
  await inject(target)
  const result = await run(target)
  if (result.code === 0) throw new Error(`${name}: verification unexpectedly passed\n${result.output}`)
  if (!expected.test(result.output)) throw new Error(`${name}: failure was not actionable\n${result.output}`)
  console.log(`PASS: ${name} failed with the expected diagnostic`)
}

try {
  await fault('missing-sample', async (target) => {
    const file = join(target, 'src/presentations/index.ts')
    const text = await readFile(file, 'utf8')
    await writeFile(file, text.replace(/\n\s*\{ slug: 'how-to-make-a-presentation',[^\n]+\n/, '\n'))
  }, /FAIL: reference sample is missing/)
  await fault('build-failure', async (target) => {
    const file = join(target, 'src/presentations/how-to-make-a-presentation/steps/index.tsx')
    await writeFile(file, `${await readFile(file, 'utf8')}\nconst injectedBuildError: number = 'not a number'\n`)
  }, /FAIL: build failed/)
  await fault('browser-error', async (target) => {
    const file = join(target, 'src/presentations/how-to-make-a-presentation/steps/index.tsx')
    const text = await readFile(file, 'utf8')
    await writeFile(file, text.replace('function Scene({ payload: { beat } }: { payload: Payload }) {', "function Scene({ payload: { beat } }: { payload: Payload }) {\n  if (beat === 3) console.error('injected browser console failure')"))
  }, /FAIL: render \/how-to-make-a-presentation at step 4:.*injected browser console failure/s)
  await fault('stalled-transition', async (target) => {
    const file = join(target, 'src/presentation-kit/usePresentationNav.ts')
    const text = await readFile(file, 'utf8')
    await writeFile(file, text.replace('value + 1', 'value'))
  }, /FAIL: render \/how-to-make-a-presentation at step 2:.*Timeout/s)
} finally {
  await rm(temp, { recursive: true, force: true })
}
