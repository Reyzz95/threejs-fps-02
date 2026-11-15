import {Vector3,Box3} from 'three';
import {collideMove} from './world.js';
const probe=new Box3();
export function createPlayer(world){
 const p={pos:world.spawns.vanguard[0].clone(),vel:new Vector3(),yaw:-Math.PI/2,pitch:0,hp:100,armor:0,crouched:false,onGround:true,radius:.34,height:1.8,eye:1.65,alive:true,team:'vanguard',jumpHeld:false};
 p.update=(dt,input,w)=>{
  if(p.hp<=0){p.alive=false;return;}
  let blocked=false;
  if(p.crouched&&!input.crouch){probe.min.set(p.pos.x-p.radius,p.pos.y+.04,p.pos.z-p.radius);probe.max.set(p.pos.x+p.radius,p.pos.y+1.8,p.pos.z+p.radius);for(let i=0;i<w.aabbs.length;i++)if(probe.intersectsBox(w.aabbs[i])){blocked=true;break;}}
  p.crouched=!!input.crouch||blocked;p.height=p.crouched?1.15:1.8;p.eye+=((p.crouched?1.02:1.65)-p.eye)*Math.min(1,dt*16);
  const f=Number(input.fwd)-Number(input.back),r=Number(input.right)-Number(input.left),len=Math.hypot(f,r)||1,speed=p.crouched?2.1:input.slow?2.5:5.6;
  const x=(-Math.sin(p.yaw)*f+Math.cos(p.yaw)*r)/len,z=(-Math.cos(p.yaw)*f-Math.sin(p.yaw)*r)/len;
  const friction=p.onGround?Math.exp(-9*dt):1;p.vel.x*=friction;p.vel.z*=friction;
  const accel=(p.onGround?48:12)*dt;p.vel.x+=x*accel;p.vel.z+=z*accel;
  const actual=Math.hypot(p.vel.x,p.vel.z);if(actual>speed){p.vel.x*=speed/actual;p.vel.z*=speed/actual;}
  if(input.jump&&!p.jumpHeld&&p.onGround){p.vel.y=6.2;p.onGround=false;}p.jumpHeld=!!input.jump;
  p.vel.y=Math.max(-35,p.vel.y-19.5*dt);p.onGround=collideMove(p.pos,p.vel,dt,p.radius,p.height,w.aabbs);
 };
 return p;
}
