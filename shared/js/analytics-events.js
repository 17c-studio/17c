// Personalized visits use the existing GA4 tag; click hooks remain local.
(() => {
  if (window.studioAnalyticsEventsInitialized) return;
  window.studioAnalyticsEventsInitialized = true;

  // The readiness promise returns a slug only after personalization succeeds.
  // Do not forward prospect records, form values or raw query parameters.
  Promise.resolve(window.studioProspectReady).then(slug => {
    if (typeof slug !== 'string' || !slug || typeof window.gtag !== 'function') return;
    window.gtag('event', 'personalized_visit', { prospect_slug: slug });
  }).catch(() => { /* Failed personalization must not count as a visit. */ });

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
