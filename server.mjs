import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.dirname(fileURLToPath(import.meta.url));
const rooms=new Map(), limits=new Map();
const id=()=>randomBytes(24).toString('base64url');
const valid=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{32}$/.test(s);
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
async function getPublicOrigin(){
  let value=process.env.PUBLIC_ORIGIN||'';
  if(!value)try{value=JSON.parse(await readFile(path.join(root,'.preview/public-origin.json'),'utf8')).origin;}catch{}
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.origin:'';}catch{return '';}
}
const iceServers=[{urls:'stun:stun.cloudflare.com:3478'}];
if(process.env.TURN_URL&&process.env.TURN_USERNAME&&process.env.TURN_CREDENTIAL)iceServers.push({urls:process.env.TURN_URL.split(','),username:process.env.TURN_USERNAME,credential:process.env.TURN_CREDENTIAL});
function resetMember(room,member){member.peer=null;member.epoch=++room.epoch;member.messages=[];member.hint='heart';member.round=member.epoch;}
function unpair(room,member,exclude=false){const other=room.members.get(member.peer);if(other){if(exclude){member.skipped.add(other.id);other.skipped.add(member.id);}resetMember(room,other);}resetMember(room,member);}
function pairWaiting(room,preferred=null){const waiting=[...room.members.entries()].filter(([,m])=>!m.peer);if(preferred)waiting.sort((a,b)=>(b[1]===preferred?1:0)-(a[1]===preferred?1:0));
  for(let i=0;i<waiting.length;i++){const [token,a]=waiting[i];if(a.peer)continue;const next=waiting.slice(i+1).find(([,b])=>!b.peer&&!a.skipped.has(b.id)&&!b.skipped.has(a.id));if(!next)continue;const [otherToken,b]=next;const epoch=++room.epoch;a.peer=otherToken;b.peer=token;for(const m of [a,b]){m.epoch=epoch;m.round=epoch;m.hint='heart';m.messages=[];}}
}
function clean(room){for(const [token,m] of room.members)if(Date.now()-m.seen>20000){unpair(room,m);room.members.delete(token);}pairWaiting(room);}
function snapshot(room,member,after=0){const peer=room.members.get(member.peer);return {id:member.id,peer:peer?.id||null,name:member.name,peerName:peer?.name||null,initiator:peer?member.id<peer.id:false,epoch:member.epoch,hint:member.hint,round:member.round,waiting:!peer,participants:room.members.size,messages:member.messages.filter(m=>m.seq>after)};}
export const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Permissions-Policy','camera=(self), microphone=(self)');
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api'&&req.method==='POST'){
      const publicOrigin=await getPublicOrigin();
      const origin=req.headers.origin;
      if(origin&&origin!==publicOrigin&&new URL(origin).host!==req.headers.host)fail(403,'This request must come from the room page.');
      if(!(req.headers['content-type']||'').startsWith('application/json'))fail(415,'JSON required.');
      let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>98304)fail(413,'Request too large.');}
      let data;try{data=JSON.parse(body);}catch{fail(400,'Invalid JSON.');}
      if(!data||typeof data!=='object'||Array.isArray(data))fail(400,'Invalid request.');
      if(data.action==='join'){
        const ip=req.socket.remoteAddress,now=Date.now();let rate=limits.get(ip);if(!rate||now-rate.start>60000){rate={start:now,count:0};limits.set(ip,rate);}if(++rate.count>40)fail(429,'Too many joins. Try again in a minute.');
        const key=data.room||id();if(!valid(key))fail(400,'Invalid room link.');
        let room=rooms.get(key);if(!room){if(rooms.size>=100)fail(503,'All rooms are busy. Try later.');room={members:new Map(),epoch:0,hint:'heart',round:1,updated:now};rooms.set(key,room);}
        clean(room);if(room.members.size>=20)fail(409,'This room is full. Try again when someone leaves.');
        const token=id(),member={id:id(),name:typeof data.name==='string'?data.name.trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,40)||'Guest':'Guest',seen:now,messages:[],seq:0,peer:null,skipped:new Set()};resetMember(room,member);room.members.set(token,member);room.updated=now;pairWaiting(room);
        return json(200,{...snapshot(room,member),room:key,token,iceServers,relayConfigured:iceServers.length>1,publicOrigin});
      }
      if(!valid(data.room)||!valid(data.token))fail(401,'Join the room first.');
      const room=rooms.get(data.room);if(!room)fail(410,'Room expired. Join again.');clean(room);
      const member=room.members.get(data.token);if(!member)fail(410,'You left or disconnected. Join again.');
      member.seen=room.updated=Date.now();
      if(data.action==='share')return json(200,{publicOrigin});
      if(data.action==='poll'){
        const after=Number.isSafeInteger(data.after)&&data.after>=0?data.after:0;
        member.messages=member.messages.filter(m=>m.seq>after);
        return json(200,snapshot(room,member,after));
      }
      if(data.action==='signal'){
        if(data.epoch!==member.epoch||!member.peer)fail(409,'Your pairing changed.');
        const signal=data.signal;if(!signal||!['offer','answer','candidate'].includes(signal.type))fail(400,'Invalid signal.');
        if(signal.type!=='candidate'&&(typeof signal.sdp!=='string'||signal.sdp.length>65536))fail(400,'Invalid description.');
        if(signal.type==='candidate'&&(!signal.candidate||typeof signal.candidate.candidate!=='string'))fail(400,'Invalid candidate.');
        const target=room.members.get(member.peer);if(target.messages.length>=256)fail(429,'Connection queue full. Rejoin the room.');target.messages.push({seq:++target.seq,epoch:member.epoch,signal});
        return json(200,{ok:true});
      }
      if(data.action==='skip'){
        if(data.epoch!==member.epoch)fail(409,'Your pairing already changed.');
        unpair(room,member,true);pairWaiting(room,member);return json(200,snapshot(room,member));
      }
      if(data.action==='hint'){if(data.epoch!==member.epoch)fail(409,'Your pairing changed.');const hint=member.hint==='heart'?'circle':'heart';const round=++room.epoch;for(const m of [member,room.members.get(member.peer)].filter(Boolean)){m.hint=hint;m.round=round;}return json(200,snapshot(room,member));}
      if(data.action==='leave'){unpair(room,member);room.members.delete(data.token);pairWaiting(room);return json(200,{ok:true});}
      fail(400,'Unknown action.');
    }
    if(req.method!=='GET'&&req.method!=='HEAD')fail(405,'Method not allowed.');
    if(url.pathname==='/health')return json(200,{ok:true});
    const files=new Set(['vision_bundle.mjs','vision_bundle.mjs.map','hand_landmarker.task','wasm/vision_wasm_internal.js','wasm/vision_wasm_internal.wasm','wasm/vision_wasm_nosimd_internal.js','wasm/vision_wasm_nosimd_internal.wasm']);
    const file=url.pathname==='/'||url.pathname==='/index.html'?'index.html':url.pathname.startsWith('/vendor/')&&files.has(url.pathname.slice(8))?url.pathname.slice(1):null;
    if(!file)fail(404,'Not found.');
    const content=await readFile(path.join(root,file));const ext=path.extname(file);const type={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.wasm':'application/wasm','.map':'application/json'}[ext]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Content-Length':content.length,'Cache-Control':file==='index.html'?'no-store':'public, max-age=86400'});res.end(req.method==='HEAD'?undefined:content);
  }catch(error){if(!res.headersSent)json(error.status||500,{error:error.status?error.message:'Server error. Please try again.'});else res.end();}
});
setInterval(()=>{for(const [key,room] of rooms){clean(room);if(!room.members.size&&Date.now()-room.updated>60000)rooms.delete(key);}for(const [ip,rate] of limits)if(Date.now()-rate.start>60000)limits.delete(ip);},10000).unref();
if(process.argv[1]===fileURLToPath(import.meta.url))server.listen(Number(process.env.PORT||8000),'127.0.0.1',()=>console.log(`Samewave: http://127.0.0.1:${server.address().port}`));
