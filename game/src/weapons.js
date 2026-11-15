export const WEAPONS={
 p9:{id:'p9',name:'P9',price:300,damage:22,headMul:4,rpm:360,mag:12,reserve:60,spread:.005,moveSpread:.045,recoil:.018,auto:false,range:65,zoom:1,reload:1.35},
 smg:{id:'smg',name:'Duster',price:1500,damage:19,headMul:4,rpm:850,mag:30,reserve:120,spread:.012,moveSpread:.052,recoil:.014,auto:true,range:55,zoom:1,reload:1.8},
 vk47:{id:'vk47',name:'VK-47',price:2700,damage:25,headMul:4,rpm:600,mag:30,reserve:90,spread:.006,moveSpread:.065,recoil:.026,auto:true,range:110,zoom:1,reload:2.2},
 kestrel:{id:'kestrel',name:'Kestrel',price:3100,damage:28,headMul:4,rpm:660,mag:25,reserve:100,spread:.003,moveSpread:.047,recoil:.019,auto:true,range:120,zoom:1,reload:1.9},
 longshot:{id:'longshot',name:'Longshot',price:4750,damage:90,headMul:4,rpm:45,mag:5,reserve:25,spread:.001,moveSpread:.12,recoil:.085,auto:false,range:180,zoom:3.2,reload:2.8}
};
export function createWeapon(id){const def=WEAPONS[id];if(!def)throw new Error('Unknown weapon '+id);return {def,mag:def.mag,reserve:def.reserve,cooldown:0,reloading:false,reloadEnd:0,result:{fired:true,spread:0,recoil:0}};}
export function canFire(s,now){return !s.reloading&&s.mag>0&&now>=s.cooldown;}
export function fireWeapon(s,now,moving,crouched){if(!canFire(s,now))return null;s.mag--;s.cooldown=now+60/s.def.rpm;s.result.spread=(s.def.spread+s.def.moveSpread*Math.min(1,typeof moving==='number'?moving/5.6:moving?1:0))*(crouched?.55:1);s.result.recoil=s.def.recoil*(crouched?.72:1);return s.result;}
export function startReload(s,now){if(s.reloading||s.mag===s.def.mag||!s.reserve)return false;s.reloading=true;s.reloadEnd=now+s.def.reload;return true;}
export function finishReload(s){if(!s.reloading)return false;const n=Math.min(s.def.mag-s.mag,s.reserve);s.mag+=n;s.reserve-=n;s.reloading=false;return true;}
