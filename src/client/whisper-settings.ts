// @ts-nocheck
const BASE='/api/dsh-live-voice/whisper';
const UNLOADED='Whisper settings routes are not loaded. A normal DSH server restart is required to load updated plugin routes; refreshing this page alone is not enough.';
export async function whisperSettingsRequest(path, {method='GET',config,signal}={}, fetchImpl=globalThis.fetch) {
 const response=await fetchImpl(BASE+path,{method,credentials:'same-origin',signal,headers:config?{'content-type':'application/json'}:undefined,body:config?JSON.stringify(config):undefined});
 if(response.status===401||response.status===403)throw new Error('Sign in to DSH to manage Whisper settings.');
 if(response.status===404||response.status===405)throw new Error(UNLOADED);
 let body;try{body=await response.json();}catch{throw new Error(UNLOADED);}
 if(typeof body?.ok!=='boolean')throw new Error(UNLOADED);
 if(!response.ok||!body.ok)throw new Error(body.error?.message||'Whisper settings request failed.');
 return body.value;
}
export function createWhisperSettings(React) {
 const h=React.createElement;
 return function WhisperSettings({controller}) {
  const [draft,setDraft]=React.useState({url:'http://127.0.0.1:8080/inference',healthUrl:'/health',timeoutMs:30000});
  const [busy,setBusy]=React.useState(true),[loaded,setLoaded]=React.useState(false),[error,setError]=React.useState(''),[message,setMessage]=React.useState('');
  const active=React.useRef(null);
  async function run(action){
   active.current?.abort();const abort=new AbortController();active.current=abort;setBusy(true);setError('');setMessage('');
   try{
    if(action==='load'){const value=await whisperSettingsRequest('/config',{signal:abort.signal});if(!abort.signal.aborted){setDraft(value);setLoaded(true);}}
    else if(action==='save'){
     await controller.endConversation?.();
     const value=await whisperSettingsRequest('/config',{method:'PUT',config:{...draft,timeoutMs:Number(draft.timeoutMs)},signal:abort.signal});
     if(!abort.signal.aborted){setDraft(value);setMessage('Saved on the DSH host. Active host transcription requests were cancelled.');await controller.refreshCapabilities?.();}
    }else{
     const value=await whisperSettingsRequest('/test',{method:'POST',config:{...draft,timeoutMs:Number(draft.timeoutMs)},signal:abort.signal});
     if(!abort.signal.aborted){if(!value.supported)throw new Error(value.reason||'Whisper health check failed.');setMessage('Connection successful. Health endpoint responded; transcription was not tested. Unsaved edits have not been applied.');}
    }
   }catch(reason){if(!abort.signal.aborted)setError(reason.message||String(reason));}
   finally{if(!abort.signal.aborted)setBusy(false);}
  }
  React.useEffect(()=>{void run('load');return()=>active.current?.abort();},[]);
  function field(label,key,type='text') {return h('label',null,label,h('input',{type,value:draft[key],disabled:busy||!loaded,autoComplete:'off',...(type==='number'?{min:100,max:300000,step:1}:{}),onChange:event=>{setDraft({...draft,[key]:event.target.value});setMessage('Unsaved changes');setError('');}}));}
  return h(React.Fragment,null,
   h('p',null,'Host-wide settings. Only unauthenticated loopback HTTP URLs (localhost, 127.0.0.1, [::1]) are allowed. Loopback means the DSH host, not this browser. All health checks and audio requests run through the authenticated backend.'),
   field('Endpoint URL','url'),field('Health URL or path','healthUrl'),field('Request timeout (ms)','timeoutMs','number'),
   h('div',{className:'dlv-settings-actions'},h('button',{type:'button',disabled:busy||!loaded,onClick:()=>run('save')},'Save Whisper settings'),h('button',{type:'button',disabled:busy||!loaded,onClick:()=>run('test')},'Test connection'),h('button',{type:'button',disabled:busy,onClick:()=>run('load')},'Reload saved settings')),
   busy?h('p',{role:'status'},'Contacting DSH host…'):null,message?h('p',{role:'status'},message):null,error?h('p',{role:'alert'},error):null);
 };
}
