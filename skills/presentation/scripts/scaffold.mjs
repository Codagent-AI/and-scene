#!/usr/bin/env node
// Scaffolds whatever presentation infrastructure is missing.
//   node scaffold.mjs [projectDir] [--target root|presentations] [--confirmed] [--no-install] [--no-starter]
// Exit codes: 0 done (or nothing to do), 2 needs the user's confirmation first.
import { detect, scaffold } from './lib.mjs'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  if (i >= 0) args.splice(i, 1)
  return i >= 0
}
const confirmed = flag('--confirmed')
const install = !flag('--no-install')
const starter = !flag('--no-starter')
const t = args.indexOf('--target')
const target = t >= 0 ? args.splice(t, 2)[1] : undefined
const plan = detect(args[0] ?? process.cwd(), target)

if (plan.missing.length === 0) {
  console.log(JSON.stringify({ ...plan, action: 'none' }, null, 2))
} else if (plan.needsConfirmation && !confirmed) {
  console.log(JSON.stringify({ ...plan, action: 'confirm' }, null, 2))
  console.error(
    `Non-empty project: would scaffold [${plan.missing.join(', ')}] into ${plan.appDir}. ` +
      'Tell the user this target, and re-run with --confirmed once they approve.',
  )
  process.exitCode = 2
} else {
  const report = scaffold(plan.appDir, { install, starter })
  console.log(JSON.stringify({ ...plan, action: 'scaffolded', report }, null, 2))
}
