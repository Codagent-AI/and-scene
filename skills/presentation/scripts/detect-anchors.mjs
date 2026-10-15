#!/usr/bin/env node
// Usage: node <skill>/scripts/detect-anchors.mjs [dir]
// Prints JSON: the resolved scaffold target, the three contract anchors (buildSetup, sceneKit,
// presentationIndex), what is missing, and whether the user must confirm before writing.
import path from 'node:path'
import { resolveTarget } from './lib.mjs'

const result = resolveTarget(path.resolve(process.argv[2] ?? process.cwd()))
console.log(JSON.stringify(result, null, 2))
