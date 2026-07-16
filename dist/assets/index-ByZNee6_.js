(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();const V=Math.PI*2,ue=.025;function P(e,t){return t.reduce((n,r)=>{if(!r.enabled)return n;const o=ye(e,r);return n.x+=o.x,n.y+=o.y,n},{x:0,y:0})}function ye(e,t){if(t.kind==="uniform")return{x:t.strength*Math.cos(t.angle),y:t.strength*Math.sin(t.angle)};const n=e.x-t.x,r=e.y-t.y,o=Math.max(n*n+r*r,ue);if(t.kind==="source"||t.kind==="sink"){const v=(t.kind==="source"?1:-1)*t.strength/(V*o);return{x:v*n,y:v*r}}if(t.kind==="vortex"){const y=t.strength/(V*o);return{x:-y*r,y:y*n}}const i=Math.cos(t.angle),s=Math.sin(t.angle),l=i*n+s*r,c=-t.strength/(V*o*o);return{x:c*(i*o-2*n*l),y:c*(s*o-2*r*l)}}function A(e){return Math.hypot(e.x,e.y)}function te(e){switch(e){case"uniform":return"Uniform";case"source":return"Source";case"sink":return"Sink";case"doublet":return"Doublet";case"vortex":return"Vortex"}}const R=820,_=500,x=5.5,m=3.35,U=.25,pe=14,W=80,k=.25,fe=2e3,he=.045,xe=620,Y=.24,me=4,X=12,ge=4.5,ve=12,d={showVectors:!0,showSeeds:!1,selectedFlowId:null,flows:[],sideFlows:de()};let w=null,F=null,N=null;const ne=document.querySelector("#app");if(!ne)throw new Error("App root was not found.");ne.innerHTML=`
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
          <input id="toggle-vectors" type="checkbox" checked />
          Velocity vectors
        </label>
        <label class="toggle">
          <input id="toggle-seeds" type="checkbox" />
          Seed points
        </label>
        <button id="reset-case" type="button">Reset</button>
      </section>
    </aside>

    <section class="stage-shell">
      <div class="boundary-layout" aria-label="Boundary uniform flow controls">
        <div id="side-top" class="side-control side-control-top"></div>
        <div id="side-left" class="side-control side-control-left"></div>
        <canvas id="flow-canvas" width="${R}" height="${_}" aria-label="Canvas showing potential flow streamlines"></canvas>
        <div id="primitive-tooltip" class="primitive-tooltip" role="status" aria-live="polite" hidden></div>
        <div id="side-right" class="side-control side-control-right"></div>
        <div id="side-bottom" class="side-control side-control-bottom"></div>
      </div>
      <div id="readout" class="readout">x 0.00, y 0.00, |V| 0.00</div>
    </section>
  </main>
`;const u=g("#flow-canvas"),a=Se(u),z=g("#flow-list"),E=g("#flow-editor"),oe=g("#readout"),I=g("#primitive-tooltip"),Z=g("#toggle-vectors"),Q=g("#toggle-seeds"),be=g("#reset-case"),Me=new Map([["left",g("#side-left")],["right",g("#side-right")],["top",g("#side-top")],["bottom",g("#side-bottom")]]),b=getComputedStyle(document.documentElement),M={background:b.getPropertyValue("--canvas-background").trim(),grid:b.getPropertyValue("--canvas-grid").trim(),axis:b.getPropertyValue("--canvas-axis").trim(),streamline:b.getPropertyValue("--streamline").trim(),streamlineMuted:b.getPropertyValue("--streamline-muted").trim(),vector:b.getPropertyValue("--vector").trim(),marker:b.getPropertyValue("--marker").trim(),markerStroke:b.getPropertyValue("--marker-stroke").trim()},ke={source:b.getPropertyValue("--flow-source").trim(),sink:b.getPropertyValue("--flow-sink").trim(),doublet:b.getPropertyValue("--flow-doublet").trim(),vortex:b.getPropertyValue("--flow-vortex").trim()};function g(e){const t=document.querySelector(e);if(!t)throw new Error(`Required element ${e} was not created.`);return t}function Se(e){const t=e.getContext("2d");if(!t)throw new Error("Canvas 2D context is not available.");return t}document.querySelectorAll(".flow-add").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.kind,n=we(t);d.flows.push(n),d.selectedFlowId=n.id,T(),f()})});Z.addEventListener("change",()=>{d.showVectors=Z.checked,f()});Q.addEventListener("change",()=>{d.showSeeds=Q.checked,f()});be.addEventListener("click",()=>{d.flows=[{id:crypto.randomUUID(),kind:"doublet",name:"Doublet 1",x:0,y:0,strength:5,angle:0,enabled:!0}],d.sideFlows=de(),d.selectedFlowId=d.flows[0]?.id??null,T(),f()});u.addEventListener("mousemove",e=>{const t=u.getBoundingClientRect(),n=le({x:e.clientX-t.left,y:e.clientY-t.top}),r=ae({x:e.clientX-t.left,y:e.clientY-t.top}),o=P(n,$());oe.textContent=`x ${n.x.toFixed(2)}, y ${n.y.toFixed(2)}, |V| ${A(o).toFixed(2)}`,u.classList.toggle("is-draggable",!!r),Be(r)});u.addEventListener("mouseleave",()=>{oe.textContent="x 0.00, y 0.00, |V| 0.00",u.classList.remove("is-draggable"),L()});u.addEventListener("pointerdown",e=>{const t=u.getBoundingClientRect(),n={x:e.clientX-t.left,y:e.clientY-t.top},r=ae(n);if(!r){L();return}L(),d.selectedFlowId=r.id,w={flowId:r.id},u.setPointerCapture(e.pointerId),u.classList.add("is-dragging"),ce(r,n),T(),f()});u.addEventListener("pointermove",e=>{if(!w)return;const t=d.flows.find(r=>r.id===w?.flowId);if(!t){w=null,u.classList.remove("is-dragging"),L();return}const n=u.getBoundingClientRect();ce(t,{x:e.clientX-n.left,y:e.clientY-n.top}),re(),f()});u.addEventListener("pointerup",e=>{w=null,u.releasePointerCapture(e.pointerId),u.classList.remove("is-dragging")});u.addEventListener("pointercancel",e=>{w=null,u.releasePointerCapture(e.pointerId),u.classList.remove("is-dragging"),L()});function we(e){const t=d.flows.filter(r=>r.kind===e).length+1,n={uniform:{x:0,y:0,strength:1,angle:0},source:{x:-1.25,y:0,strength:4,angle:0},sink:{x:1.25,y:0,strength:4,angle:0},doublet:{x:0,y:0,strength:5,angle:0},vortex:{x:0,y:0,strength:5,angle:0}};return{id:crypto.randomUUID(),kind:e,name:`${te(e)} ${t}`,enabled:!0,...n[e]}}function T(){Le(),z.innerHTML="",d.flows.forEach(e=>{const t=document.createElement("div");t.className=`flow-row${e.id===d.selectedFlowId?" selected":""}`,t.style.setProperty("--flow-color",e.kind==="uniform"?M.marker:O(e));const n=document.createElement("button");n.type="button",n.className="flow-select",n.textContent=e.name,n.addEventListener("click",()=>{d.selectedFlowId=e.id,T(),f()});const r=document.createElement("input");r.type="checkbox",r.checked=e.enabled,r.ariaLabel=`Enable ${e.name}`,r.addEventListener("change",()=>{e.enabled=r.checked,f()});const o=document.createElement("button");o.type="button",o.className="remove-flow",o.textContent="Remove",o.addEventListener("click",()=>{d.flows=d.flows.filter(i=>i.id!==e.id),d.selectedFlowId===e.id&&(d.selectedFlowId=d.flows[0]?.id??null),T(),f()}),t.append(r,n,o),z.append(t)}),re()}function Le(){d.sideFlows.forEach(e=>{const t=Me.get(e.side);if(!t)return;const n=G(e.angleOffset),r=e.side[0].toUpperCase()+e.side.slice(1),o=H(e.side);t.innerHTML=`
      <label class="side-toggle">
        <input type="checkbox" data-side-toggle="${e.side}" ${e.enabled?"checked":""} />
        ${r}
      </label>
      <label class="side-slider side-speed">
        <span>Velocity <output>${e.speed.toFixed(1)}</output></span>
        <input type="range" min="0" max="5" step="0.1" value="${e.speed}" data-side-speed="${e.side}" />
      </label>
      <div class="side-angle" data-side-angle="${e.side}">
        <span>Angle <output>${n.toFixed(0)} deg</output></span>
        <svg viewBox="0 0 120 72" aria-hidden="true">
          <path class="angle-arc-track" d="${o.arcPath}"></path>
          <path class="angle-arc-flat" d="${o.flatPath}"></path>
          <line class="angle-arc-line" x1="${o.center.x}" y1="${o.center.y}" x2="${o.center.x}" y2="${o.center.y}"></line>
          <circle class="angle-arc-handle" cx="${o.center.x}" cy="${o.center.y}" r="6"></circle>
        </svg>
      </div>
    `;const i=S(t,`[data-side-toggle="${e.side}"]`),s=S(t,`[data-side-speed="${e.side}"]`),l=S(t,`[data-side-angle="${e.side}"]`);ie(l,e.side,n),i.addEventListener("change",()=>{e.enabled=i.checked,f()}),s.addEventListener("input",()=>{e.speed=Number(s.value);const c=S(t,".side-speed output");c.textContent=e.speed.toFixed(1),f()}),l.addEventListener("pointerdown",c=>{l.setPointerCapture(c.pointerId),K(e,l,c),f()}),l.addEventListener("pointermove",c=>{l.hasPointerCapture(c.pointerId)&&(K(e,l,c),f())})})}function re(){const e=d.flows.find(t=>t.id===d.selectedFlowId);if(!e){E.className="editor-empty",E.textContent="Select a flow to edit its parameters.";return}if(E.className="editor",E.innerHTML="",E.append(j("Strength",e.strength,-12,12,.1,t=>{e.strength=t})),e.kind!=="uniform"){const t=document.createElement("p");t.className="position-readout",t.textContent=`Position: (${e.x.toFixed(2)}, ${e.y.toFixed(2)})`,E.append(t)}(e.kind==="uniform"||e.kind==="doublet")&&E.append(j("Direction",G(e.angle),-180,180,1,t=>{e.angle=B(t)},"deg"))}function j(e,t,n,r,o,i,s=""){const l=document.createElement("label");l.className="field";const c=Number.isInteger(o)?t.toFixed(0):t.toFixed(1);l.innerHTML=`
    <span>${e} <output>${c}${s?` ${s}`:""}</output></span>
    <input type="range" min="${n}" max="${r}" step="${o}" value="${t}" />
  `;const y=l.querySelector("input"),v=l.querySelector("output");if(!y||!v)throw new Error("Range field was not created.");return y.addEventListener("input",()=>{const h=Number(y.value);i(h),v.textContent=`${Number.isInteger(o)?h.toFixed(0):h.toFixed(1)}${s?` ${s}`:""}`,f()}),l}function S(e,t){const n=e.querySelector(t);if(!n)throw new Error(`Required child ${t} was not created.`);return n}function K(e,t,n){const r=S(t,"svg"),o=H(e.side),i=r.getBoundingClientRect(),s=(n.clientX-i.left)/i.width*120,l=(n.clientY-i.top)/i.height*72,c=Ie({x:s-o.center.x,y:l-o.center.y}),y={x:-c.x,y:-c.y},v=Math.atan2(-y.y,y.x),h=C(G(Pe(v-q(e.side))),-W,W);e.angleOffset=B(h),ie(t,e.side,h)}function ie(e,t,n){const r=S(e,"output"),o=S(e,".angle-arc-line"),i=S(e,".angle-arc-handle"),s=H(t),l=q(t)+B(n),c={x:Math.cos(l),y:-Math.sin(l)},y={x:-c.x,y:-c.y},v={x:s.center.x-y.x*18,y:s.center.y-y.y*18},h={x:s.center.x+y.x*s.radius,y:s.center.y+y.y*s.radius};r.textContent=`${n.toFixed(0)} deg`,o.setAttribute("x1",v.x.toFixed(2)),o.setAttribute("y1",v.y.toFixed(2)),o.setAttribute("x2",h.x.toFixed(2)),o.setAttribute("y2",h.y.toFixed(2)),i.setAttribute("cx",h.x.toFixed(2)),i.setAttribute("cy",h.y.toFixed(2))}function H(e){const n={left:{x:-1,y:0},right:{x:1,y:0},top:{x:0,y:-1},bottom:{x:0,y:1}},o={left:{x:100,y:36},right:{x:20,y:36},top:{x:60,y:58},bottom:{x:60,y:14}}[e],i=n[e],s={x:-i.y,y:i.x},l={x:o.x-s.x*40,y:o.y-s.y*40},c={x:o.x+s.x*40,y:o.y+s.y*40};return{center:o,radius:40,arcPath:Ee(o,i,s,40),flatPath:`M ${l.x.toFixed(2)} ${l.y.toFixed(2)} L ${c.x.toFixed(2)} ${c.y.toFixed(2)}`}}function Ee(e,t,n,r){const o=[];for(let i=0;i<=24;i+=1){const s=Math.PI-Math.PI*i/24;o.push({x:e.x+Math.cos(s)*n.x*r+Math.sin(s)*t.x*r,y:e.y+Math.cos(s)*n.y*r+Math.sin(s)*t.y*r})}return o.map((i,s)=>`${s===0?"M":"L"} ${i.x.toFixed(2)} ${i.y.toFixed(2)}`).join(" ")}function Ie(e){const t=Math.max(Math.hypot(e.x,e.y),.001);return{x:e.x/t,y:e.y/t}}function Pe(e){let t=e;for(;t>Math.PI;)t-=Math.PI*2;for(;t<-Math.PI;)t+=Math.PI*2;return t}function f(){a.fillStyle=M.background,a.fillRect(0,0,R,_),Ae(),$e(),d.showVectors&&He(),Oe()}function Ae(){a.save(),a.lineWidth=1,a.strokeStyle=M.grid;for(let e=-5;e<=5;e+=.5)D(p({x:e,y:-m}),p({x:e,y:m}));for(let e=-3;e<=3;e+=.5)D(p({x:-x,y:e}),p({x,y:e}));a.restore()}function $e(){const e=[],t=new Ne(ve),n=Te();a.save(),a.lineWidth=1.25,n.forEach((r,o)=>{if(!t.canAccept(r,se(r)))return;const i=Ce(r,t);if(i.length<16)return;a.strokeStyle=o%4===0?M.streamline:M.streamlineMuted,_e(i);const s=Re(i);e.push(...s),t.addMany(s)}),d.showSeeds&&Ve(e),a.restore()}function Te(){const e=[];for(let t=-m+k;t<=m-k;t+=Y)for(let n=-x+k;n<=x-k;n+=Y)e.push({x:n,y:t});return e.sort((t,n)=>{const r=A(P(t,$()));return A(P(n,$()))-r})}function Ce(e,t){const n=J(e,-1,t).reverse(),r=J(e,1,t);return[...n,e,...r]}function J(e,t,n){const r=[];let o=e;for(let i=0;i<xe;i+=1){const s=P(o,$());if(A(s)<.025)break;const c=Fe(o,he*t);if(De(c)||!n.canAccept(c,se(c)))break;r.push(c),o=c}return r}function Fe(e,t){const n=l=>{const c=P(l,$()),y=Math.max(A(c),.001);return{x:c.x/y,y:c.y/y}},r=n(e),o=n({x:e.x+t*r.x/2,y:e.y+t*r.y/2}),i=n({x:e.x+t*o.x/2,y:e.y+t*o.y/2}),s=n({x:e.x+t*i.x,y:e.y+t*i.y});return{x:e.x+t/6*(r.x+2*o.x+2*i.x+s.x),y:e.y+t/6*(r.y+2*o.y+2*i.y+s.y)}}function se(e){const t=A(P(e,$()));return C(X/Math.sqrt(1+t*.55),ge,X)}class Ne{constructor(t){this.cellSize=t}cellSize;cells=new Map;canAccept(t,n){const r=p(t),o=this.cellFor(r),i=Math.ceil(n/this.cellSize);for(let s=o.y-i;s<=o.y+i;s+=1)for(let l=o.x-i;l<=o.x+i;l+=1){const c=this.cells.get(this.key(l,s));if(!c)continue;if(c.some(v=>{const h=p(v);return Math.hypot(r.x-h.x,r.y-h.y)<n}))return!1}return!0}addMany(t){t.forEach(n=>{const r=p(n),o=this.cellFor(r),i=this.key(o.x,o.y),s=this.cells.get(i);s?s.push(n):this.cells.set(i,[n])})}cellFor(t){return{x:Math.floor(t.x/this.cellSize),y:Math.floor(t.y/this.cellSize)}}key(t,n){return`${t},${n}`}}function Re(e){return e.filter((t,n)=>n%me===0)}function _e(e){a.beginPath(),e.forEach((t,n)=>{const r=p(t);n===0?a.moveTo(r.x,r.y):a.lineTo(r.x,r.y)}),a.stroke()}function Ve(e){a.fillStyle=M.marker,e.forEach(t=>{const n=p(t);a.beginPath(),a.arc(n.x,n.y,1.5,0,Math.PI*2),a.fill()})}function De(e){return e.x<-x||e.x>x||e.y<-m||e.y>m}function He(){a.save(),a.strokeStyle=M.vector,a.fillStyle=M.vector,a.lineWidth=1;for(let e=-m+.4;e<=m-.4;e+=.65)for(let t=-x+.4;t<=x-.4;t+=.65){const n={x:t,y:e},r=P(n,$()),o=A(r);if(o<.04)continue;const i=Math.min(.28,.11+o*.035),s={x:r.x/o,y:r.y/o},l=p(n),c=p({x:n.x+s.x*i,y:n.y+s.y*i});We(l,c)}a.restore()}function Oe(){a.save(),d.flows.forEach(e=>{if(e.kind==="uniform")return;const t=p({x:e.x,y:e.y});if(a.fillStyle=O(e),a.strokeStyle=e.id===d.selectedFlowId?M.markerStroke:M.axis,a.lineWidth=e.id===d.selectedFlowId?2.5:1.5,a.beginPath(),a.arc(t.x,t.y,7,0,Math.PI*2),a.fill(),a.stroke(),e.kind==="doublet"){const n={x:Math.cos(e.angle),y:Math.sin(e.angle)};D(p({x:e.x-n.x*.28,y:e.y-n.y*.28}),p({x:e.x+n.x*.28,y:e.y+n.y*.28}))}}),a.restore()}function O(e){return e.kind==="uniform"?M.marker:ke[e.kind]}function Be(e){if(w){L();return}if(!e){L();return}F!==e.id&&(L(),F=e.id,N=window.setTimeout(()=>{w||F!==e.id||Ge(e)},fe))}function L(){F=null,N!==null&&(window.clearTimeout(N),N=null),I.hidden=!0,I.innerHTML=""}function Ge(e){const t=te(e.kind);I.style.setProperty("--tooltip-flow-color",O(e)),I.innerHTML=`
    <div class="primitive-tooltip-title">${e.name}</div>
    <div class="primitive-tooltip-type">${t}</div>
    <code>${Ue(e.kind)}</code>
  `,I.hidden=!1,qe(e)}function qe(e){const n=g(".boundary-layout").getBoundingClientRect(),r=u.getBoundingClientRect(),o=p({x:e.x,y:e.y}),i=260,s=112,l=C(r.left-n.left+o.x+16,10,n.width-i-10),c=C(r.top-n.top+o.y-18,10,n.height-s-10);I.style.left=`${l}px`,I.style.top=`${c}px`}function Ue(e){switch(e){case"uniform":return"psi = U(y cos alpha - x sin alpha)";case"source":return"psi = (Q / 2pi) theta";case"sink":return"psi = -(Q / 2pi) theta";case"doublet":return"psi = -(mu / 2pi r) sin(theta - alpha)";case"vortex":return"psi = -(Gamma / 2pi) ln r"}}function ae(e){let t=null,n=Number.POSITIVE_INFINITY;return d.flows.forEach(r=>{if(r.kind==="uniform")return;const o=p({x:r.x,y:r.y}),i=Math.hypot(o.x-e.x,o.y-e.y);i<=pe&&i<n&&(t=r,n=i)}),t}function ce(e,t){const n=le(t);e.x=ee(C(n.x,-x+k,x-k)),e.y=ee(C(n.y,-m+k,m-k))}function D(e,t){a.beginPath(),a.moveTo(e.x,e.y),a.lineTo(t.x,t.y),a.stroke()}function We(e,t){const n=Math.atan2(t.y-e.y,t.x-e.x);a.beginPath(),a.moveTo(e.x,e.y),a.lineTo(t.x,t.y),a.stroke(),a.beginPath(),a.moveTo(t.x,t.y),a.lineTo(t.x-Math.cos(n-.55)*5,t.y-Math.sin(n-.55)*5),a.lineTo(t.x-Math.cos(n+.55)*5,t.y-Math.sin(n+.55)*5),a.closePath(),a.fill()}function p(e){return{x:(e.x+x)/(x*2)*R,y:(m-e.y)/(m*2)*_}}function le(e){return{x:e.x/R*x*2-x,y:m-e.y/_*m*2}}function B(e){return e*Math.PI/180}function G(e){return e*180/Math.PI}function ee(e){return Math.round(e/U)*U}function C(e,t,n){return Math.min(n,Math.max(t,e))}function $(){return[...d.flows,...d.sideFlows.map(Ye)]}function Ye(e){return{id:`side-${e.side}`,kind:"uniform",name:`${e.side} boundary`,x:0,y:0,strength:e.speed,angle:q(e.side)+e.angleOffset,enabled:e.enabled}}function q(e){switch(e){case"left":return 0;case"right":return Math.PI;case"top":return-Math.PI/2;case"bottom":return Math.PI/2}}function de(){return[{side:"left",enabled:!0,speed:1.2,angleOffset:0},{side:"right",enabled:!1,speed:1.2,angleOffset:0},{side:"top",enabled:!1,speed:1.2,angleOffset:0},{side:"bottom",enabled:!1,speed:1.2,angleOffset:0}]}T();f();
