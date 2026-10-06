// Pure active-time accumulator; hiding, loading and transition guards never count.
export function createActiveTimer(now=()=>performance.now()){
 let index=null,elapsed=0,started=null;
 const pause=()=>{if(started!==null){elapsed+=Math.max(0,now()-started);started=null;}return Math.round(elapsed);};
 return {begin(i,ms=0){pause();index=i;elapsed=ms;started=now();},resume(){if(index!==null&&started===null)started=now();},pause,snapshot(){return {index,ms:Math.round(elapsed+(started===null?0:Math.max(0,now()-started)))};},reset(){index=null;elapsed=0;started=null;}};
}
