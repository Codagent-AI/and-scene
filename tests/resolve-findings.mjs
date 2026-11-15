// One bounded targeted run for the audited code paths; deliberately excludes
// unchanged grouped-host, composition, sample-data, and registry unit cases.
import { spawn } from 'node:child_process'
import { writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { record } from './evidence.mjs'
const evidence = process.env.EVIDENCE_DIR
if (!evidence) throw new Error('EVIDENCE_DIR is required')
async function run(args, file) {
  let output = ''
  const exit = await new Promise((ok, fail) => {
    const child = spawn(args[0], args.slice(1), { env: { ...process.env, EVIDENCE_PREFIX: 'resolve-' } })
    child.stdout.on('data', bytes => { output += bytes; process.stdout.write(bytes) })
    child.stderr.on('data', bytes => { output += bytes; process.stderr.write(bytes) })
    child.once('error', fail); child.once('close', ok)
  })
  await writeFile(join(evidence, file), `Command: ${args.join(' ')}\n${output}\nExit: ${exit}\n`)
  return { output, exit }
}
for (const id of [1,2,3,4,5,8,10,11,12,13,14,15,16,17,18,19,20,21,22,36,37,41,42,47,48,49]) {
  const file = id === 3 ? 'tests/types.test.ts' : id === 41 ? 'tests/scripts.test.ts' : [37,47,48,49].includes(id) ? 'tests/diagnostics.test.ts' : 'tests/kit.test.tsx'
  const log = `resolve-I-${id}.log`
  const result = await run(['npm','test','--',file,'-t',`I-${id} `,'--reporter=verbose'], log)
  const tests = result.output.split('\n').filter(line => line.includes('✓') && line.includes(`I-${id} `)).map(line => line.trim())
  const checklist = (await readFile('openspec/changes/create-and-scene/checklist.md','utf8')).split('\n')
  const code = checklist.find(line => line.startsWith(`| I-${id} |`)).split('|')[5].trim()
  await record([id], code, `\`${log}\` — targeted checks: ${tests.join('; ') || 'no passing named check'}; exit ${result.exit}.`, result.exit === 0 && tests.length ? 'verified' : 'failed')
  if (result.exit) { process.exitCode = result.exit; break }
}
if (!process.exitCode) {
  const result = await run(['node','--test','--test-concurrency=1','--test-name-pattern=^(INT-001|INT-002|E2E-001|E2E-002)','tests/browser.test.mjs'], 'resolve-browser.log')
  if (result.exit) process.exitCode = result.exit
}
if (!process.exitCode) {
  for (const [args, file] of [[['npm','run','lint'],'resolve-lint.log'], [['npm','run','build'],'resolve-build.log']]) {
    const result = await run(args, file)
    if (result.exit) { process.exitCode = result.exit; break }
  }
}
if (!process.exitCode) {
  await record([52], '`package.json`; `scripts/sync-templates.mjs`; `tests/resolve-findings.mjs`; `tests/browser.test.mjs`', '`resolve-INT-001-contracts.log` — INT-001 compares kit and shared script bytes, external install/build/render; `resolve-browser.log` — named INT-001, INT-002, E2E-001, E2E-002 affected checks pass; `resolve-I-*.log` — each affected named unit check run alone; `resolve-lint.log` and `resolve-build.log` exit zero. Test-script separation inspected in I-52-inspection.log; pre-targeted maintainability review in resolve-maintainability.log.')
  const result = await run(['openspec','validate','--type','change','create-and-scene'], 'resolve-openspec.log')
  if (result.exit) process.exitCode = result.exit
}
