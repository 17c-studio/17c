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

/* Keep the custom tracker inquiry separate from fixed-price acceptance. */
(function(){
  var option=document.getElementById('accept-option');
  if(!option) return;
  var care=document.getElementById('accept-care');
  var base=document.getElementById('base-care-choice');
  var consent=document.getElementById('consent-wording');
  var standardConsent=consent.textContent;
  function update(){
    var custom=option.value.indexOf('Option 3')===0;
    var wasBase=care.value.indexOf('Base Care')===0;
    base.textContent=custom?'Base Care · from $300/month · from $900 minimum (quote to confirm)':'Base Care · $225/month · $675 minimum';
    base.value=custom?'Base Care preference · from $300/month · minimum from $900 · final rate and scope to confirm':'Base Care · $225/month · 3-month minimum $675';
    if(wasBase) base.selected=true;
    consent.textContent=custom?'I am authorized to request an Option 3 scope discussion for Van Noord. I understand that the project starts from $11,000, with an expected range of $11,000–$14,000. My care selection is a preference only. Final scope, fee, timeline, and care responsibilities require a separate written quote and acceptance. This submission does not commit Van Noord to a project fee or care plan.':standardConsent;
    document.getElementById('accept-submit').textContent=custom?'Request Option 3 scope discussion':'Sign & accept proposal';
    document.getElementById('accept-consent').checked=false;
  }
  option.addEventListener('change',update);
  update();
})();

/* Record the selected agreement with the acceptance sent through the form. */
(function(){
  var form=document.getElementById('reply');
  if(!form) return;
  form.addEventListener('submit',function(){
    document.getElementById('accepted-at').value=new Date().toISOString();
    document.getElementById('accepted-terms').value=['investment','payment','care','terms','questions'].map(function(id){
      return document.getElementById(id).innerText;
    }).join('\n\n');
  });
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
