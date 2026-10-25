import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdir,readFile,writeFile,mkdir,rm } from 'node:fs/promises'
import path from 'node:path'
import { templatePath } from '../../skills/presentation/scaffold.mjs'
import { root,run } from '../harness.mjs'
async function files(dir) {const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(async e=>e.isDirectory()?(await files(path.join(dir,e.name))).map(n=>`${e.name}/${n}`):[e.name]))).flat().sort()}
test('INT-001 materialized bootstrap is complete neutral cwd-independent and byte-aligned', {timeout:180000},async()=>{
 const target=path.join(root,'.test-work',`bootstrap-${process.pid}`)
 await rm(target,{recursive:true,force:true});await mkdir(path.dirname(target),{recursive:true})
 try {
  const script=path.join(root,'skills/presentation/scaffold.mjs')
  const made=await run(process.execPath,[script,target],'/tmp');assert.equal(made.code,0,made.output)
  assert.match(templatePath('presentation'),/skills\/presentation\/templates\/presentation\//)
  const refusal=await run(process.execPath,[script,target],'/tmp');assert.notEqual(refusal.code,0);assert.match(refusal.output,/empty target/)
  const pkg=JSON.parse(await readFile(path.join(target,'package.json'),'utf8'))
  for(const dep of ['react','react-dom','motion','lucide-react'])assert.ok(pkg.dependencies[dep],dep)
  for(const dep of ['vite','@vitejs/plugin-react','typescript','@types/react','@types/react-dom','@types/node','eslint','@eslint/js','typescript-eslint','eslint-plugin-react-hooks','eslint-plugin-react-refresh','globals','playwright'])assert.ok(pkg.devDependencies[dep],dep)
  assert.doesNotMatch(JSON.stringify(pkg),/tailwind/i)
  assert.match(await readFile(path.join(target,'src/index.css'),'utf8'),/no visual defaults/)
  const canonical=await files(path.join(root,'src/presentation-kit')),copied=await files(path.join(target,'src/presentation-kit'))
  assert.deepEqual(copied,canonical)
  for(const file of canonical)assert.deepEqual(await readFile(path.join(target,'src/presentation-kit',file)),await readFile(path.join(root,'src/presentation-kit',file)),file)
  for(const file of ['verify.mjs','inspect-presentation.mjs','browser.mjs','diagnostics.mjs','reference.json'])assert.deepEqual(await readFile(path.join(target,'scripts',file)),await readFile(path.join(root,'scripts',file)),file)
  // Add another registered route to prove generic bootstrap verification enumerates all entries.
  await mkdir(path.join(target,'src/presentations/another'))
  await writeFile(path.join(target,'src/presentations/another/Talk.tsx'),"export { default } from '../welcome/Talk'\n")
  const registryFile=path.join(target,'src/presentations/index.ts')
  await writeFile(registryFile,(await readFile(registryFile,'utf8')).replace("[{ slug: 'welcome'", "[{slug:'another',title:'Another',load:()=>import('./another/Talk')},{ slug: 'welcome'"))
  const install=await run('npm',['ci','--no-audit','--no-fund'],target);assert.equal(install.code,0,install.output)
  const browser=await run('npm',['run','browser:install'],target);assert.equal(browser.code,0,browser.output)
  const verify=await run('npm',['run','verify'],target);console.log(verify.output);assert.equal(verify.code,0,verify.output);assert.match(verify.output,/PASS verification/);assert.match(verify.output,/STEP 0 PASS/);assert.match(verify.output,/STEP 1 PASS/);assert.match(verify.output,/\/another/);assert.equal([...verify.output.matchAll(/STEP \d PASS/g)].length,4)
  console.log('INT-001: dependency install; complete anchors; generic welcome route; skill-relative lookup from /tmp; full inventory + byte parity; no-framework build all passed')
 } finally {await rm(target,{recursive:true,force:true})}
})
