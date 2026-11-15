import * as T from 'three';
const ray=new T.Ray(),delta=new T.Vector3(),at=new T.Vector3();
export function collideMove(pos,vel,dt,radius,height,aabbs){
 let grounded=false;
 for(let axis=0;axis<3;axis++){
  const key=axis===0?'x':axis===1?'z':'y',old=pos[key],motion=vel[key]*dt;pos[key]+=motion;
  for(let i=0;i<aabbs.length;i++){
   const b=aabbs[i];if(pos.x+radius<=b.min.x||pos.x-radius>=b.max.x||pos.z+radius<=b.min.z||pos.z-radius>=b.max.z||pos.y+height<=b.min.y+.001||pos.y>=b.max.y-.001)continue;
   if(key==='y'){if(motion<=0&&old>=b.max.y-.05){pos.y=b.max.y;grounded=true;}else if(motion>0)pos.y=b.min.y-height;else continue;}
   else pos[key]=motion>0?b.min[key]-radius:b.max[key]+radius;
   vel[key]=0;
  }
 }
 if(pos.y<=0){pos.y=0;if(vel.y<=0){vel.y=0;grounded=true;}}
 return grounded;
}
export function hasLineOfSight(a,b,aabbs){delta.subVectors(b,a);const length=delta.length();if(length<.001)return true;ray.set(a,delta.multiplyScalar(1/length));for(let i=0;i<aabbs.length;i++)if(ray.intersectBox(aabbs[i],at)&&at.distanceToSquared(a)<length*length-.02)return false;return true;}
export function pointInSite(pos,site){const p=site.pos;return Math.abs(pos.x-p.x)<4.6&&Math.abs(pos.z-p.z)<4.6&&Math.abs(pos.y-p.y)<2.5;}
export function buildWorld(scene){
 const aabbs=[],shootables=[],group=new T.Group();scene.add(group);
 const colors={sand:0xb59b76,wall:0xbda27d,edge:0x685e51,rust:0x985137,steel:0x314c4c,dark:0x26383b,teal:0x70dac5,paint:0xf4cf8a};
 const mats={};for(const k in colors)mats[k]=new T.MeshStandardMaterial({color:colors[k],roughness:.86,metalness:k==='steel'?.45:.08,emissive:k==='teal'?0x247a6a:0,emissiveIntensity:1.3});
 function box(x,y,z,w,h,d,mat='wall',solid=true){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mats[mat]);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);if(solid){aabbs.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));shootables.push(m);}return m;}
 function cylinder(x,y,z,r,h,mat='steel'){const m=new T.Mesh(new T.CylinderGeometry(r,r,h,24),mats[mat]);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 function sign(text,x,y,z,w=5,color='#f6d9a2',rotation=0){const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.fillStyle='#243b3c';g.fillRect(0,0,512,128);g.strokeStyle=color;g.lineWidth=5;g.strokeRect(9,9,494,110);g.fillStyle=color;g.font='bold 65px monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(text,256,67);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,w/4),new T.MeshStandardMaterial({map:tex,roughness:.8}));m.position.set(x,y,z);m.rotation.y=rotation;group.add(m);return m;}
 box(0,-.3,0,66,.6,54,'sand',false);
 box(-33,3,0,1,6,54);box(33,3,0,1,6,54);box(0,3,-27,66,6,1);box(0,3,27,66,6,1);
 for(let i=-30;i<=30;i+=6){box(i,6.15,-27,.3,.4,1.3,'edge',false);box(i,6.15,27,.3,.4,1.3,'edge',false);}
 // The open mid connects two offset industrial yards.
 box(-12,2.5,-8,16,5,3);box(12,2.5,8,16,5,3);box(-7,2.5,13,3,5,12);box(7,2.5,-13,3,5,12);
 box(-25,2.8,10,11,5.6,3);box(25,2.8,-10,11,5.6,3);
 function container(x,z,mat,label){box(x,1.5,z,7,3,3,mat);for(let i=0;i<14;i++)box(x-3.25+i*.5,1.5,z+1.53,.07,2.8,.05,'edge',false);box(x,3.08,z,7.1,.16,3.1,'edge',false);sign(label,x,1.7,z+1.57,3.2);}
 container(-17,-21,'steel','D / 04');container(17,21,'rust','D / 09');container(17,-18,'steel','YARD 02');container(-18,18,'rust','FREIGHT');
 function crate(x,z,size=1.8){box(x,size/2,z,size,size,size,'rust');box(x,size+.06,z,size+.12,.12,size+.12,'edge',false);for(const dx of [-.36,.36])box(x+size*dx,size/2,z+size/2+.03,.09,size,.06,'sand',false);}
 crate(-2,-4);crate(3,5);crate(-24,-11,2.2);crate(-14,-14,2.5);crate(20,10,2.4);crate(24,16);crate(-26,3);crate(28,-4);
 for(const x of [24,28]){cylinder(x,4,-20,1.65,8);cylinder(x,8.1,-20,1.8,.25,'edge');cylinder(x,.3,-20,1.9,.6,'edge');aabbs.push(new T.Box3(new T.Vector3(x-1.65,0,-21.65),new T.Vector3(x+1.65,8,-18.35)));for(let j=1;j<4;j++)cylinder(x,j*2,-20,1.69,.1,'edge');}
 for(const z of [-24.8,24.8]){const pipe=cylinder(0,4.6,z,.25,59,'rust');pipe.rotation.z=Math.PI/2;for(let x=-28;x<30;x+=8)box(x,2.2,z,.16,4.4,.16,'steel',false);}
 // Watchtower and the distant refinery silhouette.
 for(const x of [-29,-25])for(const z of [19,23])box(x,4,z,.25,8,.25,'steel',false);
 box(-27,7,21,5,.3,5,'steel');box(-27,9.8,21,5.5,.3,5.5,'rust',false);
 for(const x of [-29,-25])box(x,8.4,21,.15,2.6,5,'edge',false);box(-27,8.3,23.4,4.8,2.3,.15,'edge',false);
 for(let i=0;i<12;i++)box(-29.5,1+i*.5,18.4,.9,.08,.15,'steel',false);
 for(let i=0;i<16;i++){const x=-70+i*9,z=-42-(i%3)*5;box(x,4+(i%4),z,5,8+(i%4)*2,5,'edge',false);if(i%3===0)cylinder(x,12,z,1,15,'rust');}
 const sites={A:{pos:new T.Vector3(-20,0,-15)},B:{pos:new T.Vector3(20,0,15)}};
 for(const k in sites){const p=sites[k].pos;for(const dz of [-4.5,4.5])box(p.x,.025,p.z+dz,9,.05,.12,'paint',false);for(const dx of [-4.5,4.5])box(p.x+dx,.025,p.z,.12,.05,9,'paint',false);const m=sign(k,p.x,.045,p.z,5.4);m.rotation.x=-Math.PI/2;sign('SITE '+k,p.x,3.9,k==='A'?-26.4:26.4,6,'#77ddc6',k==='A'?0:Math.PI);}
 sign('DUSTLINE',0,4.4,-26.4,9);sign('MID / 03',-11,3.2,-6.45,4);sign('VANGUARD',-32.4,3,0,5,'#77ddc6',Math.PI/2);sign('JACKALS',32.4,3,0,5,'#ffb078',-Math.PI/2);
 for(const x of [-30,0,30]){box(x,5,-25,.12,10,.12,'steel',false);box(x,9.5,-24.5,1,.16,1,'teal',false);}
 scene.add(new T.HemisphereLight(0x9ebcbe,0x69503b,2.2));
 const sun=new T.DirectionalLight(0xffbd81,3.5);sun.position.set(-25,35,-35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-42,right:42,top:36,bottom:-36,near:1,far:120});sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;scene.add(sun);
 const disk=new T.Mesh(new T.SphereGeometry(5,24,16),new T.MeshBasicMaterial({color:0xffb576,fog:false}));disk.position.set(-60,29,-100);scene.add(disk);
 const spawns={vanguard:[],jackals:[]};for(let i=0;i<5;i++){spawns.vanguard.push(new T.Vector3(-28,0,(i-2)*1.8));spawns.jackals.push(new T.Vector3(28,0,(i-2)*1.8));}
 const waypoints=[];for(const z of [-15,0,15])for(let x=-27;x<=27;x+=9)waypoints.push({pos:new T.Vector3(x,0,z),lane:z<0?'A':z>0?'B':'mid'});
 return {aabbs,sites,spawns,waypoints,bounds:new T.Box3(new T.Vector3(-32.5,0,-26.5),new T.Vector3(32.5,16,26.5)),shootables,group,update(dt){}};
}
