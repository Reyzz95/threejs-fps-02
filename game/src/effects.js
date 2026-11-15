import * as T from 'three';
export function createEffects(scene){
 const traces=[],particles=[],flashes=[],clouds=[],up=new T.Vector3(0,1,0),delta=new T.Vector3();let traceIndex=0,particleIndex=0,flashIndex=0,cloudIndex=0,seed=17731;
 function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;}
 const sphere=new T.SphereGeometry(1,8,6),line=new T.CylinderGeometry(.012,.012,1,5),smokeGeometry=new T.IcosahedronGeometry(1,2);
 for(let i=0;i<64;i++){const mesh=new T.Mesh(line,new T.MeshBasicMaterial({color:0xffdc9a,transparent:true,depthWrite:false}));mesh.visible=false;scene.add(mesh);traces.push({mesh,life:0});}
 for(let i=0;i<180;i++){const mesh=new T.Mesh(sphere,new T.MeshBasicMaterial({color:0xffc27a,transparent:true,depthWrite:false}));mesh.visible=false;scene.add(mesh);particles.push({mesh,vel:new T.Vector3(),life:0,total:1,drag:1});}
 for(let i=0;i<10;i++){const mesh=new T.Mesh(new T.OctahedronGeometry(1),new T.MeshBasicMaterial({color:0xffd39a,transparent:true,depthWrite:false})),light=new T.PointLight(0xffa65c,0,5);mesh.visible=false;scene.add(mesh,light);flashes.push({mesh,light,life:0,total:1});}
 for(let i=0;i<4;i++){
  const cloud={pos:new T.Vector3(),life:0,age:0,radius:0,lobes:[]};
  for(let j=0;j<8;j++){const material=new T.MeshStandardMaterial({color:0xb5b5a6,transparent:true,opacity:0,depthWrite:false,roughness:1}),mesh=new T.Mesh(smokeGeometry,material);mesh.visible=false;scene.add(mesh);cloud.lobes.push({mesh,offset:new T.Vector3(),scale:1});}clouds.push(cloud);
 }
 function burst(pos,count,speed,color,life,size){
  for(let i=0;i<count;i++){const p=particles[particleIndex++%particles.length];p.mesh.position.copy(pos);p.mesh.scale.setScalar(size*(.5+random()));p.mesh.material.color.set(color);p.mesh.material.opacity=1;p.mesh.visible=true;p.total=p.life=life*(.5+random()*.7);p.vel.set((random()-.5)*speed,random()*speed*.8,(random()-.5)*speed);p.drag=speed>8?1.5:3;}
 }
 const fx={
  tracer(from,to,color=0xffd59a){const p=traces[traceIndex++%traces.length];delta.subVectors(to,from);const length=delta.length();if(length<.001)return;p.mesh.position.copy(from).addScaledVector(delta,.5);p.mesh.scale.set(1,length,1);p.mesh.quaternion.setFromUnitVectors(up,delta.multiplyScalar(1/length));p.mesh.material.color.set(color);p.mesh.material.opacity=1;p.mesh.visible=true;p.life=.1;},
  muzzle(pos,dir){const f=flashes[flashIndex++%flashes.length];f.mesh.position.copy(pos).addScaledVector(dir,.35);f.mesh.scale.set(.09,.09,.2);f.mesh.quaternion.setFromUnitVectors(up,dir);f.mesh.material.opacity=1;f.mesh.visible=true;f.life=f.total=.045;f.light.position.copy(f.mesh.position);f.light.intensity=4;},
  impact(pos){burst(pos,7,3.5,0xffce8b,.3,.035);},
  explosion(pos){burst(pos,100,15,0xffb262,1.15,.12);const f=flashes[flashIndex++%flashes.length];f.mesh.position.copy(pos);f.mesh.scale.setScalar(1.7);f.mesh.material.opacity=.9;f.mesh.visible=true;f.life=f.total=.28;f.light.position.copy(pos);f.light.intensity=45;},
  smoke(pos){const c=clouds[cloudIndex++%clouds.length];c.pos.copy(pos);c.pos.y+=1.35;c.life=16;c.age=0;c.radius=.5;
   for(let i=0;i<c.lobes.length;i++){const l=c.lobes[i];l.offset.set((random()-.5)*3,(random()-.5)*1.4,(random()-.5)*3);l.scale=1.4+random()*.6;l.mesh.position.copy(c.pos).add(l.offset);l.mesh.scale.setScalar(.4);l.mesh.material.opacity=0;l.mesh.visible=true;}
  },
  update(dt){
   for(let i=0;i<traces.length;i++){const p=traces[i];if(p.life<=0)continue;p.life=Math.max(0,p.life-dt);p.mesh.visible=p.life>0;p.mesh.material.opacity=p.life*10;}
   for(let i=0;i<particles.length;i++){const p=particles[i];if(p.life<=0)continue;p.life=Math.max(0,p.life-dt);p.mesh.visible=p.life>0;p.mesh.position.addScaledVector(p.vel,dt);p.vel.multiplyScalar(Math.exp(-p.drag*dt));p.vel.y-=9*dt;if(p.mesh.position.y<.04){p.mesh.position.y=.04;p.vel.y=Math.abs(p.vel.y)*.3;}p.mesh.material.opacity=Math.min(1,p.life/p.total*2);}
   for(let i=0;i<flashes.length;i++){const f=flashes[i];if(f.life<=0)continue;f.life=Math.max(0,f.life-dt);f.mesh.visible=f.life>0;f.mesh.material.opacity=f.life/f.total;f.light.intensity*=Math.exp(-dt*35);if(!f.life)f.light.intensity=0;}
   for(let i=0;i<clouds.length;i++){const c=clouds[i];if(c.life<=0)continue;c.life=Math.max(0,c.life-dt);c.age+=dt;c.radius=Math.min(4,.5+c.age*2.6);const grow=Math.min(1,c.age*1.4),fade=Math.min(1,c.life/3);
    for(let j=0;j<c.lobes.length;j++){const l=c.lobes[j];l.mesh.visible=c.life>0;l.mesh.position.copy(c.pos).addScaledVector(l.offset,grow);l.mesh.scale.setScalar(l.scale*grow);l.mesh.rotation.y+=dt*(j%2?.04:-.04);l.mesh.material.opacity=.64*grow*fade;}
   }
  },
  blocks(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,length=dx*dx+dy*dy+dz*dz;if(length<.0001)return false;
   for(let i=0;i<clouds.length;i++){const c=clouds[i];if(c.life<=1||c.age<.2)continue;const x=c.pos.x-a.x,y=c.pos.y-a.y,z=c.pos.z-a.z,t=Math.max(0,Math.min(1,(x*dx+y*dy+z*dz)/length)),ex=x-dx*t,ey=y-dy*t,ez=z-dz*t;if(ex*ex+ey*ey+ez*ez<c.radius*c.radius)return true;}return false;
  }
 };
 return fx;
}
