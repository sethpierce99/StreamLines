(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function n(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(o){if(o.ep)return;o.ep=!0;const r=n(o);fetch(o.href,r)}})();const C=Math.PI*2,ne=.025;function L(e,t){return t.reduce((n,s)=>{if(!s.enabled)return n;const o=oe(e,s);return n.x+=o.x,n.y+=o.y,n},{x:0,y:0})}function oe(e,t){if(t.kind==="uniform")return{x:t.strength*Math.cos(t.angle),y:t.strength*Math.sin(t.angle)};const n=e.x-t.x,s=e.y-t.y,o=Math.max(n*n+s*s,ne);if(t.kind==="source"||t.kind==="sink"){const v=(t.kind==="source"?1:-1)*t.strength/(C*o);return{x:v*n,y:v*s}}if(t.kind==="vortex"){const h=t.strength/(C*o);return{x:-h*s,y:h*n}}const r=Math.cos(t.angle),a=Math.sin(t.angle),l=r*n+a*s,u=-t.strength/(C*o*o);return{x:u*(r*o-2*n*l),y:u*(a*o-2*s*l)}}function P(e){return Math.hypot(e.x,e.y)}function se(e){switch(e){case"uniform":return"Uniform";case"source":return"Source";case"sink":return"Sink";case"doublet":return"Doublet";case"vortex":return"Vortex"}}const M=820,$=500,f=5.5,g=3.35,re=.045,ie=460,D=.45,R=.25,ae=14,O=80,x=.25,c={showVectors:!0,showSeeds:!1,selectedFlowId:null,flows:[],sideFlows:te()};let E=null;const X=document.querySelector("#app");if(!X)throw new Error("App root was not found.");X.innerHTML=`
  <main class="workbench" aria-label="Potential flow streamline workbench">
    <aside class="panel">
      <header class="panel-header">
        <h1>StreamLines</h1>
        <p>Compose ideal-flow primitives and watch the streamline field respond.</p>
      </header>

      <section class="control-group" aria-labelledby="add-flow-label">
        <h2 id="add-flow-label">Add Primitive</h2>
        <div class="button-grid">
          <button class="flow-add" type="button" data-kind="source">Source</button>
          <button class="flow-add" type="button" data-kind="sink">Sink</button>
          <button class="flow-add" type="button" data-kind="doublet">Doublet</button>
          <button class="flow-add" type="button" data-kind="vortex">Vortex</button>
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
        <canvas id="flow-canvas" width="${M}" height="${$}" aria-label="Canvas showing potential flow streamlines"></canvas>
        <div id="side-right" class="side-control side-control-right"></div>
        <div id="side-bottom" class="side-control side-control-bottom"></div>
      </div>
      <div id="readout" class="readout">x 0.00, y 0.00, |V| 0.00</div>
    </section>
  </main>
`;const d=m("#flow-canvas"),i=de(d),_=m("#flow-list"),S=m("#flow-editor"),z=m("#readout"),H=m("#toggle-vectors"),U=m("#toggle-seeds"),ce=m("#reset-case"),le=new Map([["left",m("#side-left")],["right",m("#side-right")],["top",m("#side-top")],["bottom",m("#side-bottom")]]),k=getComputedStyle(document.documentElement),b={background:k.getPropertyValue("--canvas-background").trim(),grid:k.getPropertyValue("--canvas-grid").trim(),axis:k.getPropertyValue("--canvas-axis").trim(),streamline:k.getPropertyValue("--streamline").trim(),streamlineMuted:k.getPropertyValue("--streamline-muted").trim(),vector:k.getPropertyValue("--vector").trim(),marker:k.getPropertyValue("--marker").trim(),markerStroke:k.getPropertyValue("--marker-stroke").trim()};function m(e){const t=document.querySelector(e);if(!t)throw new Error(`Required element ${e} was not created.`);return t}function de(e){const t=e.getContext("2d");if(!t)throw new Error("Canvas 2D context is not available.");return t}document.querySelectorAll(".flow-add").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.kind,n=ue(t);c.flows.push(n),c.selectedFlowId=n.id,I(),y()})});H.addEventListener("change",()=>{c.showVectors=H.checked,y()});U.addEventListener("change",()=>{c.showSeeds=U.checked,y()});ce.addEventListener("click",()=>{c.flows=[{id:crypto.randomUUID(),kind:"doublet",name:"Doublet 1",x:0,y:0,strength:5,angle:0,enabled:!0}],c.sideFlows=te(),c.selectedFlowId=c.flows[0]?.id??null,I(),y()});d.addEventListener("mousemove",e=>{const t=d.getBoundingClientRect(),n=J({x:e.clientX-t.left,y:e.clientY-t.top}),s=Z({x:e.clientX-t.left,y:e.clientY-t.top}),o=L(n,A());z.textContent=`x ${n.x.toFixed(2)}, y ${n.y.toFixed(2)}, |V| ${P(o).toFixed(2)}`,d.classList.toggle("is-draggable",!!s)});d.addEventListener("mouseleave",()=>{z.textContent="x 0.00, y 0.00, |V| 0.00",d.classList.remove("is-draggable")});d.addEventListener("pointerdown",e=>{const t=d.getBoundingClientRect(),n={x:e.clientX-t.left,y:e.clientY-t.top},s=Z(n);s&&(c.selectedFlowId=s.id,E={flowId:s.id},d.setPointerCapture(e.pointerId),d.classList.add("is-dragging"),j(s,n),I(),y())});d.addEventListener("pointermove",e=>{if(!E)return;const t=c.flows.find(s=>s.id===E?.flowId);if(!t){E=null,d.classList.remove("is-dragging");return}const n=d.getBoundingClientRect();j(t,{x:e.clientX-n.left,y:e.clientY-n.top}),K(),y()});d.addEventListener("pointerup",e=>{E=null,d.releasePointerCapture(e.pointerId),d.classList.remove("is-dragging")});d.addEventListener("pointercancel",e=>{E=null,d.releasePointerCapture(e.pointerId),d.classList.remove("is-dragging")});function ue(e){const t=c.flows.filter(s=>s.kind===e).length+1,n={uniform:{x:0,y:0,strength:1,angle:0},source:{x:-1.25,y:0,strength:4,angle:0},sink:{x:1.25,y:0,strength:4,angle:0},doublet:{x:0,y:0,strength:5,angle:0},vortex:{x:0,y:0,strength:5,angle:0}};return{id:crypto.randomUUID(),kind:e,name:`${se(e)} ${t}`,enabled:!0,...n[e]}}function I(){fe(),_.innerHTML="",c.flows.forEach(e=>{const t=document.createElement("div");t.className=`flow-row${e.id===c.selectedFlowId?" selected":""}`;const n=document.createElement("button");n.type="button",n.className="flow-select",n.textContent=e.name,n.addEventListener("click",()=>{c.selectedFlowId=e.id,I(),y()});const s=document.createElement("input");s.type="checkbox",s.checked=e.enabled,s.ariaLabel=`Enable ${e.name}`,s.addEventListener("change",()=>{e.enabled=s.checked,y()});const o=document.createElement("button");o.type="button",o.className="remove-flow",o.textContent="Remove",o.addEventListener("click",()=>{c.flows=c.flows.filter(r=>r.id!==e.id),c.selectedFlowId===e.id&&(c.selectedFlowId=c.flows[0]?.id??null),I(),y()}),t.append(s,n,o),_.append(t)}),K()}function fe(){c.sideFlows.forEach(e=>{const t=le.get(e.side);if(!t)return;const n=ee(e.angleOffset),s=e.side[0].toUpperCase()+e.side.slice(1);t.innerHTML=`
      <label class="side-toggle">
        <input type="checkbox" data-side-toggle="${e.side}" ${e.enabled?"checked":""} />
        ${s}
      </label>
      <label class="side-slider side-speed">
        <span>Velocity <output>${e.speed.toFixed(1)}</output></span>
        <input type="range" min="0" max="5" step="0.1" value="${e.speed}" data-side-speed="${e.side}" />
      </label>
      <div class="side-angle" data-side-angle="${e.side}">
        <span>Angle <output>${n.toFixed(0)} deg</output></span>
        <svg viewBox="0 0 120 62" aria-hidden="true">
          <path class="angle-arc-track" d="M 18 48 A 42 42 0 0 1 102 48"></path>
          <path class="angle-arc-normal" d="M 60 48 L 60 13"></path>
          <line class="angle-arc-ray" x1="60" y1="48" x2="60" y2="13"></line>
          <circle class="angle-arc-handle" cx="60" cy="13" r="6"></circle>
        </svg>
      </div>
    `;const o=w(t,`[data-side-toggle="${e.side}"]`),r=w(t,`[data-side-speed="${e.side}"]`),a=w(t,`[data-side-angle="${e.side}"]`);Q(a,n),o.addEventListener("change",()=>{e.enabled=o.checked,y()}),r.addEventListener("input",()=>{e.speed=Number(r.value);const l=w(t,".side-speed output");l.textContent=e.speed.toFixed(1),y()}),a.addEventListener("pointerdown",l=>{a.setPointerCapture(l.pointerId),B(e,a,l),y()}),a.addEventListener("pointermove",l=>{a.hasPointerCapture(l.pointerId)&&(B(e,a,l),y())})})}function K(){const e=c.flows.find(t=>t.id===c.selectedFlowId);if(!e){S.className="editor-empty",S.textContent="Select a flow to edit its parameters.";return}if(S.className="editor",S.innerHTML="",S.append(q("Strength",e.strength,-12,12,.1,t=>{e.strength=t})),e.kind!=="uniform"){const t=document.createElement("p");t.className="position-readout",t.textContent=`Position: (${e.x.toFixed(2)}, ${e.y.toFixed(2)})`,S.append(t)}(e.kind==="uniform"||e.kind==="doublet")&&S.append(q("Direction",ee(e.angle),-180,180,1,t=>{e.angle=V(t)},"deg"))}function q(e,t,n,s,o,r,a=""){const l=document.createElement("label");l.className="field";const u=Number.isInteger(o)?t.toFixed(0):t.toFixed(1);l.innerHTML=`
    <span>${e} <output>${u}${a?` ${a}`:""}</output></span>
    <input type="range" min="${n}" max="${s}" step="${o}" value="${t}" />
  `;const h=l.querySelector("input"),v=l.querySelector("output");if(!h||!v)throw new Error("Range field was not created.");return h.addEventListener("input",()=>{const T=Number(h.value);r(T),v.textContent=`${Number.isInteger(o)?T.toFixed(0):T.toFixed(1)}${a?` ${a}`:""}`,y()}),l}function w(e,t){const n=e.querySelector(t);if(!n)throw new Error(`Required child ${t} was not created.`);return n}function B(e,t,n){const o=w(t,"svg").getBoundingClientRect(),r=(n.clientX-o.left)/o.width*120,a=(n.clientY-o.top)/o.height*62,l=N(Math.atan2(r-60,48-a)*(180/Math.PI),-O,O);e.angleOffset=V(l),Q(t,l)}function Q(e,t){const n=w(e,"output"),s=w(e,".angle-arc-ray"),o=w(e,".angle-arc-handle"),r=ge(t);n.textContent=`${t.toFixed(0)} deg`,s.setAttribute("x2",r.x.toFixed(2)),s.setAttribute("y2",r.y.toFixed(2)),o.setAttribute("cx",r.x.toFixed(2)),o.setAttribute("cy",r.y.toFixed(2))}function ge(e){const t=V(e);return{x:60+Math.sin(t)*42,y:48-Math.cos(t)*42}}function y(){i.fillStyle=b.background,i.fillRect(0,0,M,$),ye(),xe(),c.showVectors&&he(),me()}function ye(){i.save(),i.lineWidth=1,i.strokeStyle=b.grid;for(let e=-5;e<=5;e+=.5)F(p({x:e,y:-g}),p({x:e,y:g}));for(let e=-3;e<=3;e+=.5)F(p({x:-f,y:e}),p({x:f,y:e}));i.restore()}function xe(){const e=ve();i.save(),i.lineWidth=1.25,e.forEach((t,n)=>{const s=W(t,1),r=[...W(t,-1).reverse(),t,...s];if(!(r.length<4)&&(i.strokeStyle=n%4===0?b.streamline:b.streamlineMuted,i.beginPath(),r.forEach((a,l)=>{const u=p(a);l===0?i.moveTo(u.x,u.y):i.lineTo(u.x,u.y)}),i.stroke(),c.showSeeds)){const a=p(t);i.fillStyle=b.marker,i.beginPath(),i.arc(a.x,a.y,2.4,0,Math.PI*2),i.fill()}}),i.restore()}function W(e,t){const n=[];let s=e;for(let o=0;o<ie;o+=1){const r=L(s,A()),a=P(r);if(a<.03||G(s))break;const l={x:r.x/a,y:r.y/a},u=pe(s,l,re*t);if(G(u))break;n.push(u),s=u}return n}function pe(e,t,n){const s=u=>{const h=L(u,A()),v=Math.max(P(h),.001);return{x:h.x/v,y:h.y/v}},o=t,r=s({x:e.x+n*o.x/2,y:e.y+n*o.y/2}),a=s({x:e.x+n*r.x/2,y:e.y+n*r.y/2}),l=s({x:e.x+n*a.x,y:e.y+n*a.y});return{x:e.x+n/6*(o.x+2*r.x+2*a.x+l.x),y:e.y+n/6*(o.y+2*r.y+2*a.y+l.y)}}function he(){i.save(),i.strokeStyle=b.vector,i.fillStyle=b.vector,i.lineWidth=1;for(let e=-g+.4;e<=g-.4;e+=.65)for(let t=-f+.4;t<=f-.4;t+=.65){const n={x:t,y:e},s=L(n,A()),o=P(s);if(o<.04)continue;const r=Math.min(.28,.11+o*.035),a={x:s.x/o,y:s.y/o},l=p(n),u=p({x:n.x+a.x*r,y:n.y+a.y*r});be(l,u)}i.restore()}function me(){i.save(),c.flows.forEach(e=>{if(e.kind==="uniform")return;const t=p({x:e.x,y:e.y});if(i.fillStyle=b.marker,i.strokeStyle=e.id===c.selectedFlowId?b.markerStroke:b.axis,i.lineWidth=e.id===c.selectedFlowId?2.5:1.5,i.beginPath(),i.arc(t.x,t.y,7,0,Math.PI*2),i.fill(),i.stroke(),e.kind==="doublet"){const n={x:Math.cos(e.angle),y:Math.sin(e.angle)};F(p({x:e.x-n.x*.28,y:e.y-n.y*.28}),p({x:e.x+n.x*.28,y:e.y+n.y*.28}))}}),i.restore()}function Z(e){let t=null,n=Number.POSITIVE_INFINITY;return c.flows.forEach(s=>{if(s.kind==="uniform")return;const o=p({x:s.x,y:s.y}),r=Math.hypot(o.x-e.x,o.y-e.y);r<=ae&&r<n&&(t=s,n=r)}),t}function j(e,t){const n=J(t);e.x=Y(N(n.x,-f+x,f-x)),e.y=Y(N(n.y,-g+x,g-x))}function F(e,t){i.beginPath(),i.moveTo(e.x,e.y),i.lineTo(t.x,t.y),i.stroke()}function be(e,t){const n=Math.atan2(t.y-e.y,t.x-e.x);i.beginPath(),i.moveTo(e.x,e.y),i.lineTo(t.x,t.y),i.stroke(),i.beginPath(),i.moveTo(t.x,t.y),i.lineTo(t.x-Math.cos(n-.55)*5,t.y-Math.sin(n-.55)*5),i.lineTo(t.x-Math.cos(n+.55)*5,t.y-Math.sin(n+.55)*5),i.closePath(),i.fill()}function ve(){const e=[];for(let t=-g+x;t<=g-x;t+=D)e.push({x:-f+x,y:t}),e.push({x:f-x,y:t});for(let t=-f+x;t<=f-x;t+=D)e.push({x:t,y:-g+x}),e.push({x:t,y:g-x});return e}function p(e){return{x:(e.x+f)/(f*2)*M,y:(g-e.y)/(g*2)*$}}function J(e){return{x:e.x/M*f*2-f,y:g-e.y/$*g*2}}function G(e){return e.x<-f||e.x>f||e.y<-g||e.y>g}function V(e){return e*Math.PI/180}function ee(e){return e*180/Math.PI}function Y(e){return Math.round(e/R)*R}function N(e,t,n){return Math.min(n,Math.max(t,e))}function A(){return[...c.flows,...c.sideFlows.map(ke)]}function ke(e){return{id:`side-${e.side}`,kind:"uniform",name:`${e.side} boundary`,x:0,y:0,strength:e.speed,angle:we(e.side)+e.angleOffset,enabled:e.enabled}}function we(e){switch(e){case"left":return 0;case"right":return Math.PI;case"top":return-Math.PI/2;case"bottom":return Math.PI/2}}function te(){return[{side:"left",enabled:!0,speed:1.2,angleOffset:0},{side:"right",enabled:!1,speed:1.2,angleOffset:0},{side:"top",enabled:!1,speed:1.2,angleOffset:0},{side:"bottom",enabled:!1,speed:1.2,angleOffset:0}]}I();y();
