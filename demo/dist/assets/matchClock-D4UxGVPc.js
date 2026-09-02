import{s as u}from"./index-DOyBmSMC.js";/**
 * @license lucide-react v0.363.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=u("Play",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);/**
 * @license lucide-react v0.363.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=u("Square",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}]]),E={PRE:"Not started",FIRST_HALF:"First half",HALF_TIME:"Half time",SECOND_HALF:"Second half",FULL_TIME:"Full time"},i={PRE:{base:0,end:0},FIRST_HALF:{base:0,end:45},HALF_TIME:{base:45,end:45},SECOND_HALF:{base:45,end:90},FULL_TIME:{base:90,end:90}},m=15,p=t=>{const s=Math.max(0,t);return`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`},L=t=>t?{...t,readAtMs:Date.now()}:null,F=(t,s)=>{if(!t)return{period:"PRE",running:!1,minute:0,stoppage:0,addedMinutes:0,display:"0'",mmss:"00:00"};const a=i[t.period]||i.PRE;if(!t.running)return{...t,stoppage:0,display:`${t.minute}'`,mmss:p(t.minute*60)};const M=Math.max(0,Math.floor((s-(t.readAtMs??s))/1e3)),o=(t.elapsedSeconds||0)+M,r=a.base+Math.floor((o-a.base*60)/60),e=Math.min(r,a.end),d=Math.max(0,r-a.end),n=Math.min(d,m);return{...t,minute:e,stoppage:n,stalled:d>m,display:n>0?`${e}+${n}'`:`${e}'`,mmss:p(o)}};export{h as P,l as S,E as a,L as s,F as t};
