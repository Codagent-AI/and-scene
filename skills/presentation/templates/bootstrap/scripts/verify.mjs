import { runRenderVerification } from './verification-runner.mjs'

const route = process.argv[2] || '/sample'
const result = await runRenderVerification({ route })
if (!result.ok) {
  console.error(`FAIL: render check: ${result.error}`)
  process.exit(1)
}
console.log(`PASS: registered route rendered every step on 127.0.0.1 (${route})`)
console.log('PASS: verification complete')
