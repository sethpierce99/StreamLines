(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();const U=Math.PI*2,Ae=.025;function k(e,t){return t.reduce((n,r)=>{if(!r.enabled)return n;const o=Te(e,r);return n.x+=o.x,n.y+=o.y,n},{x:0,y:0})}function Te(e,t){if(t.kind==="uniform")return{x:t.strength*Math.cos(t.angle),y:t.strength*Math.sin(t.angle)};const n=e.x-t.x,r=e.y-t.y,o=Math.max(n*n+r*r,Ae);if(t.kind==="source"||t.kind==="sink"){const b=(t.kind==="source"?1:-1)*t.strength/(U*o);return{x:b*n,y:b*r}}if(t.kind==="vortex"){const u=t.strength/(U*o);return{x:-u*r,y:u*n}}const s=Math.cos(t.angle),i=Math.sin(t.angle),c=s*n+i*r,l=-t.strength/(U*o*o);return{x:l*(s*o-2*n*c),y:l*(i*o-2*r*c)}}function w(e){return Math.hypot(e.x,e.y)}function xe(e){switch(e){case"uniform":return"Uniform";case"source":return"Source";case"sink":return"Sink";case"doublet":return"Doublet";case"vortex":return"Vortex"}}const C=940,R=560,p=6.2,f=3.7,ee=.25,$e=14,te=80,P=.25,Ce=2e3,Re=.045,_e=620,ne=.24,Ne=4,oe=12,Fe=4.5,De=12,re=.12,Ve=.55,Oe=3,q=118,W=70,X=-3,me=1,be=4,F=90,D=54,He=.08,Ge=28,d={showStreamlines:!0,showVectors:!0,showSeeds:!1,showPressureContours:!1,pressureMode:"static",showStagnationPoints:!0,selectedFlowId:null,flows:[],sideFlows:Ie()};let I=null,O=null,H=null;const ve=document.querySelector("#app");if(!ve)throw new Error("App root was not found.");ve.innerHTML=`
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
            <svg class="primitive-symbol" viewBox="0 0 40 40" aria-hidden="true">
              <defs>
                <marker id="vortex-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                  <path d="M0 0 L5 2.5 L0 5 Z"></path>
                </marker>
              </defs>
              <circle class="symbol-outline" cx="20" cy="20" r="15"></circle>
              <path marker-end="url(#vortex-arrow)" d="M27 14 A9 9 0 1 0 28 25"></path>
            </svg>
            Vortex
          </button>
        </div>
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
            <option value="static">Static Cp</option>
            <option value="dynamic">Dynamic q*</option>
          </select>
        </label>
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
        <canvas id="flow-canvas" width="${C}" height="${R}" aria-label="Canvas showing potential flow streamlines"></canvas>
        <div id="primitive-tooltip" class="primitive-tooltip" role="status" aria-live="polite" hidden></div>
        <div id="side-right" class="side-control side-control-right"></div>
        <div id="side-bottom" class="side-control side-control-bottom"></div>
      </div>
      <div id="readout" class="readout">x 0.00, y 0.00, |V| 0.00</div>
    </section>
  </main>
`;const h=m("#flow-canvas"),a=We(h),se=m("#flow-list"),T=m("#flow-editor"),Se=m("#readout"),$=m("#primitive-tooltip"),ie=m("#toggle-streamlines"),ae=m("#toggle-vectors"),ce=m("#toggle-seeds"),le=m("#toggle-pressure"),de=m("#pressure-mode"),ue=m("#toggle-stagnation"),Be=m("#reset-case"),Ue=new Map([["left",m("#side-left")],["right",m("#side-right")],["top",m("#side-top")],["bottom",m("#side-bottom")]]),v=getComputedStyle(document.documentElement),S={background:v.getPropertyValue("--canvas-background").trim(),grid:v.getPropertyValue("--canvas-grid").trim(),axis:v.getPropertyValue("--canvas-axis").trim(),streamline:v.getPropertyValue("--streamline").trim(),streamlineMuted:v.getPropertyValue("--streamline-muted").trim(),stagnation:v.getPropertyValue("--stagnation-point").trim(),stagnationStroke:v.getPropertyValue("--stagnation-point-stroke").trim(),vector:v.getPropertyValue("--vector").trim(),marker:v.getPropertyValue("--marker").trim(),markerStroke:v.getPropertyValue("--marker-stroke").trim()},qe={source:v.getPropertyValue("--flow-source").trim(),sink:v.getPropertyValue("--flow-sink").trim(),doublet:v.getPropertyValue("--flow-doublet").trim(),vortex:v.getPropertyValue("--flow-vortex").trim()};function m(e){const t=document.querySelector(e);if(!t)throw new Error(`Required element ${e} was not created.`);return t}function We(e){const t=e.getContext("2d");if(!t)throw new Error("Canvas 2D context is not available.");return t}document.querySelectorAll(".flow-add").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.kind,n=Xe(t);d.flows.push(n),d.selectedFlowId=n.id,_(),y()})});ie.addEventListener("change",()=>{d.showStreamlines=ie.checked,y()});ae.addEventListener("change",()=>{d.showVectors=ae.checked,y()});ce.addEventListener("change",()=>{d.showSeeds=ce.checked,y()});le.addEventListener("change",()=>{d.showPressureContours=le.checked,y()});de.addEventListener("change",()=>{d.pressureMode=de.value,y()});ue.addEventListener("change",()=>{d.showStagnationPoints=ue.checked,y()});Be.addEventListener("click",()=>{d.flows=[{id:crypto.randomUUID(),kind:"doublet",name:"Doublet 1",x:0,y:0,strength:5,angle:0,enabled:!0}],d.sideFlows=Ie(),d.selectedFlowId=d.flows[0]?.id??null,_(),y()});h.addEventListener("mousemove",e=>{const t=h.getBoundingClientRect(),n=Le({x:e.clientX-t.left,y:e.clientY-t.top}),r=Ee({x:e.clientX-t.left,y:e.clientY-t.top}),o=k(n,E());Se.textContent=`x ${n.x.toFixed(2)}, y ${n.y.toFixed(2)}, |V| ${w(o).toFixed(2)}`,h.classList.toggle("is-draggable",!!r),gt(r)});h.addEventListener("mouseleave",()=>{Se.textContent="x 0.00, y 0.00, |V| 0.00",h.classList.remove("is-draggable"),A()});h.addEventListener("pointerdown",e=>{const t=h.getBoundingClientRect(),n={x:e.clientX-t.left,y:e.clientY-t.top},r=Ee(n);if(!r){A();return}A(),d.selectedFlowId=r.id,I={flowId:r.id},h.setPointerCapture(e.pointerId),h.classList.add("is-dragging"),Pe(r,n),_(),y()});h.addEventListener("pointermove",e=>{if(!I)return;const t=d.flows.find(r=>r.id===I?.flowId);if(!t){I=null,h.classList.remove("is-dragging"),A();return}const n=h.getBoundingClientRect();Pe(t,{x:e.clientX-n.left,y:e.clientY-n.top}),Me(),y()});h.addEventListener("pointerup",e=>{I=null,h.releasePointerCapture(e.pointerId),h.classList.remove("is-dragging")});h.addEventListener("pointercancel",e=>{I=null,h.releasePointerCapture(e.pointerId),h.classList.remove("is-dragging"),A()});function Xe(e){const t=d.flows.filter(r=>r.kind===e).length+1,n={uniform:{x:0,y:0,strength:1,angle:0},source:{x:-1.25,y:0,strength:4,angle:0},sink:{x:1.25,y:0,strength:4,angle:0},doublet:{x:0,y:0,strength:5,angle:0},vortex:{x:0,y:0,strength:5,angle:0}};return{id:crypto.randomUUID(),kind:e,name:`${xe(e)} ${t}`,enabled:!0,...n[e]}}function _(){Ye(),se.innerHTML="",d.flows.forEach(e=>{const t=document.createElement("div");t.className=`flow-row${e.id===d.selectedFlowId?" selected":""}`,t.style.setProperty("--flow-color",e.kind==="uniform"?S.marker:Z(e));const n=document.createElement("button");n.type="button",n.className="flow-select",n.textContent=e.name,n.addEventListener("click",()=>{d.selectedFlowId=e.id,_(),y()});const r=document.createElement("input");r.type="checkbox",r.checked=e.enabled,r.ariaLabel=`Enable ${e.name}`,r.addEventListener("change",()=>{e.enabled=r.checked,y()});const o=document.createElement("button");o.type="button",o.className="remove-flow",o.textContent="Remove",o.addEventListener("click",()=>{d.flows=d.flows.filter(s=>s.id!==e.id),d.selectedFlowId===e.id&&(d.selectedFlowId=d.flows[0]?.id??null),_(),y()}),t.append(r,n,o),se.append(t)}),Me()}function Ye(){d.sideFlows.forEach(e=>{const t=Ue.get(e.side);if(!t)return;const n=j(e.angleOffset),r=e.side[0].toUpperCase()+e.side.slice(1),o=z(e.side);t.innerHTML=`
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
    `;const s=L(t,`[data-side-toggle="${e.side}"]`),i=L(t,`[data-side-speed="${e.side}"]`),c=L(t,`[data-side-angle="${e.side}"]`);ke(c,e.side,n),s.addEventListener("change",()=>{e.enabled=s.checked,y()}),i.addEventListener("input",()=>{e.speed=Number(i.value);const l=L(t,".side-speed output");l.textContent=e.speed.toFixed(1),y()}),c.addEventListener("pointerdown",l=>{c.setPointerCapture(l.pointerId),he(e,c,l),y()}),c.addEventListener("pointermove",l=>{c.hasPointerCapture(l.pointerId)&&(he(e,c,l),y())})})}function Me(){const e=d.flows.find(t=>t.id===d.selectedFlowId);if(!e){T.className="editor-empty",T.textContent="Select a flow to edit its parameters.";return}if(T.className="editor",T.innerHTML="",T.append(pe("Strength",e.strength,-12,12,.1,t=>{e.strength=t})),e.kind!=="uniform"){const t=document.createElement("p");t.className="position-readout",t.textContent=`Position: (${e.x.toFixed(2)}, ${e.y.toFixed(2)})`,T.append(t)}(e.kind==="uniform"||e.kind==="doublet")&&T.append(pe("Direction",j(e.angle),-180,180,1,t=>{e.angle=Q(t)},"deg"))}function pe(e,t,n,r,o,s,i=""){const c=document.createElement("label");c.className="field";const l=fe(t,o);c.innerHTML=`
    <span>${e} <output>${l}${i?` ${i}`:""}</output></span>
    <div class="field-control">
      <input type="range" min="${n}" max="${r}" step="${o}" value="${t}" />
      <div class="stepper-buttons" aria-label="${e} step controls">
        <button type="button" class="stepper-button" data-step="up" aria-label="Increase ${e}">▲</button>
        <button type="button" class="stepper-button" data-step="down" aria-label="Decrease ${e}">▼</button>
      </div>
    </div>
  `;const u=c.querySelector("input"),b=c.querySelector("output"),x=c.querySelector('[data-step="up"]'),J=c.querySelector('[data-step="down"]');if(!u||!b||!x||!J)throw new Error("Range field was not created.");const G=N=>{const B=M(Number(N.toFixed(4)),n,r);u.value=String(B),s(B),b.textContent=`${fe(B,o)}${i?` ${i}`:""}`,y()};return u.addEventListener("input",()=>{G(Number(u.value))}),x.addEventListener("click",N=>{N.preventDefault(),G(Number(u.value)+.1)}),J.addEventListener("click",N=>{N.preventDefault(),G(Number(u.value)-.1)}),c}function fe(e,t){return t>=1&&Number.isInteger(e)?e.toFixed(0):e.toFixed(1)}function L(e,t){const n=e.querySelector(t);if(!n)throw new Error(`Required child ${t} was not created.`);return n}function he(e,t,n){const r=L(t,"svg"),o=z(e.side),s=r.getBoundingClientRect(),i=(n.clientX-s.left)/s.width*120,c=(n.clientY-s.top)/s.height*72,l=Ze({x:i-o.center.x,y:c-o.center.y}),u={x:-l.x,y:-l.y},b=Math.atan2(-u.y,u.x),x=M(j(Qe(b-K(e.side))),-te,te);e.angleOffset=Q(x),ke(t,e.side,x)}function ke(e,t,n){const r=L(e,"output"),o=L(e,".angle-arc-line"),s=L(e,".angle-arc-handle"),i=z(t),c=K(t)+Q(n),l={x:Math.cos(c),y:-Math.sin(c)},u={x:-l.x,y:-l.y},b={x:i.center.x-u.x*18,y:i.center.y-u.y*18},x={x:i.center.x+u.x*i.radius,y:i.center.y+u.y*i.radius};r.textContent=`${n.toFixed(0)} deg`,o.setAttribute("x1",b.x.toFixed(2)),o.setAttribute("y1",b.y.toFixed(2)),o.setAttribute("x2",x.x.toFixed(2)),o.setAttribute("y2",x.y.toFixed(2)),s.setAttribute("cx",x.x.toFixed(2)),s.setAttribute("cy",x.y.toFixed(2))}function z(e){const n={left:{x:-1,y:0},right:{x:1,y:0},top:{x:0,y:-1},bottom:{x:0,y:1}},o={left:{x:94,y:36},right:{x:26,y:36},top:{x:60,y:54},bottom:{x:60,y:18}}[e],s=n[e],i={x:-s.y,y:s.x},c={x:o.x-i.x*32,y:o.y-i.y*32},l={x:o.x+i.x*32,y:o.y+i.y*32};return{center:o,radius:32,arcPath:ze(o,s,i,32),flatPath:`M ${c.x.toFixed(2)} ${c.y.toFixed(2)} L ${l.x.toFixed(2)} ${l.y.toFixed(2)}`}}function ze(e,t,n,r){const o=[];for(let s=0;s<=24;s+=1){const i=Math.PI-Math.PI*s/24;o.push({x:e.x+Math.cos(i)*n.x*r+Math.sin(i)*t.x*r,y:e.y+Math.cos(i)*n.y*r+Math.sin(i)*t.y*r})}return o.map((s,i)=>`${i===0?"M":"L"} ${s.x.toFixed(2)} ${s.y.toFixed(2)}`).join(" ")}function Ze(e){const t=Math.max(Math.hypot(e.x,e.y),.001);return{x:e.x/t,y:e.y/t}}function Qe(e){let t=e;for(;t>Math.PI;)t-=Math.PI*2;for(;t<-Math.PI;)t+=Math.PI*2;return t}function y(){a.fillStyle=S.background,a.fillRect(0,0,C,R),je(),d.showPressureContours&&Ke(),d.showStreamlines&&nt(),d.showVectors&&ut(),d.showStagnationPoints&&pt(),yt()}function je(){a.save(),a.lineWidth=1,a.strokeStyle=S.grid;for(let e=-5;e<=5;e+=.5)Y(g({x:e,y:-f}),g({x:e,y:f}));for(let e=-3;e<=3;e+=.5)Y(g({x:-p,y:e}),g({x:p,y:e}));a.restore()}function Ke(){const e=Je();a.save(),a.globalAlpha=.62;for(let t=0;t<e.rows;t+=1)for(let n=0;n<e.columns;n+=1){const r=(e.values[t][n]+e.values[t][n+1]+e.values[t+1][n]+e.values[t+1][n+1])/4,o=n/e.columns*C,s=t/e.rows*R,i=C/e.columns+1,c=R/e.rows+1;a.fillStyle=tt(r,d.pressureMode),a.fillRect(o,s,i,c)}a.restore()}function Je(){const e=[],t=E(),n=et(t);for(let r=0;r<=W;r+=1){const o=-f+r/W*f*2,s=[];for(let i=0;i<=q;i+=1){const c=-p+i/q*p*2,u=(w(k({x:c,y:o},t))/n)**2;s.push(d.pressureMode==="static"?M(1-u,X,me):M(u,0,be))}e.push(s)}return{columns:q,rows:W,values:e}}function et(e){const t=d.sideFlows.reduce((r,o)=>o.enabled?Math.max(r,o.speed):r,0),n=e.reduce((r,o)=>!o.enabled||o.kind!=="uniform"?r:Math.max(r,Math.abs(o.strength)),0);return Math.max(t,n,1)}function tt(e,t){if(t==="dynamic"){const c=M(e/be,0,1),l={r:18,g:25,b:36},u={r:41,g:144,b:255},b={r:255,g:92,b:56},x=c<.5?V(l,u,c*2):V(u,b,(c-.5)*2);return`rgb(${x.r}, ${x.g}, ${x.b})`}const n=M((e-X)/(me-X),0,1),r={r:46,g:117,b:255},o={r:20,g:28,b:38},s={r:255,g:80,b:72},i=n<.5?V(r,o,n*2):V(o,s,(n-.5)*2);return`rgb(${i.r}, ${i.g}, ${i.b})`}function V(e,t,n){return{r:Math.round(e.r+(t.r-e.r)*n),g:Math.round(e.g+(t.g-e.g)*n),b:Math.round(e.b+(t.b-e.b)*n)}}function nt(){const e=[],t=new it(De),n=ot();a.save(),a.lineWidth=1.25,n.forEach((r,o)=>{if(!t.canAccept(r,we(r)))return;const s=rt(r,t);if(s.length<16)return;a.strokeStyle=o%4===0?S.streamline:S.streamlineMuted,ct(s);const i=at(s);e.push(...i),t.addMany(i)}),d.showSeeds&&lt(e),a.restore()}function ot(){const e=[];for(let t=-f+P;t<=f-P;t+=ne)for(let n=-p+P;n<=p-P;n+=ne)e.push({x:n,y:t});return e.sort((t,n)=>{const r=w(k(t,E()));return w(k(n,E()))-r})}function rt(e,t){const n=ye(e,-1,t).reverse(),r=ye(e,1,t);return[...n,e,...r]}function ye(e,t,n){const r=[];let o=e;for(let s=0;s<_e;s+=1){const i=k(o,E());if(w(i)<.025)break;const l=st(o,Re*t);if(dt(l)||!n.canAccept(l,we(l)))break;r.push(l),o=l}return r}function st(e,t){const n=c=>{const l=k(c,E()),u=Math.max(w(l),.001);return{x:l.x/u,y:l.y/u}},r=n(e),o=n({x:e.x+t*r.x/2,y:e.y+t*r.y/2}),s=n({x:e.x+t*o.x/2,y:e.y+t*o.y/2}),i=n({x:e.x+t*s.x,y:e.y+t*s.y});return{x:e.x+t/6*(r.x+2*o.x+2*s.x+i.x),y:e.y+t/6*(r.y+2*o.y+2*s.y+i.y)}}function we(e){const t=w(k(e,E()));return M(oe/Math.sqrt(1+t*.55),Fe,oe)}class it{constructor(t){this.cellSize=t}cellSize;cells=new Map;canAccept(t,n){const r=g(t),o=this.cellFor(r),s=Math.ceil(n/this.cellSize);for(let i=o.y-s;i<=o.y+s;i+=1)for(let c=o.x-s;c<=o.x+s;c+=1){const l=this.cells.get(this.key(c,i));if(!l)continue;if(l.some(b=>{const x=g(b);return Math.hypot(r.x-x.x,r.y-x.y)<n}))return!1}return!0}addMany(t){t.forEach(n=>{const r=g(n),o=this.cellFor(r),s=this.key(o.x,o.y),i=this.cells.get(s);i?i.push(n):this.cells.set(s,[n])})}cellFor(t){return{x:Math.floor(t.x/this.cellSize),y:Math.floor(t.y/this.cellSize)}}key(t,n){return`${t},${n}`}}function at(e){return e.filter((t,n)=>n%Ne===0)}function ct(e){a.beginPath(),e.forEach((t,n)=>{const r=g(t);n===0?a.moveTo(r.x,r.y):a.lineTo(r.x,r.y)}),a.stroke()}function lt(e){a.fillStyle=S.marker,e.forEach(t=>{const n=g(t);a.beginPath(),a.arc(n.x,n.y,1.5,0,Math.PI*2),a.fill()})}function dt(e){return e.x<-p||e.x>p||e.y<-f||e.y>f}function ut(){a.save(),a.strokeStyle=S.vector,a.fillStyle=S.vector,a.lineWidth=1;for(let e=-f+.4;e<=f-.4;e+=.65)for(let t=-p+.4;t<=p-.4;t+=.65){const n={x:t,y:e},r=k(n,E()),o=w(r);if(o<.04)continue;const s=Math.min(o/Oe,1),i=re+(Ve-re)*Math.sqrt(s),c={x:r.x/o,y:r.y/o},l=g(n),u=g({x:n.x+c.x*i,y:n.y+c.y*i});vt(l,u)}a.restore()}function pt(){const e=ft();e.length!==0&&(a.save(),a.fillStyle=S.stagnation,a.strokeStyle=S.stagnationStroke,a.lineWidth=2,e.forEach(t=>{const n=g(t);a.beginPath(),a.arc(n.x,n.y,5.5,0,Math.PI*2),a.fill(),a.stroke(),a.beginPath(),a.moveTo(n.x-9,n.y),a.lineTo(n.x+9,n.y),a.moveTo(n.x,n.y-9),a.lineTo(n.x,n.y+9),a.stroke()}),a.restore())}function ft(){const e=E(),t=[];for(let r=0;r<=D;r+=1){const o=-f+r/D*f*2,s=[];for(let i=0;i<=F;i+=1){const c=-p+i/F*p*2;s.push(w(k({x:c,y:o},e)))}t.push(s)}const n=[];for(let r=1;r<D;r+=1)for(let o=1;o<F;o+=1){const s=t[r][o];s>He||!ht(t,o,r)||n.push({x:-p+o/F*p*2,y:-f+r/D*f*2,speed:s})}return n.sort((r,o)=>r.speed-o.speed).filter((r,o,s)=>{const i=g(r);return s.slice(0,o).every(c=>{const l=g(c);return Math.hypot(i.x-l.x,i.y-l.y)>Ge})}).slice(0,12)}function ht(e,t,n){const r=e[n][t];for(let o=n-1;o<=n+1;o+=1)for(let s=t-1;s<=t+1;s+=1)if(!(s===t&&o===n)&&e[o][s]<r)return!1;return!0}function yt(){a.save(),d.flows.forEach(e=>{if(e.kind==="uniform")return;const t=g({x:e.x,y:e.y});if(a.fillStyle=Z(e),a.strokeStyle=e.id===d.selectedFlowId?S.markerStroke:S.axis,a.lineWidth=e.id===d.selectedFlowId?2.5:1.5,a.beginPath(),a.arc(t.x,t.y,7,0,Math.PI*2),a.fill(),a.stroke(),e.kind==="doublet"){const n={x:Math.cos(e.angle),y:Math.sin(e.angle)};Y(g({x:e.x-n.x*.28,y:e.y-n.y*.28}),g({x:e.x+n.x*.28,y:e.y+n.y*.28}))}}),a.restore()}function Z(e){return e.kind==="uniform"?S.marker:qe[e.kind]}function gt(e){if(I){A();return}if(!e){A();return}O!==e.id&&(A(),O=e.id,H=window.setTimeout(()=>{I||O!==e.id||xt(e)},Ce))}function A(){O=null,H!==null&&(window.clearTimeout(H),H=null),$.hidden=!0,$.innerHTML=""}function xt(e){const t=xe(e.kind);$.style.setProperty("--tooltip-flow-color",Z(e)),$.innerHTML=`
    <div class="primitive-tooltip-title">${e.name}</div>
    <div class="primitive-tooltip-type">${t}</div>
    <code>${bt(e.kind)}</code>
  `,$.hidden=!1,mt(e)}function mt(e){const n=m(".boundary-layout").getBoundingClientRect(),r=h.getBoundingClientRect(),o=g({x:e.x,y:e.y}),s=260,i=112,c=M(r.left-n.left+o.x+16,10,n.width-s-10),l=M(r.top-n.top+o.y-18,10,n.height-i-10);$.style.left=`${c}px`,$.style.top=`${l}px`}function bt(e){switch(e){case"uniform":return"psi = U(y cos alpha - x sin alpha)";case"source":return"psi = (Q / 2pi) theta";case"sink":return"psi = -(Q / 2pi) theta";case"doublet":return"psi = -(mu / 2pi r) sin(theta - alpha)";case"vortex":return"psi = -(Gamma / 2pi) ln r"}}function Ee(e){let t=null,n=Number.POSITIVE_INFINITY;return d.flows.forEach(r=>{if(r.kind==="uniform")return;const o=g({x:r.x,y:r.y}),s=Math.hypot(o.x-e.x,o.y-e.y);s<=$e&&s<n&&(t=r,n=s)}),t}function Pe(e,t){const n=Le(t);e.x=ge(M(n.x,-p+P,p-P)),e.y=ge(M(n.y,-f+P,f-P))}function Y(e,t){a.beginPath(),a.moveTo(e.x,e.y),a.lineTo(t.x,t.y),a.stroke()}function vt(e,t){const n=Math.atan2(t.y-e.y,t.x-e.x);a.beginPath(),a.moveTo(e.x,e.y),a.lineTo(t.x,t.y),a.stroke(),a.beginPath(),a.moveTo(t.x,t.y),a.lineTo(t.x-Math.cos(n-.55)*5,t.y-Math.sin(n-.55)*5),a.lineTo(t.x-Math.cos(n+.55)*5,t.y-Math.sin(n+.55)*5),a.closePath(),a.fill()}function g(e){return{x:(e.x+p)/(p*2)*C,y:(f-e.y)/(f*2)*R}}function Le(e){return{x:e.x/C*p*2-p,y:f-e.y/R*f*2}}function Q(e){return e*Math.PI/180}function j(e){return e*180/Math.PI}function ge(e){return Math.round(e/ee)*ee}function M(e,t,n){return Math.min(n,Math.max(t,e))}function E(){return[...d.flows,...d.sideFlows.map(St)]}function St(e){return{id:`side-${e.side}`,kind:"uniform",name:`${e.side} boundary`,x:0,y:0,strength:e.speed,angle:K(e.side)+e.angleOffset,enabled:e.enabled}}function K(e){switch(e){case"left":return 0;case"right":return Math.PI;case"top":return-Math.PI/2;case"bottom":return Math.PI/2}}function Ie(){return[{side:"left",enabled:!0,speed:1.2,angleOffset:0},{side:"right",enabled:!1,speed:1.2,angleOffset:0},{side:"top",enabled:!1,speed:1.2,angleOffset:0},{side:"bottom",enabled:!1,speed:1.2,angleOffset:0}]}_();y();
