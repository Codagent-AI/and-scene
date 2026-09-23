import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { referenceOutline, validateReferenceOutline } from './verification-contract.mjs'
import { runRenderVerification } from './verification-runner.mjs'

const root = process.cwd()
const build = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
const buildCode = await new Promise((resolve) => build.once('close', resolve))
if (buildCode !== 0) {
  console.error(`FAIL: build check failed (exit ${buildCode})`)
  process.exit(1)
}
console.log('PASS: whole application build')

try {
  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const steps = await readFile(new URL('../src/presentations/how-to-make-a-presentation/steps.tsx', import.meta.url), 'utf8')
  const errors = []
  const route = "slug: 'how-to-make-a-presentation'"
  if (!registry.includes(route) || !registry.includes("import('./how-to-make-a-presentation/Talk')")) errors.push('reference sample is not registered and reachable')
  let cursor = -1
  for (const [, title, caption] of referenceOutline) {
    const titleAt = steps.indexOf(title, cursor + 1)
    const captionAt = steps.indexOf(caption, titleAt + title.length)
    if (titleAt < 0 || captionAt < 0) errors.push(`sample outline missing or out of order near "${title}"`)
    cursor = captionAt
  }
  const stepCount = (steps.match(/id: `how-to-make-a-presentation-\$\{index \+ 1\}`/g) || []).length
  if (stepCount !== 1 || !steps.includes('outline.map(')) errors.push('sample does not generate its ordered nine-step scene')
  if (errors.length) throw new Error(errors.join('; '))
  console.log('PASS: registered canonical nine-step reference outline')
} catch (error) {
  console.error(`FAIL: reference sample check: ${error.message}`)
  process.exit(1)
}

const outcome = await runRenderVerification({ route: '/how-to-make-a-presentation', expectedSteps: 9 })
if (!outcome.ok) {
  console.error(`FAIL: render check: ${outcome.error}`)
  process.exit(1)
}
console.log('PASS: production browser rendered all 9 steps on 127.0.0.1')
console.log('PASS: verification complete')
