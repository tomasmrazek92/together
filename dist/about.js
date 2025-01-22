"use strict";(()=>{var o=[],c=[],l=null;window.fsAttributes=window.fsAttributes||[];async function d(){try{o=(await u()).jobs;let r=new Set;return o.forEach(e=>{e.departments&&e.departments.length>0&&r.add(e.departments[0].name)}),c=Array.from(r),!0}catch(t){return console.error("Error loading data:",t),!1}}async function f(){try{await d(),await window.fsAttributes.cmsload.init(),window.fsAttributes.push(["cmsload",async t=>{let[r]=t,[e]=r.items;l=e.element.cloneNode(!0),r.clearItems();let a=o.map(n=>w(n,l));await r.addItems(a),m(c),await window.fsAttributes.cmsfilter.init(),window.fsAttributes.push(["cmsfilter",n=>{let[s]=n}]),$("input[type='radio'][name='filter']").change(function(){let n=$(this).closest("section");n.find("[fs-cmsfilter-element='clear']").removeClass("fs-cmsfilter_active"),n.find("input[type='radio'][name='filter']:checked").closest("[fs-cmsfilter-element='clear']").addClass("fs-cmsfilter_active")}),document.querySelector("[job-list]").style.opacity="1"}])}catch(t){console.error("Error in initialization sequence:",t)}}function m(t){let r=document.querySelector('[fs-cmsstatic-element="list"]');r&&(r.innerHTML="",t.forEach((e,a)=>{let n=document.createElement("div");n.className="filters-item w-dyn-item",n.setAttribute("role","listitem"),n.innerHTML=`
      <label data-element="filter" class="tab w-radio">
        <input type="radio" 
          data-name="filter" 
          id="radio-2-${a}-${a}" 
          name="filter" 
          class="w-form-formradioinput hide w-radio-input" 
          value="${e}">
        <span fs-cmsfilter-field="category" 
          class="text-size-navigation w-form-label" 
          for="radio-2">${e}</span>
      </label>
    `,r.appendChild(n)}))}async function u(){try{return await(await fetch("https://boards-api.greenhouse.io/v1/boards/togetherai/jobs?content=true")).json()}catch(t){return console.error("Error fetching jobs:",t),{jobs:[]}}}function w(t,r){let e=r.cloneNode(!0),a=e.querySelector("[data-label]"),n=e.querySelector("[data-heading]"),s=e.querySelector("[data-location]"),i=e.querySelector("[data-button]");return a&&(a.textContent=t.departments[0].name),n&&(n.textContent=t.title),s&&(s.textContent=t.location.name),i&&(i.setAttribute("href",t.absolute_url),i.target="_blank"),e}f();})();
