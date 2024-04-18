"use strict";(()=>{var Z=window.innerWidth,S={};var fe=(l,s,n,a,p)=>{let d=$(l);d.length!==0&&(S[n]=0,S[n]=S[n]||0,d.each(function(){let f=`${n}_${S[n]}`;ue(this,s,f,[".swiper-arrow",".swiper-navigation"]);let m=pe(a,f);he(this,s,f,n,m,p),S[n]++}))},ue=(l,s,n,a)=>{a.forEach(p=>{$(l).find(p).addClass(n)}),$(l).find(s).addClass(n)},pe=(l,s)=>Object.assign({},l,{navigation:{prevEl:`.swiper-arrow.prev.${s}`,nextEl:`.swiper-arrow.next.${s}`},pagination:{el:`.swiper-navigation.${s}`,type:"bullets",bulletActiveClass:"w-active",bulletClass:"w-slider-dot"}}),he=(l,s,n,a,p,d)=>{swipers[a]=swipers[a]||{},swipers[a][n]=swipers[a][n]||{};let f=swipers[a][n],m=f.swiperInstance,v=d==="desktop"&&window.matchMedia("(min-width: 992px)").matches,w=d==="mobile"&&window.matchMedia("(min-width: 0px) and (max-width: 991px)").matches,x=d==="all",y=()=>{f.observer&&(f.observer.disconnect(),delete f.observer),m&&(m.destroy(!0,!0),delete swipers[a][n],console.log("Swiper destroyed for",s,"with uniqueKey",n))};!v&&d==="desktop"||!w&&d==="mobile"||!x&&d==="all"?y():(v||w||x)&&!m&&(()=>{f.observer&&f.observer.disconnect();let E=$(`${s}.${n}`)[0],I=new IntersectionObserver(O=>{O.forEach(h=>{if(h.isIntersecting&&(v||w||x)&&!m){let e=new Swiper(`${s}.${n}`,p);swipers[a][n]={swiperInstance:e,mode:v?"desktop":w?"mobile":"all",initialized:!0},I.disconnect(),console.log("Swiper initialized for",s,"with uniqueKey",n)}})},{});swipers[a][n].observer=I,I.observe(E)})()},K=l=>{l.forEach(s=>{fe(...s)})},z=(l,s)=>{K(l),window.addEventListener("resize",function(){window.innerWidth!==Z&&(Z=window.innerWidth,K(l))})},M=(l,s)=>{let n=l.find(".progress-line"),a=s.params.autoplay.delay,p=s.realIndex,d=l.find(".navigation").find(".progress-bar"),f=d.eq(p),m=f.find(n);n.stop().css("width","0"),d.removeClass("active"),f.addClass("active"),m.animate({width:"100%"},a)};var B=l=>{let s=n=>{if(n.nodeType===Node.TEXT_NODE){if(!n.parentNode.classList.contains("letter")){let a=n.textContent,p=document.createDocumentFragment();for(let d=0;d<a.length;d++){let f=document.createElement("span");f.className="letter",f.textContent=a[d],p.appendChild(f)}n.parentNode.replaceChild(p,n)}}else n.nodeType===Node.ELEMENT_NODE&&n.tagName!=="BR"&&Array.from(n.childNodes).forEach(s)};$(l).contents().each(function(){s(this)})},te=(l,s)=>{let n=gsap.timeline(),a=0;return $(l).each((p,d)=>{let f=$(d).find(".letter").not(".line-numbers-row .code-letter"),m=$(d).find(".word-highlight");if(f.each((v,w)=>{n.fromTo(w,{visibility:"hidden"},{visibility:"initial"},a*s,"<"),a++}),m.length){let v=m[0],w=window.getComputedStyle(v).getPropertyValue("background-color"),x=window.getComputedStyle(v).getPropertyValue("box-shadow"),y=(h,e)=>{let[t,o,r]=h.match(/\w\w/g).map(u=>parseInt(u,16));return`rgba(${t}, ${o}, ${r}, ${e})`},A=h=>{let e=h.replace(/^rgba?\(/,"").replace(/\)$/,"").split(",");return`rgba(${e[0]}, ${e[1]}, ${e[2]}, 0)`},E=h=>/^#(?:[0-9a-f]{3}){1,2}$/i.test(h),I=E(w)?y(w,0):A(w),O=x.replace(/rgba?\([^)]+\)/g,h=>E(h)?y(h,0):A(h));Array.from(m).forEach(h=>{h.style.backgroundColor=I,h.style.boxShadow=O}),n.to(m,{backgroundColor:w,boxShadow:x,duration:.35},"<")}}),n},R=l=>{let s=document.createElement("textarea");s.value=l,document.body.appendChild(s),s.select(),document.execCommand("copy"),document.body.removeChild(s)},D=(l,s)=>{let n;return n=s||.01,B(l),te(l,n)},ie=(l,s)=>{let n=$(l).find("code"),a=n.find(".line-numbers-rows").eq(0).clone(),p;return p=s||.01,n.find(".line-numbers-rows").remove(),B(n),n.prepend(a),te(n,p)},H=!1,ee,ne=()=>{H?$("html, body").scrollTop(ee).removeClass("overflow-hidden"):(ee=$(window).scrollTop(),$("html, body").scrollTop(0).addClass("overflow-hidden")),H=!H};$(document).ready(function(){function l(e,t=!0){$(e).css("opacity",t?"1":"0")}$(document.links).filter(function(){return this.hostname!==window.location.hostname}).attr("target","_blank");let s;$("sup").on("click",function(){let e=$(this).text(),t=$("#footer-notes").find("li").eq(e-1);if(t.length>0){let o=t.offset().top-$(window).height()/2;$("html, body").animate({scrollTop:o},500),t.css("color","var(--charcoal)"),clearTimeout(s),s=setTimeout(()=>{t.removeAttr("style")},5e3)}});function n(){let e=document.querySelectorAll("*");for(let t of e){if(t.tagName.toLowerCase()==="body"||t.tagName.toLowerCase()==="html")continue;let o=window.getComputedStyle(t);(o.overflow==="auto"||o.overflow==="scroll"||o.overflowX==="auto"||o.overflowX==="scroll"||o.overflowY==="auto"||o.overflowY==="scroll")&&(t.classList.add("no-scrollbar"),t.classList.add("swiper-no-swiping"))}}n(),$(".w-richtext .w-embed pre").on("click",function(){let e=$(this).find("code").text();R(e)});let a=$(".video_modal"),p=a.find("video");$('[open-modal="true"]').on("click",function(){a.fadeIn(),d(p,!0)}),$(".video_modal-trigger, .video_close-modal").on("click",()=>{a.fadeOut(),d(p,!1)});function d(e,t){e.length&&(e.get(0).paused?t&&e.get(0).play():(e.get(0).pause(),e.get(0).currentTime=0))}$(".navbar_button").on("click",function(){ne()}),$(".navbar .tab").on("click",function(){window.innerWidth<=991&&$(".navbar_button").trigger("tap")}),f(),$(window).on("scroll",f);function f(){let t=10*parseFloat(getComputedStyle(document.documentElement).fontSize),o=$(window).scrollTop(),r=$(".navbar_wrapper"),u=!1;$(".background-color-charcoal").each(function(){let k=$(this).offset().top,q=$(this).height();if(o<=k+q-t&&o>=k-t)return u=!0,!1}),u&&!r.hasClass("background-color-charcoal")?r.addClass("background-color-charcoal"):!u&&r.hasClass("background-color-charcoal")&&r.removeClass("background-color-charcoal")}$(window).on("scroll load",function(){var e=$(window).scrollTop(),t=$(".navbar"),o="sticky";e>=200?t.hasClass(o)||t.addClass(o):t.removeClass(o)});function m(){var e=$(".sub-navbar_pill"),t=$(".navbar_link.w--current");if(t.length){var o=e.offset().left,r=t.offset().left,u=e.scrollLeft()+(r-o);e.animate({scrollLeft:u},500)}}var v=new MutationObserver(function(e){e.forEach(function(t){if(t.attributeName==="class"){var o=$(t.target);o.hasClass("w--current")&&m()}})}),w={attributes:!0,childList:!1,subtree:!1};$(".navbar_link").each(function(){v.observe(this,w)}),setTimeout(()=>{m()},300),$("[animated-hero]").each(function(){let e=$(this).find("h1").find("span"),t=gsap.timeline();t.add(D(e,.1)),t.to($(this).find(".hp-hero_par").find("p"),{opacity:1,stagger:.2},"<0.2"),t.to($(this).find(".button"),{opacity:1,stagger:.2},"<0.2")}),$("[output-text]").each(function(){B($(this)),l($(this))});let x=$("[faq-item]");x.click(function(){let e=$(this);e.hasClass("open")?e.removeClass("open"):(e.closest("section").find(x).filter(".open").click().removeClass("open"),e.addClass("open"))}),x.each(function(){$(this).attr("expand-default")==="true"&&$(this).trigger("click")});function y(e){$(e).each(function(){let t=$(this),o=$(".swiper-slide"),r=$(".autotabs_link"),u=$(".autotabs_content-item"),k=$(".progress-line"),q="is-active",X=11e3,Y,P=new Map,V=!0,me=!1;function oe(){return[[".autotabs_wrap",".autotabs_menu","auto-tabs",{slidesPerView:"auto",spaceBetween:40,on:{init:i=>{N($(i.el).closest(".autotabs_wrap"),i.realIndex)},beforeTransitionStart:i=>{i.realIndex===i.slides-1&&(i.slideTo(0),N($(i.el).closest(".autotabs_wrap"),i.realIndex))},slideChange:i=>{N($(i.el).closest(".autotabs_wrap"),i.realIndex)}}},"mobile"]]}function j(i,c){if(!V)return;let g=(c+1)%$(i).find(o).length;Y=setTimeout(()=>{N($(i),g),j($(i),g)},X)}function N(i,c,g=null){let T=g&&g.type==="click";U($(i));let b=$(i).find(o).eq(c).find(r),C=$(i).find(u).eq(c);if(b.addClass(q),C.find("video").length){let _=C.find("video").get(0);_.readyState>=3?(_.currentTime=0,_.play()):_.addEventListener("loadeddata",function(){_.currentTime=0,_.play()})}C.stop().css("display","flex").fadeIn(function(){C.css("opacity","1"),C.find(".chat-conv_box").length?ae($(i),c):C.find(".code-box").length&&re($(C))}),T||le(b)}function se(i){let c=i.get(0);if(P.get(c))return;V=!0,P.set(c,!0);let g=0;N($(i),g),j($(i),g)}function le(i){i.find(k).animate({width:"100%"},X)}let W;function ae(i,c){W&&W.kill();let g=$(i).find(u).eq(c),T=g.find("[input-text]"),b=g.find("[output-text]");T.stop().animate({opacity:1},function(){setTimeout(()=>{W=D(b,2/b.text().length)},250)})}let F;function re(i){let c=$(i).find("code").text().length;F&&F.kill(),F=ie(i,2/c)}function ce(i){let c=i.get(0);G($(i)),P.set(c,!1)}function G(i){V=!1,clearTimeout(Y),U(i),$(i).find(u).eq(0).show()}function U(i){$(i).find(r).filter(`.${q}`).removeClass(q),$(i).find(k).stop(!0,!0).css("width","0%"),$(i).find(u).hide(),$(i).find(u).find(".letter").css("visibility","hidden"),l($(i).find(u).find("[input-text]"),!1)}let ge=$(window).width(),J=null,L=new Map;function Q(i){let c=i.get(0),g=P.get(c)||!1,T=$(window).width();T!==J&&(J=T,T<=991?g&&ce(i):de(i))}function de(i){i.each(function(){let c=$(this);L.has(c[0])&&(L.get(c[0]).disconnect(),L.delete(c[0]))}),i.each(function(){let c=$(this),g=new IntersectionObserver(T=>{T.forEach(b=>{let C=b.target,_=P.get(C)||!1;b.isIntersecting&&(b.isIntersecting&&!_&&se($(b.target)),L.has(b.target)&&(L.get(b.target).disconnect(),L.delete(b.target)))})},{root:null,rootMargin:"0px",threshold:.5});g.observe(c[0]),L.set(c[0],g)})}Q(t),z(oe(t)),$(window).on("resize",()=>{Q(t)}),t.find(o).on("click",function(i){$(window).width()>=992&&(G(t),N(t,$(this).index(),i))})})}y($(".autotabs_wrap")),$(".chat-conv_copy-icon").on("click",function(){let e=$(this).closest(".chat-conv").length?$(this).closest(".chat-conv"):$(this).closest(".code-box"),t=e.find("[input-text]").text()||e.find("[output-text]").text()||e.find(".code-box_code").text();t&&R(t)}),$(".pill-header").each(function(){gsap.timeline({defaults:{ease:"power4.out"},paused:!0,scrollTrigger:{trigger:$(this),start:"center bottom"}}).add(A($(this)))});function A(e){let t=$(e).find(".pill-a, .pill-b, .pill-circle, .callout_p"),o=gsap.timeline({defaults:{ease:"power4.out",duration:.4}});return t.each(function(){let r=$(this),u=r.attr("class").split(" ")[0],k=r.find('div[class*="text"]');u==="pill-a"||u==="pill-b"?(o.fromTo(r.find("[mask]"),{xPercent:-100},{xPercent:0},">-0.2"),r.attr("direction")==="vertical"?o.fromTo(k,{yPercent:150},{yPercent:0},">-0.2"):o.fromTo(k,{xPercent:-110},{xPercent:0},">-0.2")):u==="callout_p"?o.add(D(r,.02),">-0.2"):u==="pill-circle"&&o.fromTo(r,{scale:0},{scale:1,duration:.5},">-0.3"),o.add(o,"-=0.2")}),o}$("input[type='radio'][name='filter']").change(function(){let e=$(this).closest("section");e.find("[fs-cmsfilter-element='clear']").removeClass("fs-cmsfilter_active"),e.find("input[type='radio'][name='filter']:checked").closest("[fs-cmsfilter-element='clear']").addClass("fs-cmsfilter_active")});function E(e){$(e).toggleClass("open")}$(".filters").find(".button").on("click",function(){let e=$(this).closest(".filters").find(".filters-block");E(e)}),$(document).on("click",function(e){($(e.target).closest(".filters").length===0||$(e.target).closest(".filters-menu").length>=1)&&E($(".filters-block.open"))}),$(".filters .tab").on("click",function(){let e=$(this).text();$(this).closest(".filters").find(".button").find("div").eq(0).text(e)});let I=[[".section_case-quote",".case-quote_slider","case-study",{slidesPerView:1,spaceBetween:40,effect:"creative",creativeEffect:{prev:{translate:[0,0,-400]},next:{translate:["100%",0,0]}},loop:!0,on:{init:e=>{let o=$(".case-quote_image").eq(e.realIndex);o.find("video").length&&O(o),M($(".section_case-quote"),e)},slideChange:e=>{let t=$(".case-quote_image"),o=t.eq(e.realIndex);t.hide(),t.stop().filter(o).fadeIn(),o.find("video").length&&O(o),M($(".section_case-quote"),e)}}},"all"],[".section_callout",".callout_box","callout",{slidesPerView:1,spaceBetween:40,loop:!0,autoplay:{delay:11e3,disableOnInteraction:!1},on:{init:function(e){$(this.slides).each((o,r)=>{console.log(r),r.gsapTimeline=gsap.timeline({paused:!0}),r.gsapTimeline.add(A($(r)))}),$(this.slidesEl).css("opacity","1");let t=$(this.slides).eq(this.activeIndex);M($(".callout_wrap"),this),t[0].gsapTimeline.play()},slideChange:function(){$(this.slides).each((t,o)=>{o.gsapTimeline&&(o.gsapTimeline.progress(0).pause(),o.gsapTimeline.kill())}),$(this.slides).eq(this.activeIndex)[0].gsapTimeline.play(),M($(".callout_wrap"),this)}}},"all"]];function O(e){let t=e.find("video").get(0);t.readyState>=3?(t.currentTime=0,t.play()):t.addEventListener("loadeddata",function(){t.currentTime=0,t.play()})}$(".case-quote_image").on("click mouseenter",function(){$(this).find("video").attr("controls",!0)}),z(I);let h;setTimeout(()=>{z(I),$(".case-quote_content-box").find(".navigation-box").on("mouseenter",function(){let e=$(this).index();swipers["case-study"]["case-study_0"].swiperInstance.slideToLoop(e)}),$(".callout_wrap").find(".navigation-box").on("mouseenter",function(){h=setTimeout(()=>{let e=$(this).index();swipers.callout.callout_0.swiperInstance.slideToLoop(e)},500)}),$(".callout_wrap").find(".navigation-box").on("mouseleave",function(){clearTimeout(h)})},200)});})();
