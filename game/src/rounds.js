import {pointInSite} from './world.js';
import {createWeapon} from './weapons.js';
export function createRoundManager(ctx){
 const plantEvent={type:'plant',site:'A'};let activeSite=null,plantTick=0;
 const r={phase:'menu',round:0,score:{vanguard:0,jackals:0},timer:100,bomb:{state:'idle',site:null,timer:35},plantProgress:0,defuseProgress:0,endLeft:0,
  startMatch(){
   this.score.vanguard=0;this.score.jackals=0;this.round=0;ctx.economy.money=800;
   ctx.weapons.pistol=createWeapon('p9');ctx.weapons.primary=null;ctx.weapons.active='pistol';ctx.player.armor=0;
   ctx.grenades.frag=0;ctx.grenades.smoke=0;this.startRound();
  },
  startRound(){
   this.round++;this.phase='buy';this.timer=20;this.bomb.state='idle';this.bomb.site=null;this.bomb.timer=35;this.plantProgress=0;this.defuseProgress=0;this.endLeft=0;activeSite=null;plantTick=0;
   ctx.onRoundStart();
  },
  end(winner,reason){
   if(this.phase!=='live')return;
   this.score[winner]++;this.phase=this.score[winner]>=5||this.round>=9?'matchEnd':'roundEnd';this.endLeft=5;this.plantProgress=0;this.defuseProgress=0;
   ctx.economy.awardRound(winner==='vanguard');ctx.onRoundEnd(winner,reason);
  },
  update(dt){
   if(this.phase==='buy'){this.timer=Math.max(0,this.timer-dt);if(this.timer<=.00001){this.phase='live';this.timer=100;ctx.hud.hideBuy();ctx.hud.banner('','');}return;}
   if(this.phase==='roundEnd'){this.endLeft-=dt;if(this.endLeft<=0)this.startRound();return;}
   if(this.phase!=='live')return;
   this.timer=Math.max(0,this.timer-dt);
   const attack=ctx.attackingTeam,defend=attack==='vanguard'?'jackals':'vanguard',player=ctx.player,bots=ctx.bots,world=ctx.world;
   let va=player.hp>0?1:0,ja=0;
   for(let i=0;i<bots.length;i++)if(bots[i].alive&&bots[i].hp>0){if(bots[i].team==='vanguard')va++;else ja++;}
   if(this.bomb.state==='planted'){
    this.bomb.timer=Math.max(0,this.bomb.timer-dt);
    if(this.bomb.timer<=.00001){this.bomb.state='exploded';ctx.effects.explosion(world.sites[this.bomb.site].pos);ctx.audio.explosion();this.end(attack,'DEVICE DETONATED');return;}
   }
   if((attack==='vanguard'?ja:va)===0){this.end(attack,'ENEMY TEAM ELIMINATED');return;}
   if((attack==='vanguard'?va:ja)===0&&this.bomb.state!=='planted'){this.end(defend,'ENEMY TEAM ELIMINATED');return;}
   if(this.timer<=0&&this.bomb.state!=='planted'){this.end(defend,'TIME EXPIRED');return;}
   let site=null;
   if(pointInSite(player.pos,world.sites.A))site='A';else if(pointInSite(player.pos,world.sites.B))site='B';
   if(player.hp>0&&ctx.input.interact&&attack==='vanguard'&&this.bomb.state==='idle'&&site){
    if(activeSite!==site)this.plantProgress=0;activeSite=site;this.plantProgress=Math.min(1,this.plantProgress+dt/3);plantTick-=dt;
    if(plantTick<=0){ctx.audio.plantTick();plantTick=.4;}if(this.plantProgress>=1-.00001)plant(site);
   }else{this.plantProgress=0;activeSite=null;plantTick=0;}
   const playerDefuses=player.hp>0&&ctx.input.interact&&attack==='jackals'&&this.bomb.state==='planted'&&player.pos.distanceToSquared(world.sites[this.bomb.site].pos)<16;
   if(playerDefuses){this.defuseProgress=Math.min(1,this.defuseProgress+dt/5);if(this.defuseProgress>=1-.00001){this.bomb.state='defused';this.end('vanguard','DEVICE DEFUSED');return;}}else this.defuseProgress=0;
   for(let i=0;i<bots.length;i++){
    const b=bots[i];if(!b.alive||b.hp<=0){b.plant=0;b.defuse=0;continue;}
    const botSite=pointInSite(b.pos,world.sites.A)?'A':pointInSite(b.pos,world.sites.B)?'B':null;
    if(attack==='jackals'&&b===ctx.bombCarrier&&this.bomb.state==='idle'&&botSite&&b.state==='plant'){
     b.plant+=dt;if(b.plant>=3-.00001)plant(botSite);
    }else b.plant=0;
    if(b.team===defend&&this.bomb.state==='planted'&&b.state==='defuse'&&b.pos.distanceToSquared(world.sites[this.bomb.site].pos)<12){
     b.defuse+=dt;if(b.defuse>=5-.00001){this.bomb.state='defused';this.end(defend,'DEVICE DEFUSED');return;}
    }else b.defuse=0;
   }
  }
 };
 function plant(site){r.bomb.state='planted';r.bomb.site=site;r.bomb.timer=35;r.plantProgress=0;plantEvent.site=site;ctx.events.push(plantEvent);}
 return r;
}
