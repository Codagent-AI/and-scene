#!/usr/bin/env node
// Usage (run with the path to this skill's directory, from any working directory):
//   node <skill>/scripts/cli.mjs detect   [--project DIR]
//   node <skill>/scripts/cli.mjs scaffold [--project DIR] [--target DIR] [--install]
//   node <skill>/scripts/cli.mjs create   --slug SLUG --title TITLE [--project DIR] [--target DIR]
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { createPresentation, resolveTarget, scaffold, slugify } from './lib.mjs'

const [command, ...rest] = process.argv.slice(2)
const { values } = parseArgs({
  args: rest,
  options: {
    project: { type: 'string', default: process.cwd() },
    target: { type: 'string' },
    slug: { type: 'string' },
    title: { type: 'string' },
    install: { type: 'boolean', default: false },
  },
})

function main() {
  const project = path.resolve(values.project)
  const resolved = resolveTarget(project)
  const target = values.target ? path.resolve(values.target) : resolved.target
  if (command === 'detect') {
    console.log(JSON.stringify(resolved, null, 2))
  } else if (command === 'scaffold') {
    const result = scaffold(target)
    console.log(JSON.stringify({ target, ...result }, null, 2))
    if (values.install) {
      const install = spawnSync('npm', ['install'], { cwd: target, stdio: 'inherit' })
      if (install.status !== 0) throw new Error('npm install failed')
    }
  } else if (command === 'create') {
    if (!values.title) throw new Error('--title is required')
    console.log(JSON.stringify(createPresentation(target, { slug: values.slug ?? slugify(values.title), title: values.title }), null, 2))
  } else {
    throw new Error('usage: cli.mjs <detect|scaffold|create> [options]')
  }
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
