// Experimental host-installed transport only. No verifier or replay engine.
export const handoffSchema = 'mcp.ability-handoff/v1alpha1';
export const idValid = x => typeof x === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(x) && !/[\r\n]/.test(x);
export const refValid = x => typeof x === 'string' && /^sha256:[0-9a-f]{64}$/.test(x) && x.length === 71;
const digest = x => typeof x === 'string' && /^[0-9a-f]{64}$/.test(x) && x.length === 64;
export const identityFields = ['mcp_server_id','mcp_session_id','rpc_request_id','mcp_request_id','mcp_invocation_id','tool_name','ability_id','ability_version','ability_invocation_id','dispatch_run_id','dispatch_step_id','dispatch_attempt_id','dispatch_effect_id'];
export function validateHandoff(d) {
  const fields = ['schema',...identityFields,'definition_digest','outcome','receipt_id','receipt_ref','execution_result_ref','assurance_ref','transaction_sha256'];
  if (!d || typeof d !== 'object' || Array.isArray(d) || Buffer.byteLength(JSON.stringify(d)) > 4096 || Object.keys(d).length !== fields.length || !fields.every(k=>Object.hasOwn(d,k))) return false;
  return d.schema === handoffSchema && identityFields.every(k=>idValid(d[k])) && digest(d.definition_digest) && digest(d.transaction_sha256)
    && ['receipt_succeeded','receipt_failed','receipt_unavailable','transport_failed','application_failed'].includes(d.outcome)
    && refValid(d.execution_result_ref) && (d.assurance_ref === null || refValid(d.assurance_ref))
    && (d.receipt_ref === null ? d.receipt_id === null && !d.outcome.startsWith('receipt_su') && d.outcome !== 'receipt_failed' : refValid(d.receipt_ref) && idValid(d.receipt_id));
}
export function validateControl(c) {
  if (!c || !idValid(c.server_id) || !idValid(c.session_id) || !['admit','record'].every(k=>typeof c[k]==='function')) throw new Error('controlled Ability host callbacks required');
}
const denial = code => ({ok:false,outcome:'not_admitted',code});
export async function controlledCall(control, context, args, execute) {
  if (!idValid(context.rpc_request_id) || !args || typeof args !== 'object' || Array.isArray(args) || Buffer.byteLength(JSON.stringify(args)) > 4096) return denial('mcp_admission_invalid');
  const forbidden = ['_kujo','dispatch_run_id','dispatch_step_id','dispatch_attempt_id','dispatch_effect_id','assurance_profile','profile','verifier','verifier_id','config_revision','trusted_root','evidence_root','evidence_path','assurance_ref','principal','tenant','authorize_replay'];
  if (forbidden.some(k=>Object.hasOwn(args,k))) return denial('mcp_control_input_rejected');
  let admission;
  try { admission = await control.admit(Object.freeze({...context}), args); } catch { return denial('mcp_admission_unavailable'); }
  if (!admission?.ok || !idValid(admission.ability_invocation_id) || typeof admission.idempotency_key !== 'string' || !admission.idempotency_key.length || admission.idempotency_key.length > 255) return denial('mcp_admission_denied');
  let data = null, outcome = 'receipt_unavailable';
  try {
    data = await execute(admission);
    const receipt = data?.receipt;
    outcome = receipt ? (receipt.status === 'succeeded' ? 'receipt_succeeded' : 'receipt_failed') : 'application_failed';
  } catch (error) {
    // Private callback sees gateway facts, never arbitrary exception text in RPC.
    data = error?.body ?? null;
    outcome = error?.status ? 'application_failed' : 'transport_failed';
  }
  let recorded;
  try { recorded = await control.record(admission, Object.freeze({...context}), data, outcome); } catch { return {ok:false,outcome:'completion_uncertain',code:'mcp_evidence_unavailable'}; }
  if (!recorded?.ok || !refValid(recorded.ref)) return {ok:false,outcome:'completion_uncertain',code:'mcp_evidence_unavailable'};
  const result = {ok:outcome==='receipt_succeeded',outcome,completion:outcome==='receipt_succeeded'?'reported_success':'uncertain',handoff_ref:recorded.ref};
  try { await control.observe?.(Object.freeze({...context,outcome})); } catch { /* Observations cannot affect authority. */ }
  return result;
}

export const controlledResultSchema = {type:'object',additionalProperties:false,required:['ok','outcome'],properties:{ok:{type:'boolean'},outcome:{enum:['not_admitted','completion_uncertain','receipt_succeeded','receipt_failed','receipt_unavailable','transport_failed','application_failed']},completion:{enum:['reported_success','uncertain']},handoff_ref:{type:'string',pattern:'^sha256:[0-9a-f]{64}$',minLength:71,maxLength:71},code:{type:'string',maxLength:64}}};
