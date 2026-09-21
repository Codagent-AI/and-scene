import { execFileSync } from 'node:child_process'

execFileSync('npm', ['run', 'build'], { stdio: 'inherit' })
console.log('PASS: bootstrap build completed; add a registered presentation for browser verification.')
