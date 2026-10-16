#!/usr/bin/env node
// CLI for the presentation skill. Run it by its path next to SKILL.md; the cwd does not matter.
//   detect [dir]                       JSON: target, anchors, missing, presentations, needsConfirmation
//   scaffold <target> [--only a,b] [--install]   copy missing anchors (build, kit, index)
//   create <target> <slug> <title>     new presentation folder + registry line
//   list <target>                      registered presentations
import { createPresentation, detect, detectAnchors, listPresentations, scaffold } from './lib.mjs'

const [cmd, ...args] = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i < 0 ? undefined : args[i + 1]
}
try {
  let out
  if (cmd === 'detect') out = detect(args[0] ?? process.cwd())
  else if (cmd === 'scaffold') {
    const target = args[0]
    if (!target) throw new Error('usage: scaffold <target> [--only build,kit,index] [--install]')
    const anchors = detectAnchors(target)
    const only = flag('--only')?.split(',') ?? Object.keys(anchors).filter((k) => !anchors[k])
    out = scaffold(target, only, { install: args.includes('--install') })
  } else if (cmd === 'create') {
    if (args.length < 3) throw new Error('usage: create <target> <slug> <title>')
    out = createPresentation(args[0], args[1], args.slice(2).join(' '))
  } else if (cmd === 'list') out = listPresentations(args[0] ?? process.cwd())
  else throw new Error('usage: presentation.mjs detect|scaffold|create|list ...')
  console.log(JSON.stringify(out, null, 2))
} catch (err) {
  console.error(`error: ${err.message}`)
  process.exitCode = 1
}
