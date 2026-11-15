import {mkdirSync,cpSync,existsSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildDossier} from './vendor/makefun-threejs.ts';

const project=dirname(fileURLToPath(import.meta.url));
const output=process.env.MAKEFUN_OUTPUT_DIR||'/output';
mkdirSync(output,{recursive:true});
cpSync(join(project,'game'),join(output,'game'),{recursive:true});
mkdirSync(join(output,'screenshots'),{recursive:true});
if(existsSync(join(project,'screenshots')))cpSync(join(project,'screenshots'),join(output,'screenshots'),{recursive:true});
const dossier=buildDossier(output,{text_max_bytes:163840,screenshots:{max:4,max_bytes:262144},game_max_files:993,game_max_bytes:50331648});
writeFileSync(join(output,'dossier.json'),dossier);
