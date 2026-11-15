import {createServer} from 'node:http';
import {createReadStream,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('./game/',import.meta.url));
const flag=process.argv.indexOf('--port');
const port=Number(flag<0?8080:process.argv[flag+1]);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'};
createServer((req,res)=>{
 let relative;
 try{relative=decodeURIComponent((req.url||'/').split('?')[0]);}catch{res.writeHead(400).end();return;}
 if(relative.endsWith('/'))relative+='index.html';
 const path=resolve(root,'.'+relative);
 if(!path.startsWith(resolve(root)+sep)){res.writeHead(403).end();return;}
 try{const stat=statSync(path);if(!stat.isFile())throw Error();res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','content-length':stat.size,'cache-control':'no-store'});createReadStream(path).pipe(res);}catch{res.writeHead(404).end('Missing file');}
}).listen(port,'127.0.0.1',()=>console.log('Dustline Yard listening on port '+port));
