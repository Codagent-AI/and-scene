import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { loadReferenceSteps } from './load-reference-steps.mjs'
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
  const steps = await loadReferenceSteps(root)
  const errors = []
  const registryEntry = "slug: 'how-to-make-a-presentation'"
  if (!registry.includes(registryEntry) || !registry.includes("import('./how-to-make-a-presentation/Talk')")) errors.push('reference sample is not registered and reachable')
  errors.push(...validateReferenceOutline(steps))
  if (errors.length) throw new Error(errors.join('; '))
  console.log('PASS: registered canonical nine-step reference outline')
} catch (error) {
  console.error(`FAIL: reference sample check: ${error.message}`)
  process.exit(1)
}

const outcome = await runRenderVerification({ route: '/how-to-make-a-presentation', expectedSteps: referenceOutline.length })
if (!outcome.ok) {
  console.error(`FAIL: render check: ${outcome.error}`)
  process.exit(1)
}
console.log(`PASS: production browser rendered all ${referenceOutline.length} steps on 127.0.0.1`)
console.log('PASS: verification complete')
