#!/usr/bin/env node
// Prints where the presentation app belongs and which contract anchors are missing, as JSON.
// Usage: node detect-target.mjs [project-dir]
import { resolveTarget } from './lib.mjs'

console.log(JSON.stringify(resolveTarget(process.argv[2] ?? process.cwd()), null, 2))
