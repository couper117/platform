const l=t=>`data:image/svg+xml,${encodeURIComponent(t.replace(/\s+/g," ").trim())}`,f=t=>{let o=0;for(let s=0;s<t.length;s+=1)o=(o*31+t.charCodeAt(s))%360;return o},g=(t,o=3)=>(t||"?").replace(/[^A-Za-z0-9\s]/g," ").trim().split(/\s+/).map(s=>s[0]).slice(0,o).join("").toUpperCase()||"?",x=t=>{const o=t.replace("#","");if(o.length!==6)return"#ffffff";const[s,r,e]=[0,2,4].map(n=>parseInt(o.slice(n,n+2),16));return(.299*s+.587*r+.114*e)/255>.6?"#0b0b0f":"#ffffff"};function h(t,o){const s=t.replace("#","");return s.length!==6?t:`#${[0,2,4].map(e=>{const n=parseInt(s.slice(e,e+2),16),i=o<0?0:255;return Math.round(n+(i-n)*Math.abs(o))}).map(e=>e.toString(16).padStart(2,"0")).join("")}`}const m=t=>`hsl(${f(t)} 55% 42%)`,p=t=>{const o=/hsl\((\d+)/.exec(t),s=o?Number(o[1]):150,r=.55,e=.42,n=c=>(c+s/30)%12,i=r*Math.min(e,1-e),a=c=>{const d=e-i*Math.max(-1,Math.min(n(c)-3,Math.min(9-n(c),1)));return Math.round(255*d).toString(16).padStart(2,"0")};return`#${a(0)}${a(8)}${a(4)}`},u=(t,o,s="#F4B400",r)=>{const e=o&&o.startsWith("#")?o:p(m(t||"x")),n=x(e),i=g(t),a=i.length>=3?20:26;return l(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${e}"/><stop offset="1" stop-color="${h(e,-.22)}"/></linearGradient></defs>
      <path d="M32 2 58 10 58 30 C58 46 46 56 32 62 18 56 6 46 6 30 L6 10 Z" fill="url(#g)" stroke="${s}" stroke-width="3"/>
      <path d="M6 24 H58" stroke="${s}" stroke-width="2" opacity="0.55"/>
      <text x="32" y="30" font-family="Arial, sans-serif" font-size="${a}" font-weight="800" fill="${n}" text-anchor="middle" dominant-baseline="middle">${i}</text>
      <text x="32" y="50" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="${n}" opacity="0.85" text-anchor="middle">${r??"RWANDA"}</text>
    </svg>`)},$=(t,o)=>{const s=f(t||"x"),r=`hsl(${s} 62% 38%)`,e=h(r.startsWith("#")?r:p(r),-.35),n=`hsl(${(s+25)%360} 70% 55%)`;return l(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${r}"/><stop offset="1" stop-color="${e}"/></linearGradient>
        <radialGradient id="glow" cx="0.75" cy="0.2" r="0.8"><stop offset="0" stop-color="${n}" stop-opacity="0.55"/><stop offset="1" stop-color="${n}" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#c)"/><rect width="1200" height="675" fill="url(#glow)"/>
      <g opacity="0.12" stroke="#ffffff" stroke-width="3" fill="none"><circle cx="600" cy="337" r="120"/><path d="M0 500 L1200 250"/><path d="M0 620 L1200 370"/></g>
    </svg>`)};export{u as a,$ as c};
