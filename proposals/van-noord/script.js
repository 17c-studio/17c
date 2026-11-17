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

/* Include every answer in print, then restore the reader's expanded rows. */
(function(){
  var questions=Array.from(document.querySelectorAll('details.question'));
  var previous;
  window.addEventListener('beforeprint',function(){
    if(previous) return;
    previous=questions.map(function(question){return question.open;});
    questions.forEach(function(question){question.open=true;});
  });
  window.addEventListener('afterprint',function(){
    if(!previous) return;
    questions.forEach(function(question,index){question.open=previous[index];});
    previous=undefined;
  });
})();
