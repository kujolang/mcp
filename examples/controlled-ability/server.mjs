// Operator-owned local embedding. No module/path/configuration comes from JSON-RPC.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {startAbilityMcp} from '../../integrations/kujo-ability/bin/kujo-ability-mcp.mjs';
import {validateHandoff,handoffSchema} from '../../integrations/kujo-ability/bin/controlled-ability.mjs';
const [root,attempt,mode='run']=process.argv.slice(2);
const read=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));
const config=read('config.json'),invocation=read('invocation.json'),definition=read('definition.json');
const ticket=mode==='standalone'?null:read('mcp-ticket-'+attempt+'.json');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const json=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(json).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+json(x[k])).join(',')+'}';
const ensure=x=>{if(!x)throw Error('host binding rejected');};
function writeOnce(name,raw){const fd=fs.openSync(path.join(root,name),fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_WRONLY|fs.constants.O_NOFOLLOW,0o600);try{fs.writeFileSync(fd,raw);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}const dir=fs.openSync(path.dirname(path.join(root,name)),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}}
function store(raw){const digest=sha(raw),name='artifacts/'+digest+'.json';try{writeOnce(name,raw);}catch(e){if(e.code!=='EEXIST')throw e;const fd=fs.openSync(path.join(root,name),fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{ensure(fs.readFileSync(fd,'utf8')===raw);}finally{fs.closeSync(fd);}}return 'sha256:'+digest;}
function gateway(mode){const r=spawnSync(config.runtime,['run','examples/application-assurance/gateway.kujo',root,mode,'portable-v1'],{cwd:config.cwd,env:{ABILITY_GATEWAY_SESSION:process.env.ABILITY_GATEWAY_SESSION||''},encoding:'utf8',timeout:20000,maxBuffer:8192});ensure(r.status===0&&!r.stderr);return JSON.parse(r.stdout);}
const descriptor={name:'publish',abilityId:definition.id,abilityVersion:definition.version,abilityDigest:invocation.definition_digest,effects:definition.effects,inputSchema:definition.input_schema,outputSchema:definition.output_schema,execution:'/v1/abilities/publication/create/run'};
async function transport(route,options){
 if(route==='/v1/ai/mcp/tools')return {tools:[descriptor]};
 ensure(route===descriptor.execution);const call=JSON.parse(options.body);
 if(ticket)ensure(Date.now()<ticket.valid_until_ms&&read('mcp-current-ticket.json').attempt===attempt);
 ensure(json(call.input)===json(invocation.input)&&call.invocation_id===invocation.invocation_id&&options.headers['idempotency-key']===invocation.idempotency_key);
 fs.appendFileSync(path.join(root,'mcp-gateway-invocations'),attempt+'\n');
 if(config.gateway_transport_failure)throw Error('PRIVATE_GATEWAY_EXCEPTION');
 return gateway('execute');
}
function record(admission,context,data,outcome){
 let receipt=data?.receipt??null;
 if(receipt){ensure(receipt.schema==='kujo.ability.receipt/v1'&&receipt.invocation_id===invocation.invocation_id&&receipt.ability_id===definition.id&&receipt.ability_version===definition.version&&receipt.definition_digest===invocation.definition_digest&&receipt.surface===invocation.surface);}
 const observed=gateway('observe');ensure(observed.ok);
 const correlation={...context,ability_id:definition.id,ability_version:definition.version,definition_digest:invocation.definition_digest,ability_invocation_id:invocation.invocation_id,receipt_id:receipt?.receipt_id??null,receipt_ref:receipt?store(json(receipt)):null,outcome,transaction_sha256:observed.profile.transaction_sha256};
 const stamp=new Date().toISOString().replace(/\.\d{3}Z$/,'Z');
 const result={schema:'kujo.execution-result/v1',result_id:ticket.dispatch_run_id+':'+attempt,subject:{run_id:ticket.dispatch_run_id,step_id:ticket.dispatch_step_id,attempt_id:attempt},producer:{name:'mcp-ability-host',version:'1'},status:outcome==='receipt_succeeded'?'success':'indeterminate',classification:'unknown',started_at:stamp,finished_at:stamp,attempt:Number(attempt),effects:[{effect_id:ticket.dispatch_effect_id,class:'external_idempotent',state:'unknown',idempotency_key:observed.profile.key_digest,enforced_by:'ability-local',enforcement_evidence_ref:observed.observation.evidence_ref}],evidence:correlation.receipt_ref?[{$ref:correlation.receipt_ref}]:[],mcp_correlation:correlation,preservation_outcome:ticket.preservation};
 if(config.mcp_drop_response)result.status='indeterminate';
 const raw=json(result),doc={...correlation,schema:handoffSchema,dispatch_run_id:ticket.dispatch_run_id,dispatch_step_id:ticket.dispatch_step_id,dispatch_attempt_id:attempt,dispatch_effect_id:ticket.dispatch_effect_id,execution_result_ref:store(raw),assurance_ref:null};
 ensure(validateHandoff(doc));const ref=store(json(doc));writeOnce('mcp-handoff-'+attempt+'.ref',ref);writeOnce('result-'+attempt+'.json',raw);
 if(config.mcp_drop_response)process.exit(23); // Actual process loss after durable publication.
 return {ok:true,ref};
}
const control=ticket?{server_id:ticket.mcp_server_id,session_id:ticket.mcp_session_id,
 admit:async(context,input)=>{
  ensure(context.rpc_request_id===ticket.rpc_request_id&&context.tool_name==='publish'&&json(input)===json(invocation.input));
  ensure(Date.now()<ticket.valid_until_ms&&read('mcp-current-ticket.json').attempt===attempt);
  writeOnce('mcp-claim-'+attempt,context.mcp_invocation_id);
  return {ok:true,ability_invocation_id:invocation.invocation_id,idempotency_key:invocation.idempotency_key};
 },record,
 observe:async context=>{
  const now=Date.now();const input={event_id:'event-'+context.mcp_invocation_id,trace_id:ticket.dispatch_run_id,span_id:context.mcp_invocation_id,tool_name:context.tool_name,server_name:context.mcp_server_id,session_id:context.mcp_session_id,request_id:context.mcp_request_id,tool_call_id:context.mcp_invocation_id,phase:'server',status:context.outcome==='receipt_succeeded'?'ok':'error',risk:'write',started_at_ms:now,ended_at_ms:now};
  const r=spawnSync(config.runtime,['run','examples/controlled-ability/telemetry.kujo','--interpreter',JSON.stringify(input)],{cwd:config.mcp_root,encoding:'utf8',timeout:20000,maxBuffer:8192});ensure(r.status===0&&!r.stderr);const events=JSON.parse(r.stdout);ensure(events.ok);fs.appendFileSync(path.join(root,'mcp-watchdog-'+attempt+'.json'),json(events));
 }}:null;
startAbilityMcp({control,gatewayTransport:transport});
