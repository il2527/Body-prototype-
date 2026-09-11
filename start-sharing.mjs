// Keep the local app's invite button synchronized with its temporary HTTPS tunnel.
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const directory=path.join(root,'.preview'),file=path.join(directory,'public-origin.json');
await mkdir(directory,{recursive:true});
await writeFile(file,JSON.stringify({origin:''}));
const tunnel=spawn(path.join(directory,'cloudflared'),['tunnel','--url','http://127.0.0.1:8000','--no-autoupdate'],{stdio:['ignore','pipe','pipe']});
let buffer='',published=false;
let saving=Promise.resolve();
function output(chunk){const text=chunk.toString();process.stdout.write(text);buffer=(buffer+text).slice(-12000);const origin=buffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];if(origin&&!published){published=true;saving=writeFile(file,JSON.stringify({origin})).then(()=>console.log('Invite buttons now use '+origin));}}
tunnel.stdout.on('data',output);tunnel.stderr.on('data',output);
async function clear(){await saving;await writeFile(file,JSON.stringify({origin:''}));}
tunnel.on('error',async error=>{console.error(error.message);await clear();process.exitCode=1;});
tunnel.on('exit',async code=>{await clear();process.exitCode=code||0;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>tunnel.kill(signal));
