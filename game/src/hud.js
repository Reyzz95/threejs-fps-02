export function createHud(){
 const nodes={},cache=Object.create(null),feed=[],buttons=[];let round=0,phase='menu',hitUntil=0,damageUntil=0,onBuy=null,shop=null;
 const ids=['health-num','health-bar','armor-num','ammo-mag','ammo-reserve','weapon-name','money','timer','phase-label','score-vanguard','score-jackals','alive-vanguard','alive-jackals','hitmarker','killfeed','damage-dir','damage-vignette','buy-menu','buy-list','buy-close','banner','banner-title','banner-sub','bomb-bar','bomb-fill','bomb-label','grenade-count'];
 for(let i=0;i<ids.length;i++)nodes[ids[i]]=document.getElementById(ids[i]);
 function text(id,value){if(cache[id]!==value){cache[id]=value;nodes[id].textContent=value;}}
 function style(id,key,value){const tag=id+'.'+key;if(cache[tag]!==value){cache[tag]=value;nodes[id].style[key]=value;}}
 function hidden(id,value){const tag=id+'.hidden';if(cache[tag]!==value){cache[tag]=value;nodes[id].hidden=value;}}
 function label(){text('phase-label',phase==='buy'?'BUY PHASE':phase==='matchEnd'?'MATCH COMPLETE':phase==='roundEnd'?'ROUND COMPLETE':'ROUND '+String(round).padStart(2,'0'));}
 const hud={
  setHealth(hp,armor){text('health-num',Math.max(0,Math.ceil(hp)));text('armor-num',Math.max(0,Math.ceil(armor)));style('health-bar','width',Math.max(0,Math.min(100,hp))+'%');},
  setAmmo(mag,reserve,name){text('ammo-mag',mag);text('ammo-reserve','/ '+reserve);text('weapon-name',name.toUpperCase());},
  setMoney(money){text('money','$'+money);},
  setTimer(seconds,nextPhase){const s=Math.max(0,Math.ceil(seconds));text('timer',String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'));phase=nextPhase;label();style('timer','color',s<=15&&phase==='live'?'#ffac81':'');},
  setScore(a,b){text('score-vanguard',a);text('score-jackals',b);},
  setRound(n){round=n;label();},
  setAlive(a,b){text('alive-vanguard',a);text('alive-jackals',b);},
  setGrenades(frag,smoke){text('grenade-count','FRAG '+frag+' · SMOKE '+smoke);},
  hitmarker(kill){hitUntil=performance.now()+(kill?260:130);nodes.hitmarker.classList.add('on');style('hitmarker','color',kill?'#ffb078':'#f5e9d4');cache.hitOn=true;},
  killfeed(message){const row=document.createElement('div');row.textContent=message;nodes.killfeed.prepend(row);feed.push({node:row,expires:performance.now()+6500});while(feed.length>5)feed.shift().node.remove();},
  damageFrom(angle){damageUntil=performance.now()+450;style('damage-dir','transform','rotate('+angle+'rad)');style('damage-dir','opacity','1');style('damage-vignette','opacity','.65');},
  showBuy(list,money,callback){
   onBuy=callback;hidden('buy-menu',false);
   if(shop!==list){shop=list;nodes['buy-list'].replaceChildren();buttons.length=0;
    for(let i=0;i<list.length;i++){const item=list[i],button=document.createElement('button');button.type='button';button.textContent=item.name+' / $'+item.price;button.onclick=()=>{if(onBuy)onBuy(item.id);};nodes['buy-list'].appendChild(button);buttons.push({button,price:item.price,disabled:null});}
   }
   for(let i=0;i<buttons.length;i++){const b=buttons[i],disabled=b.price>money;if(b.disabled!==disabled){b.button.disabled=disabled;b.disabled=disabled;}}
  },
  hideBuy(){hidden('buy-menu',true);},
  banner(title,sub){hidden('banner',!title);text('banner-title',title||'');text('banner-sub',sub||'');},
  showBomb(progress,label){hidden('bomb-bar',!label);style('bomb-fill','width',(Math.round(Math.max(0,Math.min(1,progress))*1000)/10)+'%');text('bomb-label',label||'');},
  update(){
   const now=performance.now();if(cache.hitOn&&now>=hitUntil){nodes.hitmarker.classList.remove('on');cache.hitOn=false;}
   if(now>=damageUntil){style('damage-dir','opacity','0');style('damage-vignette','opacity','0');}
   while(feed.length&&feed[0].expires<=now)feed.shift().node.remove();
  }
 };
 nodes['buy-close'].onclick=()=>hud.hideBuy();return hud;
}
