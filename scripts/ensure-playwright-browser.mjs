import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(root, 'package.json'))
const { chromium } = require('playwright')
if (fs.existsSync(chromium.executablePath())) process.exit(0)
const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['playwright', 'install', 'chromium'], { cwd: root, stdio: 'inherit' })
if (result.error) throw result.error
process.exit(result.status ?? 1)
