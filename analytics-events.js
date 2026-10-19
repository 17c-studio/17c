// Local integration hooks only. No requests, identifiers, cookies or event storage.
// A future consent-aware analytics adapter can subscribe to studio:analytics.
(() => {
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    let name;
    if (url.protocol === 'mailto:') name = 'email_click';
    else if (url.hostname === 'calendly.com') name = 'consultation_click';
    else if (url.origin === location.origin && url.pathname.endsWith('/form.html')) name = 'inquiry_click';
    if (!name) return;
    window.dispatchEvent(new CustomEvent('studio:analytics', {
      detail: { name, page_path: location.pathname }
    }));
  });
})();
