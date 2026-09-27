import assert from 'node:assert/strict';
import {controlledCall,validateControl,validateHandoff,identityFields,handoffSchema} from '../integrations/kujo-ability/bin/controlled-ability.mjs';
const ref='sha256:'+'a'.repeat(64),context={rpc_request_id:'rpc-1',mcp_request_id:'request-1',mcp_invocation_id:'invocation-1',tool_name:'publish'};
let admitted=0,executed=0,recorded=0;
const control={server_id:'server',session_id:'session',admit:async()=>{admitted++;return{ok:true,ability_invocation_id:'application-1',idempotency_key:'key'};},record:async(a,c,data,outcome)=>{recorded++;return{ok:true,ref};}};
validateControl(control);assert.throws(()=>validateControl({}));
for(const field of ['_kujo','dispatch_run_id','dispatch_step_id','dispatch_attempt_id','dispatch_effect_id','assurance_profile','profile','verifier','verifier_id','config_revision','trusted_root','evidence_root','evidence_path','assurance_ref','principal','tenant','authorize_replay']){
 const result=await controlledCall(control,context,{[field]:'forged'},async()=>{executed++;});assert.equal(result.outcome,'not_admitted');
}
assert.equal(admitted,0);assert.equal(executed,0);
for(const bad of [null,7,'id\n','a'.repeat(129)])assert.equal((await controlledCall(control,{...context,rpc_request_id:bad},{},()=>{})).outcome,'not_admitted');
assert.equal((await controlledCall(control,context,{body:'a'.repeat(4097)},()=>{})).outcome,'not_admitted');
const transport=await controlledCall(control,context,{},()=>{throw Error('PRIVATE_RAW_APPLICATION_ERROR');});assert.equal(transport.outcome,'transport_failed');assert.equal(transport.completion,'uncertain');assert(!JSON.stringify(transport).includes('PRIVATE_RAW'));
const app=await controlledCall(control,context,{},()=>{throw Object.assign(Error('PRIVATE_RAW_APPLICATION_ERROR'),{status:500,body:{code:'application_failure'}});});assert.equal(app.outcome,'application_failed');
const failed=await controlledCall(control,context,{},()=>({receipt:{status:'failed',result:{private:'PRIVATE_RAW_APPLICATION_ERROR'}}}));assert.equal(failed.outcome,'receipt_failed');assert(!JSON.stringify(failed).includes('PRIVATE_RAW'));
const successful=await controlledCall(control,context,{},()=>({receipt:{status:'succeeded',result:{private:'PRIVATE_RAW_APPLICATION_ERROR'}}}));assert.equal(successful.ok,true);assert(!JSON.stringify(successful).includes('PRIVATE_RAW'));
const noStore=await controlledCall({...control,record:()=>{throw Error('PRIVATE_RAW');}},context,{},()=>({}));assert.equal(noStore.code,'mcp_evidence_unavailable');
const h={schema:handoffSchema,...Object.fromEntries(identityFields.map(k=>[k,'id-1'])),definition_digest:'b'.repeat(64),outcome:'transport_failed',receipt_id:null,receipt_ref:null,execution_result_ref:ref,assurance_ref:null,transaction_sha256:'c'.repeat(64)};
assert(validateHandoff(h));for(const patch of [{schema:'agents-sdk.ability-handoff/v1alpha1'},{input:'private'},{outcome:'verified'},{receipt_ref:'../../secret'},{assurance_ref:'https://secret.invalid'},{receipt_id:'orphan'},{mcp_invocation_id:'id\n'},{rpc_request_id:1},{tool_name:'x'.repeat(4097)}])assert(!validateHandoff({...h,...patch}));
console.log('Controlled MCP callbacks, trust isolation, failure distinctions, privacy and bounded handoff passed');
// Framing bounds are exercised in an actual fresh STDIO process without a gateway.
const {spawn}=await import('node:child_process');
const {pathToFileURL}=await import('node:url');
const bridge=pathToFileURL(process.cwd()+'/integrations/kujo-ability/bin/kujo-ability-mcp.mjs').href;
async function wire(bytes){
 const code=`import {startAbilityMcp} from ${JSON.stringify(bridge)}; startAbilityMcp({control:{server_id:'test',session_id:'session',admit:()=>{throw Error('must not reach admission')},record:()=>{throw Error('must not record')}}});`;
 const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['pipe','pipe','pipe']});let output='',error='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>error+=d);
 const done=new Promise(resolve=>child.once('exit',resolve));const timeout=setTimeout(()=>child.kill(),5000);child.stdin.on('error',()=>{});child.stdin.end(bytes);await done;clearTimeout(timeout);assert.equal(error,'');return output.trim().split('\n').map(JSON.parse);
}
assert.equal((await wire('x'.repeat(8193)))[0].error.code,-32600);
assert.equal((await wire('null\n'))[0].error.code,-32600);
assert.equal((await wire('{invalid}\n'))[0].error.code,-32700);
assert.equal((await wire(Buffer.from([0xff,0x0a])))[0].error.code,-32700);
console.log('Controlled STDIO incomplete-line bounds, malformed request and UTF-8 process tests passed');
