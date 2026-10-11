#!/usr/bin/env node
import { cp, mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(repository, 'skills/presentation/templates/bootstrap')
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'and-scene-bootstrap-'))
const materialized = path.join(temporaryRoot, 'app')
let activeChild
let cleanupPromise

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
    activeChild = child
    child.once('error', (error) => {
      if (activeChild === child) activeChild = undefined
      reject(error)
    })
    child.once('exit', (code, signal) => {
      if (activeChild === child) activeChild = undefined
      code === 0 ? resolve() : reject(new Error(`${command} exited with ${code ?? signal}`))
    })
  })
}

function cleanup() {
  if (!cleanupPromise) cleanupPromise = rm(temporaryRoot, { recursive: true, force: true })
  return cleanupPromise
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, async () => {
    const child = activeChild
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = new Promise((resolve) => child.once('exit', resolve))
      child.kill(signal)
      await exited
    }
    await cleanup()
    process.exit(128 + (signal === 'SIGINT' ? 2 : signal === 'SIGTERM' ? 15 : 1))
  })
}

try {
  await cp(source, materialized, { recursive: true, filter: (entry) => !['node_modules', 'dist', '.and-scene'].includes(path.basename(entry)) })
  await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--no-audit', '--no-fund'], materialized)
  await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], materialized)
  // Run the committed local verification script while cwd is outside both the
  // source repository and the materialized project to check root resolution.
  await run(process.execPath, [path.join(materialized, 'scripts/verify.mjs'), '--smoke', '--root', materialized], temporaryRoot)
  console.log('PASS: isolated bootstrap install, build, and route smoke check')
} finally {
  await cleanup()
}
