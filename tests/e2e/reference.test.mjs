import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { disposable,run,remove,assertStopped } from '../harness.mjs'
test('E2E-001 reference passes whole-app production verification with visible nine-step content and IPv4 cleanup',{timeout:180000},async()=>{
 const dir=await disposable('reference')
 try {
  const expected=JSON.parse(await readFile(path.join(dir,'scripts/reference.json'),'utf8'))
  const result=await run('npm',['run','verify'],dir);console.log(result.output);assert.equal(result.code,0,result.output);assert.match(result.output,/tsc -b && vite build/);assert.match(result.output,/PASS verification/)
  const records=[...result.output.matchAll(/STEP (\d+) PASS (\{.*\})/g)]
  assert.deepEqual(records.map(r=>Number(r[1])),[0,1,2,3,4,5,6,7,8])
  records.forEach((r,i)=>assert.deepEqual(JSON.parse(r[2]),expected.steps[i]))
  assert.match(result.output,/PREVIEW host=127\.0\.0\.1 readiness=http:\/\/127\.0\.0\.1:/);assert.match(result.output,/ROUTE http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation/);assert.doesNotMatch(result.output,/http:\/\/localhost/)
  assertStopped(assert,result.output)
 }finally{await remove(dir)}
})
