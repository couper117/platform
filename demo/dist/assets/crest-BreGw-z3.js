const h=t=>`data:image/svg+xml,${encodeURIComponent(t.replace(/\s+/g," ").trim())}`,p=t=>{let s=0;for(let o=0;o<t.length;o+=1)s=(s*31+t.charCodeAt(o))%360;return s};function d(t,s){const o=t.replace("#","");return o.length!==6?t:`#${[0,2,4].map(e=>{const r=parseInt(o.slice(e,e+2),16);return Math.round(r+(0-r)*Math.abs(s))}).map(e=>e.toString(16).padStart(2,"0")).join("")}`}const f=t=>{const s=/hsl\((\d+)/.exec(t),o=s?Number(s[1]):150,c=.55,e=.42,r=n=>(n+o/30)%12,i=c*Math.min(e,1-e),a=n=>{const l=e-i*Math.max(-1,Math.min(r(n)-3,Math.min(9-r(n),1)));return Math.round(255*l).toString(16).padStart(2,"0")};return`#${a(0)}${a(8)}${a(4)}`},g=(t,s)=>{const o=p(t||"x"),c=`hsl(${o} 62% 38%)`,e=d(c.startsWith("#")?c:f(c),-.35),r=`hsl(${(o+25)%360} 70% 55%)`;return h(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${e}"/></linearGradient>
        <radialGradient id="glow" cx="0.75" cy="0.2" r="0.8"><stop offset="0" stop-color="${r}" stop-opacity="0.55"/><stop offset="1" stop-color="${r}" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#c)"/><rect width="1200" height="675" fill="url(#glow)"/>
      <g opacity="0.12" stroke="#ffffff" stroke-width="3" fill="none"><circle cx="600" cy="337" r="120"/><path d="M0 500 L1200 250"/><path d="M0 620 L1200 370"/></g>
    </svg>`)};export{g as c};
