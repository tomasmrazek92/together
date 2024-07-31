"use strict";(()=>{$("body").append('<div id="follow-bubble"><span class="heading-style-h8">View</span></div>');var f=".list-b.w-dyn-items .w-dyn-item",d=140,p=196,S=(t,e=!0)=>{if(t=e?t.trim():t,!t)return null;let n=document.createElement("template");n.innerHTML=t;let o=n.content.children;return o.length===1?o[0]:o},l=170,h=64,s=document.getElementById("follow-bubble"),i=null,c=[0,0],B=t=>{t.clientX&&t.clientY&&(c=[t.clientX,t.clientY])},A=t=>{var o;let e=t.querySelector(".blog-item-line-path"),n=(o=t.nextElementSibling)==null?void 0:o.querySelector(".blog-item-line-path");return{top:e,bottom:n}},b=t=>{if(t){let{top:e,bottom:n}=A(t);e&&e.setAttribute("d",r(32)),n&&n.setAttribute("d",r(32))}},R=t=>{let e=t.getBoundingClientRect();return(t.querySelector(".list-b_head").getBoundingClientRect().width-d)/2},T=()=>{let t=document.elementFromPoint(...c);if(t){let e=t.closest(f);e?e!==i&&(b(i),i=e):(b(i),i=null)}i===null&&(s.style.opacity=0,s.style.transform="scale(0.8)")},m=t=>{var e;if(window.innerWidth<992){s.style.opacity=0,s.style.transform="scale(0.8)";return}if(B(t),T(),i){let n=i.getBoundingClientRect(),o=c[1]-n.top,a=o/n.height,E=Math.min(o,l)/l,y=Math.round(Math.min(E,.5)*h);i.querySelector(".blog-item-line-path").setAttribute("d",r(y));let w=Math.min(Math.abs(o-n.height),l)/l,L=Math.round((1-Math.min(w,.5))*h),u=(e=i.nextElementSibling)==null?void 0:e.querySelector(".blog-item-line-path");u&&u.setAttribute("d",r(L));let I=(a-.5)*30,g=R(i);document.querySelectorAll(".blog-item-line").forEach(M=>M.style.left=`${g+d}px`),s.style.left=`${n.left+g+d-p/2+2}px`,s.style.top=`${c[1]-p*a+I}px`,setTimeout(()=>{s.style.opacity=1,s.style.transform="scale(1)"},100)}};document.addEventListener("mousemove",m);document.addEventListener("scroll",m);document.addEventListener("resize",m);var r=t=>`M0 32C100 32 125 ${t} 200 ${t}C275 ${t} 300 32 400 32`,v=()=>{document.querySelectorAll(f).forEach(e=>{let n=S(`
<svg
class="blog-item-line"
width="400"
height="64"
viewBox="0 0 400 64"
fill="var(--light-gray)"
xmlns="http://www.w3.org/2000/svg"
>
<rect width="100%" height="100%" fill="var(--light-gray)"/>
<path
class="blog-item-line-path"
d="M0 32C100 32 100 32 200 32C300 32 300 32 400 32"
stroke="var(--medium-gray)"
/>
  </svg>`);e.appendChild(n)})};v();window.fsAttributes=window.fsAttributes||[];window.fsAttributes.push(["cmsload",t=>{console.log("cmsload Successfully loaded!");let[e]=t;e.on("renderitems",n=>{v()})}]);})();
