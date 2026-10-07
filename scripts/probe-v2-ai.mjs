// Read-only connectivity probe. Never logs credentials or provider error messages.
const key=process.env.OPENAI_API_KEY;
if(!key){console.log(JSON.stringify({configured:false}));process.exit(0);}
try{const r=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(10000)});const j=await r.json();console.log(JSON.stringify({status:r.status,available:r.ok?j.data.filter(m=>['gpt-4.1-mini','gpt-5.4-mini','gpt-4o-mini'].includes(m.id)).map(m=>m.id):[],errorCode:j.error?.code||null}));}catch{console.log(JSON.stringify({connected:false}));}
