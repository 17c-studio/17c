(() => {
  const slides = [...document.querySelectorAll('.hero-slide')];
  if (slides.length < 2) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let timer;
  const schedule = () => {
    clearInterval(timer);
    if (!motion.matches && !document.hidden) {
      timer = setInterval(() => {
        current = (current + 1) % slides.length;
        slides.forEach((slide, index) => slide.classList.toggle('is-active', index === current));
      }, 6000);
    }
  };
  motion.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('pagehide', () => clearInterval(timer));
  window.addEventListener('pageshow', schedule);
  schedule();
})();

/* Follow the proposal section crossing the upper third of the viewport. */
(function(){
  var links=Array.from(document.querySelectorAll('.service-index a'));
  var chapters=links.map(function(link){return document.getElementById(link.hash.slice(1));});
  if(!links.length) return;
  var scheduled=false;
  function update(){
    var active=null;
    var readingLine=window.innerHeight*.33;
    chapters.forEach(function(chapter){
      if(chapter && chapter.getBoundingClientRect().top<=readingLine) active=chapter;
    });
    links.forEach(function(link){
      if(active && link.hash==='#'+active.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    scheduled=false;
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  document.querySelectorAll('details.question').forEach(function(question){question.addEventListener('toggle',schedule);});
  window.addEventListener('load',schedule);
  update();
})();


/* Same Lenis wheel easing and anchor behavior as the studio homepage. */
document.addEventListener('DOMContentLoaded',function(){
  var motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  var smoothScroll;
  function destroy(){
    if(!smoothScroll) return;
    smoothScroll.destroy();
    if(window.studioSmoothScroll===smoothScroll) delete window.studioSmoothScroll;
    smoothScroll=undefined;
  }
  function initialize(){
    destroy();
    if(motion.matches || !window.Lenis) return;
    smoothScroll=new window.Lenis({
      lerp:0.1,
      smoothWheel:true,
      syncTouch:false,
      anchors:{offset:-25},
      allowNestedScroll:true,
      autoRaf:true
    });
    window.studioSmoothScroll=smoothScroll;
  }
  if(motion.addEventListener) motion.addEventListener('change',initialize);
  window.addEventListener('pagehide',destroy);
  window.addEventListener('pageshow',function(event){if(event.persisted) initialize();});
  initialize();
});


// Include the answers in printed copies and restore the reading view afterward.
(() => {
  let previous;
  window.addEventListener('beforeprint', () => {
    if (previous) return;
    previous = [...document.querySelectorAll('details.question')].map(element => ({element, open: element.open}));
    previous.forEach(({element}) => { element.open = true; });
  });
  window.addEventListener('afterprint', () => {
    previous?.forEach(({element, open}) => { element.open = open; });
    previous = undefined;
  });
})();

// Draft-only printing. There is deliberately no acceptance or submission handler.
const draftPrint = document.querySelector('[data-print-draft]');
if (draftPrint) {
  draftPrint.hidden = false;
  draftPrint.addEventListener('click', () => window.print());
}

/* Highlight reading progress only, not a claim about completed project work. */
(function(){
  var timeline=document.querySelector('.project-timeline');
  if(!timeline) return;
  var phases=Array.from(timeline.querySelectorAll('.timeline-phase'));
  var motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  var queued=false;
  function update(){
    queued=false;
    var rect=timeline.getBoundingClientRect();
    var centers=phases.map(function(phase){
      var dot=phase.querySelector('.timeline-dot').getBoundingClientRect();
      return dot.top+dot.height/2;
    });
    var first=centers[0];
    var height=Math.max(0,centers[centers.length-1]-first);
    var readingLine=window.innerHeight*.45;
    var fill=motion.matches ? 0 : Math.min(height,Math.max(0,readingLine-first));
    timeline.style.setProperty('--timeline-start',(first-rect.top)+'px');
    timeline.style.setProperty('--timeline-height',height+'px');
    timeline.style.setProperty('--timeline-fill',fill+'px');
    var active=-1;
    centers.forEach(function(center,index){if(center<=readingLine) active=index;});
    phases.forEach(function(phase,index){
      phase.classList.toggle('is-reached',!motion.matches && index<=active);
      phase.classList.toggle('is-current',!motion.matches && index===active);
    });
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  window.addEventListener('load',schedule);
  document.querySelectorAll('details.question').forEach(function(question){question.addEventListener('toggle',schedule);});
  if(motion.addEventListener) motion.addEventListener('change',schedule);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  update();
})();

