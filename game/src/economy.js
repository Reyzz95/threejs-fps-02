import {WEAPONS} from './weapons.js';
export const SHOP=Object.values(WEAPONS).map(w=>({id:w.id,name:w.name,price:w.price,kind:'weapon'}));
SHOP.push({id:'armor',name:'Body armor',price:650,kind:'armor'},{id:'frag',name:'Frag grenade',price:300,kind:'grenade'},{id:'smoke',name:'Smoke grenade',price:300,kind:'grenade'});
const items=new Map(SHOP.map(item=>[item.id,item]));
export function createEconomy(){return{
 money:800,
 buy(id){const item=items.get(id);if(!item||this.money<item.price)return false;this.money-=item.price;return id;},
 awardKill(){this.money+=300;},
 awardRound(won){this.money+=won?3250:1900;},
 canAfford(id){const item=items.get(id);return !!item&&this.money>=item.price;}
};}
