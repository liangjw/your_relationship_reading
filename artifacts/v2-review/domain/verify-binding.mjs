import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

const worker = 'https://your-relationship-reading-v2.fliedwolf.workers.dev';
const results = {checkedAt:new Date().toISOString(),hosts:[]};
for (const base of ['https://dramame.ai','https://your-relationship-reading.dramame.ai',worker]) {
  const host = {base,https:false,gameEntry:false};
  try {
    const response = await fetch(base, {signal:AbortSignal.timeout(15000)});
    host.https = true;
    host.status = response.status;
    const html = await response.text();
    assert.equal(response.status,200);
    assert(html.includes('你真的懂TA吗？'));
    const api = await fetch(base+'/api/game',{signal:AbortSignal.timeout(15000)});
    assert.equal(api.status,200);
    assert.equal((await api.json()).screen,'entry');
    host.gameEntry = true;
  } catch(error) {
    host.error = error.cause?.code||error.message;
  }
  results.hosts.push(host);
}

let cookie = '';
async function api(path, input) {
  const response = await fetch(worker+path, {
    ...(input?{method:'POST',body:JSON.stringify(input)}:{}),
    headers:{Cookie:cookie,Origin:worker,'Content-Type':'application/json'},
    signal:AbortSignal.timeout(15000)
  });
  cookie = response.headers.get('set-cookie')?.split(';')[0] || cookie;
  assert.equal(response.status,200);
  return response.json();
}
let view = await api('/api/game');
view = await api('/api/action',{action:'start',gender:'male',revision:view.revision,requestId:crypto.randomUUID()});
for (let index=0;index<20;index++) {
  await delay(560);
  const questionId = view.html.match(/data-question-id="([^"]+)"/)[1];
  view = await api('/api/action',{action:'answer',questionId,pick:0,revision:view.revision,requestId:crypto.randomUUID()});
}
assert.equal(view.screen,'report');
assert.equal(view.share.url,'https://dramame.ai/?from=report');
const poster = await fetch(worker+'/api/poster.svg',{headers:{Cookie:cookie},signal:AbortSignal.timeout(15000)});
assert.equal(poster.status,200);
const posterSvg = await poster.text();
assert(posterSvg.includes('<svg'));
assert(poster.headers.get('content-type').includes('image/svg+xml'));
results.report={completed:true,questions:20,shareUrl:view.share.url,posterGenerated:true};
await fs.writeFile(new URL('./verification.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
