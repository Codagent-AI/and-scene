// @vitest-environment node
import { expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
it('I-1 I-3 typed payload and incomplete step contracts compile with expected errors',async()=>{
 const result=await promisify(execFile)('node',['node_modules/typescript/bin/tsc','-p','tsconfig.contract.json'],{timeout:180000})
 expect(result.stderr).toBe('')
})
