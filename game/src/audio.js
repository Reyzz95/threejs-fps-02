const SHOTS={p9:[1600,.07,130,.10,.12],smg:[2300,.05,170,.065,.08],vk47:[1200,.11,110,.14,.15],kestrel:[1900,.085,145,.12,.12],longshot:[850,.23,65,.26,.24]};
export function createAudio(){
 let context=null,master=null,noise=null;
 function tone(frequency,duration,type='sine',volume=.04,end=frequency,delay=0){
  if(!context)return;const start=context.currentTime+delay,o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.setValueAtTime(frequency,start);o.frequency.exponentialRampToValueAtTime(Math.max(10,end),start+duration);g.gain.setValueAtTime(volume,start);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g);g.connect(master);o.start(start);o.stop(start+duration+.02);
 }
 function hiss(duration,frequency,volume,delay=0){
  if(!context)return;const start=context.currentTime+delay,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=noise;filter.type='lowpass';filter.frequency.setValueAtTime(frequency,start);filter.frequency.exponentialRampToValueAtTime(Math.max(70,frequency*.13),start+duration);gain.gain.setValueAtTime(volume,start);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);source.connect(filter);filter.connect(gain);gain.connect(master);source.start(start,0,duration);source.stop(start+duration+.02);
 }
 return {
  unlock(){
   if(!context){const Constructor=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Constructor)return;
    try{context=new Constructor();const compressor=context.createDynamicsCompressor();compressor.threshold.value=-12;compressor.ratio.value=5;master=context.createGain();master.gain.value=.65;master.connect(compressor);compressor.connect(context.destination);noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const data=noise.getChannelData(0);let seed=19873;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;data[i]=(seed>>>0)/2147483648-1;}}catch{context=null;return;}
   }
   if(context.state==='suspended')context.resume().catch(()=>{});
  },
  shot(id){if(!context)return;const p=SHOTS[id]||SHOTS.p9;hiss(p[1],p[0],p[4]);tone(p[2],p[3],'triangle',p[4]*1.2,30);tone(2100,.018,'square',.012,800);},
  reload(){if(!context)return;hiss(.055,2200,.045);tone(680,.05,'square',.016,340,.15);hiss(.07,2900,.05,.55);tone(320,.06,'triangle',.035,140,.8);},
  step(){if(!context)return;hiss(.075,440,.045);tone(80,.045,'triangle',.025,40);},
  beep(){tone(1350,.09,'sine',.055,1250);},
  plantTick(){tone(860,.045,'square',.018,760);},
  explosion(){if(!context)return;hiss(1.25,1400,.38);tone(75,1.1,'triangle',.35,18);tone(130,.5,'sawtooth',.035,25);},
  roundWin(){tone(440,.28,'triangle',.065);tone(554,.3,'triangle',.055,554,.16);tone(660,.6,'triangle',.06,660,.33);},
  roundLose(){tone(330,.3,'triangle',.055);tone(247,.4,'triangle',.05,220,.2);tone(165,.65,'triangle',.05,110,.4);},
  click(){tone(1000,.025,'square',.018,700);},
  dryFire(){tone(180,.035,'square',.022,90);}
 };
}
