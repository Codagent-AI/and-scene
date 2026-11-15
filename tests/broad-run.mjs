import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { record } from './evidence.mjs'
const evidence = process.env.EVIDENCE_DIR
if (!evidence) throw new Error('EVIDENCE_DIR is required')
await mkdir(evidence, { recursive: true })
async function run(args, file) {
  let output = ''
  const code = await new Promise((ok, fail) => {
    const p = spawn(args[0], args.slice(1), { stdio: ['ignore', 'pipe', 'pipe'], env: process.env })
    p.stdout.on('data', b => { output += b; process.stdout.write(b) })
    p.stderr.on('data', b => { output += b; process.stderr.write(b) })
    p.once('error', fail); p.once('close', ok)
  })
  await writeFile(join(evidence, file), `Command: ${args.join(' ')}\n${output}\nExit: ${code}\n`)
  return { code, output }
}
const unit = await run(['npm', 'test', '--', '--reporter=verbose'], 'unit-final.log')
for (const id of [1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,20,21,22,30,36,37,39,40,41,42,47,48,49]) {
  const line = unit.output.split('\n').find(line => line.includes(`I-${id} `) && line.includes('✓'))
  if (line) await record([id], '`src/presentation-kit/`; `tests/kit.test.tsx`; `tests/types.test.ts`; `tests/scripts.test.ts`; `tests/diagnostics.test.ts`', `\`unit-final.log\` — named test: ${line.trim()}`)
  else await record([id], 'See implementation and unit tests', '`unit-final.log` — named test did not pass', 'failed')
}
if (unit.code) process.exitCode = unit.code
else {
  const browser = await run(['npm', 'run', 'test:browser'], 'browser-final.log')
  if (browser.code) process.exitCode = browser.code
}
