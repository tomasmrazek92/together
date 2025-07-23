"use strict";(()=>{var s=[],l=[],c=null;window.fsAttributes=window.fsAttributes||[];async function d(){try{s=(await u()).jobs;let a=new Set;return s.forEach(e=>{e.departments&&e.departments.length>0&&a.add(e.departments[0].name)}),l=Array.from(a),console.log("2. Data loaded:",{jobs:s.length,departments:l}),!0}catch(t){return console.error("Error loading data:",t),!1}}async function f(){try{await d(),await window.fsAttributes.cmsload.init(),window.fsAttributes.push(["cmsload",async t=>{let[a]=t,[e]=a.items;c=e.element.cloneNode(!0),a.clearItems();let r=s.map(n=>p(n,c));await a.addItems(r),m(l),await window.fsAttributes.cmsfilter.init(),window.fsAttributes.push(["cmsfilter",n=>{let[i]=n}]),$("input[type='radio'][name='filter']").change(function(){let n=$(this).closest("section");n.find("[fs-cmsfilter-element='clear']").removeClass("fs-cmsfilter_active"),n.find("input[type='radio'][name='filter']:checked").closest("[fs-cmsfilter-element='clear']").addClass("fs-cmsfilter_active")}),document.querySelector("[job-list]").style.opacity="1"}])}catch(t){console.error("Error in initialization sequence:",t)}}function m(t){let a=document.querySelector('[fs-cmsstatic-element="list"]');a&&(a.innerHTML="",t.forEach((e,r)=>{let n=document.createElement("div");n.className="filters-item w-dyn-item",n.setAttribute("role","listitem"),n.innerHTML=`
      <label data-element="filter" class="tab w-radio">
        <input type="radio" 
          data-name="filter" 
          id="radio-2-${r}-${r}" 
          name="filter" 
          class="w-form-formradioinput hide w-radio-input" 
          value="${e}">
        <span fs-cmsfilter-field="category" 
          class="text-size-navigation w-form-label" 
          for="radio-2">${e}</span>
      </label>
    `,a.appendChild(n)}))}async function u(){try{return await(await fetch("https://boards-api.greenhouse.io/v1/boards/togetherai/jobs?content=true")).json()}catch(t){return console.error("Error fetching jobs:",t),{jobs:[]}}}function p(t,a){let e=a.cloneNode(!0),r=e.querySelector("[data-label]"),n=e.querySelector("[data-heading]"),i=e.querySelector("[data-location]"),o=e.querySelector("[data-button]");return r&&(r.textContent=t.departments[0].name),n&&(n.textContent=t.title),i&&(i.textContent=t.location.name),o&&(o.setAttribute("href",t.absolute_url),o.target="_blank"),e}f();})();
