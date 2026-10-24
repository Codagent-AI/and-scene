#!/usr/bin/env node
// Reports which scaffold anchors exist and where the presentation app belongs.
//   node detect-scaffold.mjs [projectDir] [--target root|presentations]
import { detect } from './lib.mjs'

const args = process.argv.slice(2)
const t = args.indexOf('--target')
const target = t >= 0 ? args.splice(t, 2)[1] : undefined
console.log(JSON.stringify(detect(args[0] ?? process.cwd(), target), null, 2))
