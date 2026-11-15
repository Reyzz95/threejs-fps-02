import {Vector3,Ray} from 'three';
import {hasLineOfSight} from './world.js';
import {WEAPONS} from './weapons.js';
const ray=new Ray(),point=new Vector3(),offset=new Vector3(),eye=new Vector3();
const hit={target:null,part:'body',point:new Vector3(),dist:0},victims=[];
export function raycastShot(origin,dir,range,targets,world){
 let nearest=range,target=null,part='body';ray.set(origin,dir);
 for(let i=0;i<world.aabbs.length;i++){const box=world.aabbs[i];if(box.containsPoint(origin)){nearest=0;break;}if(ray.intersectBox(box,point))nearest=Math.min(nearest,origin.distanceTo(point));}
 for(let i=0;i<targets.length;i++){
  const t=targets[i];if(!t||t.hp<=0||t.alive===false)continue;
  for(let j=0;j<2;j++){
   offset.subVectors(t.pos,origin);offset.y+=j?1.58:1.02;
   const r=j?.23:.42,along=offset.dot(dir),perp=offset.lengthSq()-along*along;
   if(perp>r*r||along+r<=0)continue;
   const root=Math.sqrt(Math.max(0,r*r-perp)),distance=Math.max(0,along-root);
   if(distance<nearest){nearest=distance;target=t;part=j?'head':'body';}
  }
 }
 if(!target)return null;
 hit.target=target;hit.part=part;hit.dist=nearest;hit.point.copy(origin).addScaledVector(dir,nearest);return hit;
}
export function applyDamage(target,amount,part){
 if(!target||target.hp<=0||amount<=0)return false;
 const total=amount*(part==='head'?WEAPONS.vk47.headMul:1),armor=Math.max(0,target.armor||0),absorbed=Math.min(armor,total*.5);
 target.armor=armor-absorbed;target.hp=Math.max(0,target.hp-total+absorbed);
 if(target.hp<=0){target.alive=false;return true;}return false;
}
export function explodeGrenade(pos,targets,world){
 victims.length=0;
 for(let i=0;i<targets.length;i++){
  const t=targets[i];if(t.hp<=0||t.alive===false)continue;
  eye.copy(t.pos);eye.y+=1;const d=pos.distanceTo(t.pos);
  if(d<8&&hasLineOfSight(pos,eye,world.aabbs)&&applyDamage(t,110*(1-d/8),'body'))victims.push(t);
 }
 return victims;
}
