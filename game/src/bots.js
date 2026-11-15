import * as T from 'three';
import {collideMove,hasLineOfSight,pointInSite} from './world.js';
import {createWeapon,startReload,finishReload} from './weapons.js';
const eye=new T.Vector3(),targetEye=new T.Vector3(),from=new T.Vector3(),to=new T.Vector3();
function rng(b){let x=b.rng;x^=x<<13;x^=x>>>17;x^=x<<5;b.rng=x;return(x>>>0)/4294967296;}
function navigation(world){
 const cols=31,rows=25,cells=[],open=new Uint8Array(cols*rows),expanded=[];
 for(let i=0;i<world.aabbs.length;i++){const b=world.aabbs[i].clone();b.min.x-=.4;b.min.z-=.4;b.max.x+=.4;b.max.z+=.4;expanded.push(b);}
 for(let z=0;z<rows;z++)for(let x=0;x<cols;x++){
  const p=new T.Vector3(-30+x*2,0,-24+z*2),index=z*cols+x;cells.push(p);let free=true;
  for(let i=0;i<expanded.length;i++){const b=expanded[i];if(b.max.y>0&&b.min.y<1.8&&p.x>b.min.x&&p.x<b.max.x&&p.z>b.min.z&&p.z<b.max.z){free=false;break;}}
  open[index]=free?1:0;
 }
 return {cols,rows,cells,open,expanded,queue:new Int16Array(cells.length),parent:new Int16Array(cells.length),seen:new Uint32Array(cells.length),stamp:0};
}
function nearest(nav,pos){let result=0,distance=Infinity;for(let i=0;i<nav.cells.length;i++)if(nav.open[i]){const d=nav.cells[i].distanceToSquared(pos);if(d<distance){distance=d;result=i;}}return result;}
function route(b,nav,goal){
 const start=nearest(nav,b.pos),end=nearest(nav,goal),stamp=++nav.stamp;let read=0,write=1;nav.queue[0]=start;nav.seen[start]=stamp;nav.parent[start]=-1;
 while(read<write){const c=nav.queue[read++];if(c===end)break;
  for(let k=0;k<4;k++){const n=k===0?c-1:k===1?c+1:k===2?c-nav.cols:c+nav.cols;if(n<0||n>=nav.cells.length||(k<2&&Math.floor(n/nav.cols)!==Math.floor(c/nav.cols))||!nav.open[n]||nav.seen[n]===stamp)continue;nav.seen[n]=stamp;nav.parent[n]=c;nav.queue[write++]=n;}
 }
 b.pathLength=0;b.pathIndex=0;b.routeGoal.copy(goal);
 if(nav.seen[end]!==stamp)return;
 let n=end;while(n>=0){b.path[b.pathLength++]=n;n=nav.parent[n];}
 for(let i=0,j=b.pathLength-1;i<j;i++,j--){const v=b.path[i];b.path[i]=b.path[j];b.path[j]=v;}
}
export function createBots(scene,world,count){
 const list=[],nav=navigation(world),uniform=[new T.MeshStandardMaterial({color:0x39746d,roughness:.85}),new T.MeshStandardMaterial({color:0xb17a48,roughness:.9})],dark=new T.MeshStandardMaterial({color:0x263637,roughness:.6}),skin=new T.MeshStandardMaterial({color:0xb79c7d}),trim=[new T.MeshStandardMaterial({color:0x8bdac3,emissive:0x1b5145}),new T.MeshStandardMaterial({color:0xe3b67d})];
 list.nav=nav;
 for(let i=0;i<Math.min(9,count);i++){
  const ally=i<4,team=ally?'vanguard':'jackals',index=ally?i+1:i-4,group=new T.Group(),pos=world.spawns[team][index].clone();group.position.copy(pos);scene.add(group);
  const b={group,pos,yaw:0,hp:100,armor:50,alive:true,team,weapon:createWeapon('vk47'),state:'patrol',waypoint:0,plant:0,defuse:0,reaction:.3+i*.04,burst:0,vel:new T.Vector3(),aim:new T.Vector3(),index:i,rng:76541+i*7919,enemy:null,scanAt:0,nextBurst:0,round:-1,lane:i%3,goal:new T.Vector3(),routeGoal:new T.Vector3(Infinity,0,Infinity),path:new Int16Array(nav.cells.length),pathLength:0,pathIndex:0,navAt:0,stepPhase:i,legs:[],gun:null,shotEvent:null};
  b.shotEvent={type:'shoot',bot:b,target:null};
  function part(w,h,d,x,y,z,mat,area='body'){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.userData.target=b;m.userData.part=area;group.add(m);return m;}
  const u=uniform[ally?0:1],accent=trim[ally?0:1];
  part(.53,.66,.3,0,1.08,0,u);part(.43,.38,.09,0,1.1,-.18,dark);part(.36,.07,.02,0,1.3,-.24,accent);part(.13,.17,.08,-.13,.98,-.23,u);part(.13,.17,.08,.13,.98,-.23,u);
  part(.31,.3,.3,0,1.58,0,skin,'head');part(.35,.13,.34,0,1.74,0,u,'head');part(.33,.085,.035,0,1.62,-.165,dark,'head');
  for(let side=-1;side<=1;side+=2){b.legs.push(part(.18,.63,.23,side*.16,.4,0,dark));part(.21,.12,.31,side*.16,.09,-.04,dark);part(.18,.5,.2,side*.34,1.12,-.04,u);part(.15,.15,.18,side*.32,.88,-.12,skin);}
  b.gun=part(.11,.13,.64,.15,1.13,-.4,dark);part(.04,.04,.28,.15,1.15,-.82,dark);part(.08,.2,.1,.15,.98,-.38,dark);list.push(b);
 }
 return list;
}
function visible(b,target,ctx){if(target.hp<=0||target.alive===false||target.team===b.team)return false;const d=b.pos.distanceToSquared(target.pos);if(d>42*42)return false;eye.copy(b.pos);eye.y+=1.45;targetEye.copy(target.pos);targetEye.y+=1.4;return hasLineOfSight(eye,targetEye,ctx.world.aabbs)&&!(ctx.effects&&ctx.effects.blocks(eye,targetEye));}
function move(b,dt,world,nav,time){
 if(time>=b.navAt||b.goal.distanceToSquared(b.routeGoal)>4){route(b,nav,b.goal);b.navAt=time+1.4;}
 let dest=b.goal;from.copy(b.pos);from.y+=.9;to.copy(b.goal);to.y+=.9;
 if(!hasLineOfSight(from,to,nav.expanded)){
  while(b.pathIndex<b.pathLength-1&&b.pos.distanceToSquared(nav.cells[b.path[b.pathIndex]])<1)b.pathIndex++;
  if(b.pathIndex<b.pathLength){dest=nav.cells[b.path[b.pathIndex]];for(let j=b.pathIndex+1;j<b.pathLength;j++){to.copy(nav.cells[b.path[j]]);to.y+=.9;if(!hasLineOfSight(from,to,nav.expanded))break;dest=nav.cells[b.path[j]];b.pathIndex=j;}}
 }
 const dx=dest.x-b.pos.x,dz=dest.z-b.pos.z,d=Math.hypot(dx,dz),speed=b.state==='retreat'?3.3:2.55;
 if(d>.2){const blend=Math.min(1,dt*12);b.vel.x+=(dx/d*speed-b.vel.x)*blend;b.vel.z+=(dz/d*speed-b.vel.z)*blend;}else{b.vel.x*=Math.exp(-15*dt);b.vel.z*=Math.exp(-15*dt);}
 b.vel.y-=20*dt;collideMove(b.pos,b.vel,dt,.34,1.8,world.aabbs);
 if(!b.enemy&&d>.2)b.yaw=Math.atan2(-dx,-dz);
}
export function updateBots(bots,dt,ctx){
 const nav=bots.nav,rounds=ctx.rounds;
 for(let i=0;i<bots.length;i++){
  const b=bots[i];if(!b.alive||b.hp<=0)continue;
  if(rounds&&b.round!==rounds.round){b.round=rounds.round;b.enemy=null;b.scanAt=0;b.nextBurst=0;b.burst=0;b.pathLength=0;b.pathIndex=0;b.navAt=0;b.routeGoal.set(Infinity,0,Infinity);b.armor=50;b.state='patrol';}
  const w=b.weapon;if(w.reloading&&ctx.time>=w.reloadEnd)finishReload(w);if(!w.mag&&!w.reloading)startReload(w,ctx.time);
  if(ctx.time>=b.scanAt){let target=null,dist=Infinity;
   for(let j=-1;j<bots.length;j++){const t=j<0?ctx.player:bots[j];if(t===b||!visible(b,t,ctx))continue;const d=b.pos.distanceToSquared(t.pos);if(d<dist){target=t;dist=d;}}
   if(target!==b.enemy){b.enemy=target;b.reaction=.24+rng(b)*.22;b.burst=0;}b.scanAt=ctx.time+.1;
  }
  if(b.enemy&&(b.enemy.hp<=0||!b.enemy.alive))b.enemy=null;
  const planted=rounds&&rounds.bomb.state==='planted',attacking=ctx.attackingTeam===b.team,carrier=b===ctx.bombCarrier&&attacking,objective=planted||carrier;
  if(planted)b.goal.copy(ctx.world.sites[rounds.bomb.site].pos);
  else if(carrier)b.goal.copy(ctx.world.sites.B.pos);
  else{const stage=b.waypoint%7,index=b.lane*7+(b.team==='vanguard'?stage:6-stage);b.goal.copy(ctx.world.waypoints[index].pos);if(b.pos.distanceToSquared(b.goal)<2.5)b.waypoint++;}
  if(b.hp<32&&!planted){b.state='retreat';b.goal.copy(ctx.world.spawns[b.team][b.team==='vanguard'?i%4+1:(i-4)%5]);}
  else if(planted&&!attacking&&b.pos.distanceToSquared(b.goal)<9){b.state='defuse';b.vel.set(0,0,0);}
  else if(carrier&&!planted&&pointInSite(b.pos,ctx.world.sites.B)&&!b.enemy){b.state='plant';b.vel.set(0,0,0);}
  else b.state=b.enemy?'engage':objective?'advance':'patrol';
  if(b.enemy){b.yaw=Math.atan2(b.pos.x-b.enemy.pos.x,b.pos.z-b.enemy.pos.z);b.reaction-=dt;
   if(b.reaction<=0&&ctx.time>=b.nextBurst&&b.state!=='plant'&&b.state!=='defuse'&&visible(b,b.enemy,ctx)){
    if(!b.burst)b.burst=3+Math.floor(rng(b)*3);
    if(!w.reloading&&w.mag>0&&ctx.time>=w.cooldown){b.shotEvent.target=b.enemy;ctx.events.push(b.shotEvent);b.burst--;if(!b.burst)b.nextBurst=ctx.time+.35+rng(b)*.45;}
   }
  }
  if(b.state==='plant'||b.state==='defuse'||b.state==='engage'&&!objective){b.vel.x*=Math.exp(-18*dt);b.vel.z*=Math.exp(-18*dt);}
  else move(b,dt,ctx.world,nav,ctx.time);
  b.group.position.copy(b.pos);b.group.rotation.y=b.yaw;b.stepPhase+=Math.hypot(b.vel.x,b.vel.z)*dt*4;
  b.legs[0].rotation.x=Math.sin(b.stepPhase)*.28;b.legs[1].rotation.x=-Math.sin(b.stepPhase)*.28;b.gun.position.z=-.4+(ctx.time<w.cooldown?.025:0);
 }
}
