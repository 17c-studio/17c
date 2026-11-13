/* Browse the three proposal mockups without leaving the proposal. */
(function () {
  'use strict';
  var links = Array.from(document.querySelectorAll('.portal-preview a'));
  var viewer = document.querySelector('.portal-viewer');
  if (!viewer || typeof viewer.showModal !== 'function' || !links.length) return;

  var image = viewer.querySelector('img');
  var title = viewer.querySelector('.portal-viewer-title');
  var stage = viewer.querySelector('.portal-viewer-stage');
  var labels = ['Your dashboard', 'Post from the job site', 'The homeowner’s view'];
  var current = 0;
  var opener;
  var pausedScroll;

  function show(index) {
    current = (index + links.length) % links.length;
    image.src = links[current].href;
    image.alt = links[current].querySelector('img').alt;
    title.textContent = (current + 1) + ' of ' + links.length + ' · ' + labels[current];
    stage.scrollTop = 0;
  }

  links.forEach(function (link, index) {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      show(index);
      pausedScroll = window.studioSmoothScroll;
      if (pausedScroll && !pausedScroll.isStopped) pausedScroll.stop();
      else pausedScroll = null;
      document.documentElement.classList.add('portal-viewer-open');
      viewer.showModal();
    });
  });

  viewer.querySelector('.portal-viewer-close').addEventListener('click', function () { viewer.close(); });
  viewer.querySelector('.portal-viewer-prev').addEventListener('click', function () { show(current - 1); });
  viewer.querySelector('.portal-viewer-next').addEventListener('click', function () { show(current + 1); });
  viewer.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  viewer.addEventListener('close', function () {
    document.documentElement.classList.remove('portal-viewer-open');
    if (pausedScroll) pausedScroll.start();
    pausedScroll = null;
    if (opener) opener.focus({ preventScroll: true });
  });
})();
