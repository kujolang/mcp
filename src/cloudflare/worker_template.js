/* Generic stateless Cloudflare Worker adapter, catalog contract v2. Edit this framework source, never generated copies.
 * Canonical schemas, resources and static results are exported by the Kujo generator.
 * No network, storage, execution or credential capabilities.
 */
const DATA = __KUJO_MCP_DATA__;
const MAX_BODY = 131072, MAX_RESPONSE = 1048576, MAX_DEPTH = 64;
const VERSIONS = ['2026-07-28', '2025-06-18'];
const headers = {'content-type':'application/json; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'none'; frame-ancestors 'none'",'cross-origin-resource-policy':'same-origin','referrer-policy':'no-referrer','x-content-type-options':'nosniff','x-frame-options':'DENY'};
const json = (status, body) => {
  const text = status === 202 ? null : JSON.stringify(body);
  if (text && new TextEncoder().encode(text).length > MAX_RESPONSE) return new Response('{"error":"Response exceeds configured maximum"}', {status:500,headers});
  return new Response(text, {status,headers});
};
const object = p => p !== null && typeof p === 'object' && !Array.isArray(p);
const own = (p,k) => object(p) && Object.hasOwn(p,k);
const idOf = p => own(p,'id') && (typeof p.id==='string'||Number.isSafeInteger(p.id)) ? p.id : null;
const ok = (p,result) => ({jsonrpc:'2.0',id:idOf(p),result});
const err = (p,code,message,data) => ({jsonrpc:'2.0',id:idOf(p),error:{code,message,...(data?{data}:{})}});
const good = d => ({resultType:'complete',content:[{type:'text',text:JSON.stringify(d)}],structuredContent:d,isError:false});
const bad = message => ({resultType:'complete',content:[{type:'text',text:message}],structuredContent:{error:message},isError:true});
const norm = value => String(value??'').trim().toLowerCase().replace(/[-_\/.,:;()[\]`]/g,' ').replace(/\s+/g,' ');
const terms = query => [...new Set(norm(query).split(' ').filter(t=>t.length>=2&&!['a','an','and','for','from','in','of','on','or','the','to','with'].includes(t)))].slice(0,24);
const publicItem = item => ({kind:item.kind,slug:item.slug,title:item.title,description:item.description,category:item.category,tags:item.tags,install_command:item.install_command,github_url:item.github_url,website_url:item.website_url,scope_note:item.scope_note,version:item.version,last_updated:item.last_updated,latest_release_url:item.latest_release_url||'',release_status:item.release_status||'',source_path:item.source_path,provenance:'Reviewed committed Kujolang.ai content'});
// The generator exports the exact native normalization; build no per-request index.
const index = DATA._search_index;
const matches = (item,kind,category) => (!kind||item.kind.toLowerCase()===kind.toLowerCase())&&(!category||item.category.toLowerCase().includes(category.toLowerCase()));
const search = (query,kind='',category='',limit=10,prefix='') => {
  const ts=terms(query),scored=[];
  for(let i=0;i<DATA.items.length;i++){
    const item=DATA.items[i],entry=index[i];
    if(!matches(item,kind,category)||!item.slug.startsWith(prefix))continue;
    const matched_terms=ts.filter(t=>entry.search.includes(t));
    const score=matched_terms.reduce((s,t)=>s+1+(entry.identity.includes(t)?2:0),0);
    if(score)scored.push({score,matched_terms,i});
  }
  return scored.sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,limit).map(x=>({score:x.score,matched_terms:x.matched_terms,item:publicItem(DATA.items[x.i])}));
};
const list = (kind,category,limit) => DATA.items.filter(i=>matches(i,kind,category)).slice(0,limit).map(publicItem);
const tools = () => DATA.registry.tools;
const stringArg = (a,k,f,max) => {
  if(!own(a,k))return {value:f};
  if(typeof a[k]!=='string')return {error:k+' must be a string'};
  const value=a[k].trim();
  // Schema string limits count Unicode code points, as does Kujo.
  if([...value].length>max)return {error:k+' must be at most '+max+' characters'};
  return {value};
};
const intArg = (a,k,f,min,max) => !own(a,k)?{value:f}:!Number.isInteger(a[k])?{error:k+' must be an integer'}:a[k]<min||a[k]>max?{error:k+' must be between '+min+' and '+max}:{value:a[k]};
const allowed = {get_kujo_overview:[],list_ecosystem:['kind','category','limit'],search_kujo_catalog:['query','kind','category','limit'],get_catalog_item:['slug'],recommend_kujo_stack:['task','limit'],get_installation:['profile'],list_webops_capabilities:['query','limit']};
const tool = (name,a) => {
  if(!own(allowed,name))return null;
  const extra=Object.keys(a).sort().find(k=>!allowed[name].includes(k));if(extra)return bad('unknown argument: '+extra);
  if(name==='get_kujo_overview')return good(DATA.registry.overview);
  if(name==='list_ecosystem'||name==='search_kujo_catalog'){
    const query=stringArg(a,'query','',512),kind=stringArg(a,'kind','',32),category=stringArg(a,'category','',128),limit=intArg(a,'limit',name==='list_ecosystem'?100:10,1,name==='list_ecosystem'?200:50);
    if(name==='search_kujo_catalog'){if(query.error)return bad(query.error);if(!query.value)return bad('query is required and must be a non-empty string');}
    if(kind.error)return bad(kind.error);if(kind.value&&!['project','skill','workflow'].includes(kind.value))return bad('kind must be project, skill, or workflow');if(category.error)return bad(category.error);if(limit.error)return bad(limit.error);
    if(name==='list_ecosystem'){const items=list(kind.value,category.value,limit.value);return good({items,returned:items.length,filters:{kind:kind.value,category:category.value}});}
    const results=search(query.value,kind.value,category.value,limit.value);return good({query:query.value,results,returned:results.length});
  }
  if(name==='get_catalog_item'){
    const slug=stringArg(a,'slug','',128);if(slug.error||!slug.value)return bad('slug is required and must be a non-empty string');
    const w=norm(slug.value),i=index.findIndex(x=>x.slug===w||x.title===w);return i<0?bad('Catalog item not found: '+slug.value):good(publicItem(DATA.items[i]));
  }
  if(name==='recommend_kujo_stack'){
    const task=stringArg(a,'task','',1000),limit=intArg(a,'limit',6,1,12);if(task.error||!task.value)return bad('task is required and must be a non-empty string');if(limit.error)return bad(limit.error);
    return good({task:task.value,recommendations:search(task.value,'','',limit.value),method:'Deterministic term matching over the released Kujolang.ai catalog.',next_step:'Inspect each result with get_catalog_item before installing or executing anything.'});
  }
  if(name==='get_installation'){
    const p=stringArg(a,'profile','default',32);if(p.error)return bad(p.error);const selected=p.value.toLowerCase()||'default';
    return own(DATA.registry.installations,selected)?good(DATA.registry.installations[selected]):bad('profile must be one of: default, core, agent, ai, quality, showcases, operating, all');
  }
  const q=stringArg(a,'query','webops',512),limit=intArg(a,'limit',50,1,100);if(q.error)return bad(q.error);if(limit.error)return bad(limit.error);
  const query=q.value||'webops',capabilities=search('webops '+query,'','',limit.value,'webops-');return good({query,capabilities,returned:capabilities.length});
};
const prompt = (name,a) => {
  if(!['choose_kujo_stack','plan_kujo_adoption','discover_webops'].includes(name))return {error:'Prompt not found: '+name};
  const extra=Object.keys(a).sort().find(k=>!(name==='plan_kujo_adoption'?['task','constraints']:['task']).includes(k));if(extra)return {error:'unknown argument: '+extra};
  const task=stringArg(a,'task','',1000),constraints=stringArg(a,'constraints','',2000);if(task.error||!task.value)return {error:'task is required and must be a non-empty string'};if(constraints.error)return {error:constraints.error};
  const templates=DATA.registry.prompt_templates[name];
  return {description:templates.description+task.value,messages:[{role:'user',content:{type:'text',text:templates.prefix+task.value+(name==='plan_kujo_adoption'?'. Constraints: '+constraints.value:'')}}]};
};
const handle = p => {
  if(!object(p))return err({},-32600,'Request must be a JSON object');
  if(p.jsonrpc!=='2.0')return err(p,-32600,'jsonrpc must equal 2.0');
  if(typeof p.method!=='string'||!p.method.trim())return err(p,-32600,'method must be a non-empty string');
  if(own(p,'id')&&typeof p.id!=='string'&&!Number.isSafeInteger(p.id))return err({},-32600,'id must be a string or safe integer');
  if(own(p,'params')&&!object(p.params))return err(p,-32602,'params must be an object');
  if(!own(p,'id'))return ['notifications/initialized','notifications/cancelled'].includes(p.method)?null:err({},-32600,'Method requires a request id');
  const a=p.params||{};
  if(p.method==='notifications/initialized')return err(p,-32600,'Notification must not contain an id');
  if(p.method==='ping')return ok(p,{});
  if(p.method==='server/discover')return ok(p,DATA.registry.discovery);
  if(p.method==='initialize'){const v=typeof a.protocolVersion==='string'?a.protocolVersion:'2025-06-18';return ok(p,{...DATA.registry.discovery,protocolVersion:VERSIONS.includes(v)?v:VERSIONS[0]});}
  if(p.method==='tools/list')return ok(p,{resultType:'complete',tools:tools(),ttlMs:300000,cacheScope:'public'});
  if(p.method==='resources/list')return ok(p,{resources:DATA.registry.resources});
  if(p.method==='prompts/list')return ok(p,{prompts:DATA.registry.prompts});
  if(['tools/call','prompts/get','resources/read'].includes(p.method)){
    const field=p.method==='resources/read'?'uri':'name';
    if(typeof a[field]!=='string'||!a[field].trim())return err(p,-32602,'params.'+field+' must be a non-empty string');
    if(p.method==='resources/read'){const u=a.uri.trim();return own(DATA.registry.resource_contents,u)?ok(p,{contents:DATA.registry.resource_contents[u]}):err(p,-32002,'Resource not found: '+u);}
    if(own(a,'arguments')&&!object(a.arguments))return err(p,-32602,'params.arguments must be an object');
    if(p.method==='tools/call'){const result=tool(a.name.trim(),a.arguments||{});return result?ok(p,result):err(p,-32601,'Tool not found: '+a.name.trim());}
    const result=prompt(a.name.trim(),a.arguments||{});return result.error?err(p,-32602,result.error):ok(p,result);
  }
  return err(p,-32601,'Method not found: '+p.method);
};
function jsonTextSafe(text){
  let depth=0,start=0,quoted=false,escaped=false;const seen=[];
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){
      if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"'){
        quoted=false;let j=i+1;while(j<text.length&&/\s/.test(text[j]))j++;
        if(text[j]===':'){const key=JSON.parse(text.slice(start,i+1));if(!seen[depth]||seen[depth].has(key))return false;seen[depth].add(key);}
      }
    }else if(ch==='"'){quoted=true;start=i;}else if(ch==='{'||ch==='['){if(++depth>MAX_DEPTH)return false;seen[depth]=new Set();}else if(ch==='}'||ch===']'){if(--depth<0)return false;}
  }
  return depth===0&&!quoted;
}
async function readBody(request){
  const declared=request.headers.get('content-length');
  if(declared!==null&&!/^\d+$/.test(declared))return {status:400,error:'Invalid Content-Length'};
  if(declared!==null&&Number(declared)>MAX_BODY)return {status:413,error:'Request body exceeds configured maximum'};
  if(!request.body)return {text:''};
  const reader=request.body.getReader(),chunks=[];let bytes=0;
  try{
    while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX_BODY){await reader.cancel();return {status:413,error:'Request body exceeds configured maximum'};}chunks.push(value);}
    if(declared!==null&&Number(declared)!==bytes)return {status:400,error:'Content-Length mismatch'};
    const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}
    return {text:new TextDecoder('utf-8',{fatal:true}).decode(buffer)};
  }finally{reader.releaseLock();}
}
const mediaType = value => /^application\/json([ \t]*;[ \t]*[a-z0-9!#$%&'*+.^_`|~-]+[ \t]*=[ \t]*([a-z0-9!#$%&'*+.^_`|~-]+|"[^"\r\n]*"))*[ \t]*$/i.test(value||'');
function acceptsJson(value){
  if(!value?.trim())return true;
  let specificity=-1,accepted=false;
  for(const part of value.toLowerCase().split(',')){
    const [media,...parameters]=part.split(';'),score=['*/*','application/*','application/json'].indexOf(media.trim());
    if(score>=0&&score>=specificity){specificity=score;accepted=!parameters.some(p=>/^q[ \t]*=[ \t]*0(\.0*)?$/.test(p.trim()));}
  }
  return accepted;
}
function protocolGuard(request,p){
  const version=request.headers.get('mcp-protocol-version')||'';
  if(version&&!VERSIONS.includes(version))return err(p,-32022,'Unsupported MCP protocol version',{requested:version,supported:VERSIONS});
  const bodyVersion=p?.params?._meta?.['io.modelcontextprotocol/protocolVersion']||'';
  if((bodyVersion&&bodyVersion!==version)||(version==='2026-07-28'&&bodyVersion!==version))return err(p,-32020,'MCP-Protocol-Version header must match request metadata');
  if(version==='2026-07-28'){
    if(request.headers.get('mcp-method')!==p?.method)return err(p,-32020,'Mcp-Method header must match the JSON-RPC method');
    if(['tools/call','prompts/get','resources/read'].includes(p.method)){
      let name=request.headers.get('mcp-name')||'';
      if(name.startsWith('=?base64?')&&name.endsWith('?=')){try{name=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(name.slice(9,-2)),c=>c.charCodeAt(0)));}catch{return err(p,-32020,'Invalid Mcp-Name encoding');}}
      if(name!==(p.params?.[p.method==='resources/read'?'uri':'name']??''))return err(p,-32020,'Mcp-Name header must match request parameters');
    }
  }
  return null;
}
export default {async fetch(request){
  const url=new URL(request.url);
  if(url.hostname.toLowerCase()!=='mcp.kujolang.ai')return json(403,{error:'Host is not allowed'});
  if(request.headers.has('origin'))return json(403,{error:'Origin header is not allowed'});
  if(url.pathname==='/health'&&request.method==='GET')return json(200,{status:'ok',server:'kujolang-mcp',version:DATA.server_version||'0.1.0',catalog:DATA.counts,catalog_source_version:DATA.source.version,catalog_revision:DATA.source.snapshot_sha256});
  if(!['/mcp','/mcp/v1'].includes(url.pathname))return json(404,{error:'Not found'});
  if(request.method!=='POST')return json(405,{error:'This stateless MCP endpoint accepts JSON-RPC messages with POST'});
  if(!acceptsJson(request.headers.get('accept')))return json(406,{error:'Accept must permit application/json'});
  if(!mediaType(request.headers.get('content-type')))return json(415,{error:'Content-Type must be application/json'});
  let p;
  try{const body=await readBody(request);if(body.status)return json(body.status,{error:body.error});if(!jsonTextSafe(body.text))return json(400,err({},-32700,'Invalid, duplicate-key, or over-depth JSON'));p=JSON.parse(body.text);}catch{return json(200,err({},-32700,'Parse error'));}
  const guard=protocolGuard(request,p);if(guard)return json(400,guard);
  const result=handle(p);if(result===null)return json(202,null);
  if(object(p)&&!own(p,'id'))return json(400,result);
  let status=200;
  if(request.headers.get('mcp-protocol-version')==='2026-07-28'){
    if(result.result)result.result={...result.result,resultType:'complete'};
    if(result.error?.code===-32601)status=404;
    if(result.error?.code===-32002)result.error.code=-32602;
  }
  return json(status,result);
}};
