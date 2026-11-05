import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, cpSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
const root=resolve('.')
function files(dir) { return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]) }
test('INT-001 materialized bootstrap works and kit is aligned',()=>{ const dir=mkdtempSync(join(tmpdir(),'and-scene-bootstrap-')); try { cpSync(join(root,'skills/presentation/templates/bootstrap'),dir,{recursive:true}); for(const path of files(join(root,'src/presentation-kit'))) assert.equal(readFileSync(path,'utf8'),readFileSync(join(dir,'src/presentation-kit',relative(join(root,'src/presentation-kit'),path)),'utf8'),path); const pkg=JSON.parse(readFileSync(join(dir,'package.json'))); for(const name of ['react','react-dom','motion','lucide-react']) assert.ok(pkg.dependencies[name]); for(const name of ['vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','playwright']) assert.ok(pkg.devDependencies[name]); assert.ok(!pkg.dependencies.tailwindcss && !pkg.devDependencies.tailwindcss); for(const args of [['ci'],['run','verify']]) { const r=spawnSync('npm',args,{cwd:dir,encoding:'utf8',timeout:180000}); assert.equal(r.status,0,r.stdout+r.stderr) } } finally { rmSync(dir,{recursive:true,force:true}) } })
