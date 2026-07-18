(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&r(a)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();const q=Math.PI*2,Le=.025;function E(e,t){return t.reduce((n,r)=>{if(!r.enabled)return n;const o=Pe(e,r);return n.x+=o.x,n.y+=o.y,n},{x:0,y:0})}function Pe(e,t){if(t.kind==="uniform")return{x:t.strength*Math.cos(t.angle),y:t.strength*Math.sin(t.angle)};const n=e.x-t.x,r=e.y-t.y,o=Math.max(n*n+r*r,Le);if(t.kind==="source"||t.kind==="sink"){const S=(t.kind==="source"?1:-1)*t.strength/(q*o);return{x:S*n,y:S*r}}if(t.kind==="vortex"){const u=-t.strength/(q*o);return{x:-u*r,y:u*n}}const s=Math.cos(t.angle),a=Math.sin(t.angle),c=s*n+a*r,l=-t.strength/(q*o*o);return{x:l*(s*o-2*n*c),y:l*(a*o-2*r*c)}}function M(e){return Math.hypot(e.x,e.y)}function xe(e){switch(e){case"uniform":return"Uniform";case"source":return"Source";case"sink":return"Sink";case"doublet":return"Doublet";case"vortex":return"Vortex"}}const $=1060,R=560,h=7,g=3.7,ee=.25,Ie=14,te=80,L=.25,Ae=2e3,Te=.045,$e=620,ne=.24,Re=4,oe=12,_e=4.5,Ce=12,re=.12,Ne=.55,Fe=3,F=118,V=70,W=3,Ve=1,De=.62,D=90,O=54,Oe=.08,He=28,d={showStreamlines:!0,showVectors:!0,showSeeds:!1,showPressureField:!1,pressureMode:"dynamic",showStagnationPoints:!0,selectedFlowId:null,flows:[],sideFlows:we()};let I=null,H=null,G=null;const me=document.querySelector("#app");if(!me)throw new Error("App root was not found.");me.innerHTML=`
  <main class="workbench" aria-label="Potential flow streamline workbench">
    <aside class="panel">
      <header class="panel-header">
        <h1>StreamLines</h1>
        <p>Compose ideal-flow primitives and watch the streamline field respond.</p>
      </header>

      <section class="control-group" aria-labelledby="add-flow-label">
        <h2 id="add-flow-label">Add Primitive</h2>
        <div class="button-grid">
          <button class="flow-add flow-add-source" type="button" data-kind="source">
            <svg class="primitive-symbol" viewBox="0 0 40 40" aria-hidden="true">
              <defs>
                <marker id="source-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                  <path d="M0 0 L5 2.5 L0 5 Z"></path>
                </marker>
              </defs>
              <circle cx="20" cy="20" r="2.8"></circle>
              <path marker-end="url(#source-arrow)" d="M20 17 L20 5 M23 17 L31 9 M23 20 L35 20 M23 23 L31 31 M20 23 L20 35 M17 23 L9 31 M17 20 L5 20 M17 17 L9 9"></path>
            </svg>
            Source
          </button>
          <button class="flow-add flow-add-sink" type="button" data-kind="sink">
            <svg class="primitive-symbol" viewBox="0 0 40 40" aria-hidden="true">
              <defs>
                <marker id="sink-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                  <path d="M0 0 L5 2.5 L0 5 Z"></path>
                </marker>
              </defs>
              <circle cx="20" cy="20" r="2.8"></circle>
              <path marker-end="url(#sink-arrow)" d="M20 5 L20 17 M31 9 L23 17 M35 20 L23 20 M31 31 L23 23 M20 35 L20 23 M9 31 L17 23 M5 20 L17 20 M9 9 L17 17"></path>
            </svg>
            Sink
          </button>
          <button class="flow-add flow-add-doublet" type="button" data-kind="doublet">
            <svg class="primitive-symbol" viewBox="0 0 40 40" aria-hidden="true">
              <rect x="15" y="18" width="10" height="4" rx="2"></rect>
              <path d="M15 20 C6 13, 6 27, 15 20 M25 20 C34 13, 34 27, 25 20"></path>
              <path d="M15 16 C10 6, 30 6, 25 16 M15 24 C10 34, 30 34, 25 24"></path>
            </svg>
            Doublet
          </button>
          <button class="flow-add flow-add-vortex" type="button" data-kind="vortex">
            <svg class="primitive-symbol vortex-button-symbol" viewBox="0 0 48 48" aria-hidden="true">
              <defs>
                <marker id="vortex-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                  <path d="M0 0 L5 2.5 L0 5 Z"></path>
                </marker>
              </defs>
              <circle class="symbol-outline" cx="24" cy="24" r="18"></circle>
              <path marker-end="url(#vortex-arrow)" d="M24 12 A12 12 0 1 1 15.5 32.5"></path>
            </svg>
            Vortex
          </button>
        </div>
        <p class="primitive-note">Vortex circulation Γ: positive is clockwise.</p>
      </section>

      <section class="control-group" aria-labelledby="flows-label">
        <h2 id="flows-label">Active Flows</h2>
        <div id="flow-list" class="flow-list"></div>
      </section>

      <section class="control-group" aria-labelledby="editor-label">
        <h2 id="editor-label">Selected Flow</h2>
        <div id="flow-editor" class="editor-empty">Select a flow to edit its parameters.</div>
      </section>

      <section class="pane-footer" aria-label="Visualization controls">
        <label class="toggle">
          <input id="toggle-streamlines" type="checkbox" checked />
          Streamlines
        </label>
        <label class="toggle">
          <input id="toggle-vectors" type="checkbox" checked />
          Velocity vectors
        </label>
        <label class="toggle">
          <input id="toggle-seeds" type="checkbox" />
          Seed points
        </label>
        <label class="toggle">
          <input id="toggle-pressure" type="checkbox" />
          Pressure field
        </label>
        <label class="footer-field">
          <span>Pressure mode</span>
          <select id="pressure-mode">
            <option value="dynamic">Dynamic q*</option>
            <option value="static">Static Cp</option>
          </select>
        </label>
        <p class="pressure-note">q* = |V|^2 / Uref^2; Cp = 1 - q*. Blue is lower pressure; red is higher pressure.</p>
        <label class="toggle">
          <input id="toggle-stagnation" type="checkbox" checked />
          Stagnation points
        </label>
        <button id="reset-case" type="button">Reset</button>
      </section>
    </aside>

    <section class="stage-shell">
      <div class="boundary-layout" aria-label="Boundary uniform flow controls">
        <div id="side-top" class="side-control side-control-top"></div>
        <div id="side-left" class="side-control side-control-left"></div>
        <canvas id="flow-canvas" width="${$}" height="${R}" aria-label="Canvas showing potential flow streamlines"></canvas>
        <div id="primitive-tooltip" class="primitive-tooltip" role="status" aria-live="polite" hidden></div>
        <div id="side-right" class="side-control side-control-right"></div>
        <div id="side-bottom" class="side-control side-control-bottom"></div>
      </div>
      <div id="readout" class="readout">x 0.00, y 0.00, |V| 0.00</div>
    </section>
  </main>
`;const p=x("#flow-canvas"),i=qe(p),se=x("#flow-list"),T=x("#flow-editor"),be=x("#readout"),_=x("#primitive-tooltip"),ie=x("#toggle-streamlines"),ae=x("#toggle-vectors"),ce=x("#toggle-seeds"),le=x("#toggle-pressure"),de=x("#pressure-mode"),ue=x("#toggle-stagnation"),Ge=x("#reset-case"),Be=new Map([["left",x("#side-left")],["right",x("#side-right")],["top",x("#side-top")],["bottom",x("#side-bottom")]]),m=getComputedStyle(document.documentElement),v={background:m.getPropertyValue("--canvas-background").trim(),grid:m.getPropertyValue("--canvas-grid").trim(),axis:m.getPropertyValue("--canvas-axis").trim(),streamline:m.getPropertyValue("--streamline").trim(),streamlineMuted:m.getPropertyValue("--streamline-muted").trim(),stagnation:m.getPropertyValue("--stagnation-point").trim(),stagnationStroke:m.getPropertyValue("--stagnation-point-stroke").trim(),vector:m.getPropertyValue("--vector").trim(),marker:m.getPropertyValue("--marker").trim(),markerStroke:m.getPropertyValue("--marker-stroke").trim()},Ue={source:m.getPropertyValue("--flow-source").trim(),sink:m.getPropertyValue("--flow-sink").trim(),doublet:m.getPropertyValue("--flow-doublet").trim(),vortex:m.getPropertyValue("--flow-vortex").trim()};function x(e){const t=document.querySelector(e);if(!t)throw new Error(`Required element ${e} was not created.`);return t}function qe(e){const t=e.getContext("2d");if(!t)throw new Error("Canvas 2D context is not available.");return t}document.querySelectorAll(".flow-add").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.kind,n=We(t);d.flows.push(n),d.selectedFlowId=n.id,C(),y()})});ie.addEventListener("change",()=>{d.showStreamlines=ie.checked,y()});ae.addEventListener("change",()=>{d.showVectors=ae.checked,y()});ce.addEventListener("change",()=>{d.showSeeds=ce.checked,y()});le.addEventListener("change",()=>{d.showPressureField=le.checked,y()});de.addEventListener("change",()=>{d.pressureMode=de.value,y()});ue.addEventListener("change",()=>{d.showStagnationPoints=ue.checked,y()});Ge.addEventListener("click",()=>{d.flows=[{id:crypto.randomUUID(),kind:"doublet",name:"Doublet 1",x:0,y:0,strength:5,angle:0,enabled:!0}],d.sideFlows=we(),d.selectedFlowId=d.flows[0]?.id??null,C(),y()});p.addEventListener("mousemove",e=>{const t=p.getBoundingClientRect(),n=Z({x:e.clientX-t.left,y:e.clientY-t.top}),r=ke({x:e.clientX-t.left,y:e.clientY-t.top}),o=E(n,k());be.textContent=`x ${n.x.toFixed(2)}, y ${n.y.toFixed(2)}, |V| ${M(o).toFixed(2)}`,p.classList.toggle("is-draggable",!!r),ft(r)});p.addEventListener("mouseleave",()=>{be.textContent="x 0.00, y 0.00, |V| 0.00",p.classList.remove("is-draggable"),A()});p.addEventListener("pointerdown",e=>{const t=p.getBoundingClientRect(),n={x:e.clientX-t.left,y:e.clientY-t.top},r=ke(n);if(!r){A();return}A(),d.selectedFlowId=r.id,I={flowId:r.id},p.setPointerCapture(e.pointerId),p.classList.add("is-dragging"),Ee(r,n),C(),y()});p.addEventListener("pointermove",e=>{if(!I)return;const t=d.flows.find(r=>r.id===I?.flowId);if(!t){I=null,p.classList.remove("is-dragging"),A();return}const n=p.getBoundingClientRect();Ee(t,{x:e.clientX-n.left,y:e.clientY-n.top}),ve(),y()});p.addEventListener("pointerup",e=>{I=null,p.releasePointerCapture(e.pointerId),p.classList.remove("is-dragging")});p.addEventListener("pointercancel",e=>{I=null,p.releasePointerCapture(e.pointerId),p.classList.remove("is-dragging"),A()});function We(e){const t=d.flows.filter(r=>r.kind===e).length+1,n={uniform:{x:0,y:0,strength:1,angle:0},source:{x:-1.25,y:0,strength:4,angle:0},sink:{x:1.25,y:0,strength:4,angle:0},doublet:{x:0,y:0,strength:5,angle:0},vortex:{x:0,y:0,strength:5,angle:0}};return{id:crypto.randomUUID(),kind:e,name:`${xe(e)} ${t}`,enabled:!0,...n[e]}}function C(){Xe(),se.innerHTML="",d.flows.forEach(e=>{const t=document.createElement("div");t.className=`flow-row${e.id===d.selectedFlowId?" selected":""}`,t.style.setProperty("--flow-color",e.kind==="uniform"?v.marker:z(e));const n=document.createElement("button");n.type="button",n.className="flow-select",n.textContent=e.name,n.addEventListener("click",()=>{d.selectedFlowId=e.id,C(),y()});const r=document.createElement("input");r.type="checkbox",r.checked=e.enabled,r.ariaLabel=`Enable ${e.name}`,r.addEventListener("change",()=>{e.enabled=r.checked,y()});const o=document.createElement("button");o.type="button",o.className="remove-flow",o.textContent="Remove",o.addEventListener("click",()=>{d.flows=d.flows.filter(s=>s.id!==e.id),d.selectedFlowId===e.id&&(d.selectedFlowId=d.flows[0]?.id??null),C(),y()}),t.append(r,n,o),se.append(t)}),ve()}function Xe(){d.sideFlows.forEach(e=>{const t=Be.get(e.side);if(!t)return;const n=j(e.angleOffset),r=e.side[0].toUpperCase()+e.side.slice(1),o=Y(e.side);t.innerHTML=`
      <label class="side-toggle">
        <input type="checkbox" data-side-toggle="${e.side}" ${e.enabled?"checked":""} />
        ${r}
      </label>
      <label class="side-slider side-speed">
        <span>V <output>${e.speed.toFixed(1)}</output></span>
        <input type="range" min="0" max="5" step="0.1" value="${e.speed}" data-side-speed="${e.side}" />
      </label>
      <div class="side-angle" data-side-angle="${e.side}">
        <span>A <output>${n.toFixed(0)} deg</output></span>
        <svg viewBox="0 0 120 72" aria-hidden="true">
          <path class="angle-arc-track" d="${o.arcPath}"></path>
          <path class="angle-arc-flat" d="${o.flatPath}"></path>
          <line class="angle-arc-line" x1="${o.center.x}" y1="${o.center.y}" x2="${o.center.x}" y2="${o.center.y}"></line>
          <circle class="angle-arc-handle" cx="${o.center.x}" cy="${o.center.y}" r="6"></circle>
        </svg>
      </div>
    `;const s=P(t,`[data-side-toggle="${e.side}"]`),a=P(t,`[data-side-speed="${e.side}"]`),c=P(t,`[data-side-angle="${e.side}"]`);Se(c,e.side,n),s.addEventListener("change",()=>{e.enabled=s.checked,y()}),a.addEventListener("input",()=>{e.speed=Number(a.value);const l=P(t,".side-speed output");l.textContent=e.speed.toFixed(1),y()}),c.addEventListener("pointerdown",l=>{c.setPointerCapture(l.pointerId),fe(e,c,l),y()}),c.addEventListener("pointermove",l=>{c.hasPointerCapture(l.pointerId)&&(fe(e,c,l),y())})})}function ve(){const e=d.flows.find(t=>t.id===d.selectedFlowId);if(!e){T.className="editor-empty",T.textContent="Select a flow to edit its parameters.";return}if(T.className="editor",T.innerHTML="",T.append(pe("Strength",e.strength,-12,12,.1,t=>{e.strength=t})),e.kind!=="uniform"){const t=document.createElement("p");t.className="position-readout",t.textContent=`Position: (${e.x.toFixed(2)}, ${e.y.toFixed(2)})`,T.append(t)}(e.kind==="uniform"||e.kind==="doublet")&&T.append(pe("Direction",j(e.angle),-180,180,1,t=>{e.angle=Q(t)},"deg"))}function pe(e,t,n,r,o,s,a=""){const c=document.createElement("label");c.className="field";const l=ye(t,o);c.innerHTML=`
    <span>${e} <output>${l}${a?` ${a}`:""}</output></span>
    <div class="field-control">
      <input type="range" min="${n}" max="${r}" step="${o}" value="${t}" />
      <div class="stepper-buttons" aria-label="${e} step controls">
        <button type="button" class="stepper-button" data-step="up" aria-label="Increase ${e}">▲</button>
        <button type="button" class="stepper-button" data-step="down" aria-label="Decrease ${e}">▼</button>
      </div>
    </div>
  `;const u=c.querySelector("input"),S=c.querySelector("output"),b=c.querySelector('[data-step="up"]'),J=c.querySelector('[data-step="down"]');if(!u||!S||!b||!J)throw new Error("Range field was not created.");const B=N=>{const U=w(Number(N.toFixed(4)),n,r);u.value=String(U),s(U),S.textContent=`${ye(U,o)}${a?` ${a}`:""}`,y()};return u.addEventListener("input",()=>{B(Number(u.value))}),b.addEventListener("click",N=>{N.preventDefault(),B(Number(u.value)+.1)}),J.addEventListener("click",N=>{N.preventDefault(),B(Number(u.value)-.1)}),c}function ye(e,t){return t>=1&&Number.isInteger(e)?e.toFixed(0):e.toFixed(1)}function P(e,t){const n=e.querySelector(t);if(!n)throw new Error(`Required child ${t} was not created.`);return n}function fe(e,t,n){const r=P(t,"svg"),o=Y(e.side),s=r.getBoundingClientRect(),a=(n.clientX-s.left)/s.width*120,c=(n.clientY-s.top)/s.height*72,l=ze({x:a-o.center.x,y:c-o.center.y}),u={x:-l.x,y:-l.y},S=Math.atan2(-u.y,u.x),b=w(j(Ze(S-K(e.side))),-te,te);e.angleOffset=Q(b),Se(t,e.side,b)}function Se(e,t,n){const r=P(e,"output"),o=P(e,".angle-arc-line"),s=P(e,".angle-arc-handle"),a=Y(t),c=K(t)+Q(n),l={x:Math.cos(c),y:-Math.sin(c)},u={x:-l.x,y:-l.y},S={x:a.center.x-u.x*18,y:a.center.y-u.y*18},b={x:a.center.x+u.x*a.radius,y:a.center.y+u.y*a.radius};r.textContent=`${n.toFixed(0)} deg`,o.setAttribute("x1",S.x.toFixed(2)),o.setAttribute("y1",S.y.toFixed(2)),o.setAttribute("x2",b.x.toFixed(2)),o.setAttribute("y2",b.y.toFixed(2)),s.setAttribute("cx",b.x.toFixed(2)),s.setAttribute("cy",b.y.toFixed(2))}function Y(e){const n={left:{x:-1,y:0},right:{x:1,y:0},top:{x:0,y:-1},bottom:{x:0,y:1}},o={left:{x:94,y:36},right:{x:26,y:36},top:{x:60,y:54},bottom:{x:60,y:18}}[e],s=n[e],a={x:-s.y,y:s.x},c={x:o.x-a.x*32,y:o.y-a.y*32},l={x:o.x+a.x*32,y:o.y+a.y*32};return{center:o,radius:32,arcPath:Ye(o,s,a,32),flatPath:`M ${c.x.toFixed(2)} ${c.y.toFixed(2)} L ${l.x.toFixed(2)} ${l.y.toFixed(2)}`}}function Ye(e,t,n,r){const o=[];for(let s=0;s<=24;s+=1){const a=Math.PI-Math.PI*s/24;o.push({x:e.x+Math.cos(a)*n.x*r+Math.sin(a)*t.x*r,y:e.y+Math.cos(a)*n.y*r+Math.sin(a)*t.y*r})}return o.map((s,a)=>`${a===0?"M":"L"} ${s.x.toFixed(2)} ${s.y.toFixed(2)}`).join(" ")}function ze(e){const t=Math.max(Math.hypot(e.x,e.y),.001);return{x:e.x/t,y:e.y/t}}function Ze(e){let t=e;for(;t>Math.PI;)t-=Math.PI*2;for(;t<-Math.PI;)t+=Math.PI*2;return t}function y(){i.fillStyle=v.background,i.fillRect(0,0,$,R),Qe(),d.showPressureField&&je(),d.showStreamlines&&et(),d.showVectors&&lt(),d.showStagnationPoints&&dt(),yt()}function Qe(){i.save(),i.globalAlpha=De,i.lineWidth=1,i.strokeStyle=v.grid;for(let e=-5;e<=5;e+=.5)X(f({x:e,y:-g}),f({x:e,y:g}));for(let e=-3;e<=3;e+=.5)X(f({x:-h,y:e}),f({x:h,y:e}));i.restore()}function je(){const e=k(),t=bt();if(!(t<=.001)){i.save();for(let n=0;n<V;n+=1){const r=(n+.5)/V*R;for(let o=0;o<F;o+=1){const s=(o+.5)/F*$,a=Z({x:s,y:r}),l=(M(E(a,e))/t)**2;i.fillStyle=Ke(l,d.pressureMode),i.fillRect(o/F*$,n/V*R,$/F+1,R/V+1)}}i.restore()}}function Ke(e,t){const n={r:46,g:117,b:255},r={r:255,g:56,b:48},o=w(t==="dynamic"?e/(1+W):(1-e+W)/(W+Ve),0,1),s=Je(n,r,o);return`rgb(${s.r}, ${s.g}, ${s.b})`}function Je(e,t,n){return{r:Math.round(e.r+(t.r-e.r)*n),g:Math.round(e.g+(t.g-e.g)*n),b:Math.round(e.b+(t.b-e.b)*n)}}function et(){const e=[],t=new rt(Ce),n=tt();i.save(),i.lineWidth=1.25,n.forEach((r,o)=>{if(!t.canAccept(r,Me(r)))return;const s=nt(r,t);if(s.length<16)return;i.strokeStyle=o%4===0?v.streamline:v.streamlineMuted,it(s);const a=st(s);e.push(...a),t.addMany(a)}),d.showSeeds&&at(e),i.restore()}function tt(){const e=[];for(let t=-g+L;t<=g-L;t+=ne)for(let n=-h+L;n<=h-L;n+=ne)e.push({x:n,y:t});return e.sort((t,n)=>{const r=M(E(t,k()));return M(E(n,k()))-r})}function nt(e,t){const n=he(e,-1,t).reverse(),r=he(e,1,t);return[...n,e,...r]}function he(e,t,n){const r=[];let o=e;for(let s=0;s<$e;s+=1){const a=E(o,k());if(M(a)<.025)break;const l=ot(o,Te*t);if(ct(l)||!n.canAccept(l,Me(l)))break;r.push(l),o=l}return r}function ot(e,t){const n=c=>{const l=E(c,k()),u=Math.max(M(l),.001);return{x:l.x/u,y:l.y/u}},r=n(e),o=n({x:e.x+t*r.x/2,y:e.y+t*r.y/2}),s=n({x:e.x+t*o.x/2,y:e.y+t*o.y/2}),a=n({x:e.x+t*s.x,y:e.y+t*s.y});return{x:e.x+t/6*(r.x+2*o.x+2*s.x+a.x),y:e.y+t/6*(r.y+2*o.y+2*s.y+a.y)}}function Me(e){const t=M(E(e,k()));return w(oe/Math.sqrt(1+t*.55),_e,oe)}class rt{constructor(t){this.cellSize=t}cellSize;cells=new Map;canAccept(t,n){const r=f(t),o=this.cellFor(r),s=Math.ceil(n/this.cellSize);for(let a=o.y-s;a<=o.y+s;a+=1)for(let c=o.x-s;c<=o.x+s;c+=1){const l=this.cells.get(this.key(c,a));if(!l)continue;if(l.some(S=>{const b=f(S);return Math.hypot(r.x-b.x,r.y-b.y)<n}))return!1}return!0}addMany(t){t.forEach(n=>{const r=f(n),o=this.cellFor(r),s=this.key(o.x,o.y),a=this.cells.get(s);a?a.push(n):this.cells.set(s,[n])})}cellFor(t){return{x:Math.floor(t.x/this.cellSize),y:Math.floor(t.y/this.cellSize)}}key(t,n){return`${t},${n}`}}function st(e){return e.filter((t,n)=>n%Re===0)}function it(e){i.beginPath(),e.forEach((t,n)=>{const r=f(t);n===0?i.moveTo(r.x,r.y):i.lineTo(r.x,r.y)}),i.stroke()}function at(e){i.fillStyle=v.marker,e.forEach(t=>{const n=f(t);i.beginPath(),i.arc(n.x,n.y,1.5,0,Math.PI*2),i.fill()})}function ct(e){return e.x<-h||e.x>h||e.y<-g||e.y>g}function lt(){i.save(),i.strokeStyle=v.vector,i.fillStyle=v.vector,i.lineWidth=1;for(let e=-g+.4;e<=g-.4;e+=.65)for(let t=-h+.4;t<=h-.4;t+=.65){const n={x:t,y:e},r=E(n,k()),o=M(r);if(o<.04)continue;const s=Math.min(o/Fe,1),a=re+(Ne-re)*Math.sqrt(s),c={x:r.x/o,y:r.y/o},l=f(n),u=f({x:n.x+c.x*a,y:n.y+c.y*a});mt(l,u)}i.restore()}function dt(){const e=ut();e.length!==0&&(i.save(),i.fillStyle=v.stagnation,i.strokeStyle=v.stagnationStroke,i.lineWidth=2,e.forEach(t=>{const n=f(t);i.beginPath(),i.arc(n.x,n.y,5.5,0,Math.PI*2),i.fill(),i.stroke(),i.beginPath(),i.moveTo(n.x-9,n.y),i.lineTo(n.x+9,n.y),i.moveTo(n.x,n.y-9),i.lineTo(n.x,n.y+9),i.stroke()}),i.restore())}function ut(){const e=k(),t=[];for(let r=0;r<=O;r+=1){const o=-g+r/O*g*2,s=[];for(let a=0;a<=D;a+=1){const c=-h+a/D*h*2;s.push(M(E({x:c,y:o},e)))}t.push(s)}const n=[];for(let r=1;r<O;r+=1)for(let o=1;o<D;o+=1){const s=t[r][o];s>Oe||!pt(t,o,r)||n.push({x:-h+o/D*h*2,y:-g+r/O*g*2,speed:s})}return n.sort((r,o)=>r.speed-o.speed).filter((r,o,s)=>{const a=f(r);return s.slice(0,o).every(c=>{const l=f(c);return Math.hypot(a.x-l.x,a.y-l.y)>He})}).slice(0,12)}function pt(e,t,n){const r=e[n][t];for(let o=n-1;o<=n+1;o+=1)for(let s=t-1;s<=t+1;s+=1)if(!(s===t&&o===n)&&e[o][s]<r)return!1;return!0}function yt(){i.save(),d.flows.forEach(e=>{if(e.kind==="uniform")return;const t=f({x:e.x,y:e.y});if(i.fillStyle=z(e),i.strokeStyle=e.id===d.selectedFlowId?v.markerStroke:v.axis,i.lineWidth=e.id===d.selectedFlowId?2.5:1.5,i.beginPath(),i.arc(t.x,t.y,7,0,Math.PI*2),i.fill(),i.stroke(),e.kind==="doublet"){const n={x:Math.cos(e.angle),y:Math.sin(e.angle)};X(f({x:e.x-n.x*.28,y:e.y-n.y*.28}),f({x:e.x+n.x*.28,y:e.y+n.y*.28}))}}),i.restore()}function z(e){return e.kind==="uniform"?v.marker:Ue[e.kind]}function ft(e){if(I){A();return}if(!e){A();return}H!==e.id&&(A(),H=e.id,G=window.setTimeout(()=>{I||H!==e.id||ht(e)},Ae))}function A(){H=null,G!==null&&(window.clearTimeout(G),G=null),_.hidden=!0,_.innerHTML=""}function ht(e){const t=xe(e.kind);_.style.setProperty("--tooltip-flow-color",z(e)),_.innerHTML=`
    <div class="primitive-tooltip-title">${e.name}</div>
    <div class="primitive-tooltip-type">${t}</div>
    <code>${xt(e.kind)}</code>
  `,_.hidden=!1,gt(e)}function gt(e){const n=x(".boundary-layout").getBoundingClientRect(),r=p.getBoundingClientRect(),o=f({x:e.x,y:e.y}),s=260,a=112,c=w(r.left-n.left+o.x+16,10,n.width-s-10),l=w(r.top-n.top+o.y-18,10,n.height-a-10);_.style.left=`${c}px`,_.style.top=`${l}px`}function xt(e){switch(e){case"uniform":return"psi = U(y cos alpha - x sin alpha)";case"source":return"psi = (Q / 2pi) theta";case"sink":return"psi = -(Q / 2pi) theta";case"doublet":return"psi = -(mu / 2pi r) sin(theta - alpha)";case"vortex":return"psi = (Gamma / 2pi) ln r"}}function ke(e){let t=null,n=Number.POSITIVE_INFINITY;return d.flows.forEach(r=>{if(r.kind==="uniform")return;const o=f({x:r.x,y:r.y}),s=Math.hypot(o.x-e.x,o.y-e.y);s<=Ie&&s<n&&(t=r,n=s)}),t}function Ee(e,t){const n=Z(t);e.x=ge(w(n.x,-h+L,h-L)),e.y=ge(w(n.y,-g+L,g-L))}function X(e,t){i.beginPath(),i.moveTo(e.x,e.y),i.lineTo(t.x,t.y),i.stroke()}function mt(e,t){const n=Math.atan2(t.y-e.y,t.x-e.x);i.beginPath(),i.moveTo(e.x,e.y),i.lineTo(t.x,t.y),i.stroke(),i.beginPath(),i.moveTo(t.x,t.y),i.lineTo(t.x-Math.cos(n-.55)*5,t.y-Math.sin(n-.55)*5),i.lineTo(t.x-Math.cos(n+.55)*5,t.y-Math.sin(n+.55)*5),i.closePath(),i.fill()}function f(e){return{x:(e.x+h)/(h*2)*$,y:(g-e.y)/(g*2)*R}}function Z(e){return{x:e.x/$*h*2-h,y:g-e.y/R*g*2}}function Q(e){return e*Math.PI/180}function j(e){return e*180/Math.PI}function ge(e){return Math.round(e/ee)*ee}function w(e,t,n){return Math.min(n,Math.max(t,e))}function k(){return[...d.flows,...d.sideFlows.map(vt)]}function bt(){const e=k().filter(t=>t.enabled&&t.kind==="uniform").reduce((t,n)=>({x:t.x+n.strength*Math.cos(n.angle),y:t.y+n.strength*Math.sin(n.angle)}),{x:0,y:0});return Math.abs(M(e))}function vt(e){return{id:`side-${e.side}`,kind:"uniform",name:`${e.side} boundary`,x:0,y:0,strength:e.speed,angle:K(e.side)+e.angleOffset,enabled:e.enabled}}function K(e){switch(e){case"left":return 0;case"right":return Math.PI;case"top":return-Math.PI/2;case"bottom":return Math.PI/2}}function we(){return[{side:"left",enabled:!0,speed:1.2,angleOffset:0},{side:"right",enabled:!1,speed:1.2,angleOffset:0},{side:"top",enabled:!1,speed:1.2,angleOffset:0},{side:"bottom",enabled:!1,speed:1.2,angleOffset:0}]}C();y();
