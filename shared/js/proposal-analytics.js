/* Shared proposal analytics. See proposals/ANALYTICS.md before enabling a page. */
(() => {
  'use strict';
  const script = document.currentScript;
  const measurementId = 'G-YLJXMRYNPY';
  const optOut = `ga-disable-${measurementId}`;
  const campaign = { utm_source: '17c_studio', utm_medium: 'email', utm_campaign: 'proposal' };
  const idPattern = /^p\d{3,}$/;
  const events = new Set(['proposal_open', 'proposal_options_view']);

  // Google runs only in an empty, generic document, never beside client content.
  if (script?.dataset.transport === 'true') {
    if (window.parent === window) return;
    const params = new URLSearchParams(location.search);
    const proposalId = params.get('id');
    if (!idPattern.test(proposalId || '')) return;
    const attributed = params.get('campaign') === 'email';
    const debug = params.get('debug') === 'true';
    const safeURL = new URL(`/proposals/${proposalId}`, 'https://17c.studio');
    if (attributed) Object.entries(campaign).forEach(([key, value]) => safeURL.searchParams.set(key, value));
    const safePage = {
      page_location: safeURL.href,
      page_title: `17C Studio proposal ${proposalId}`,
      page_referrer: '',
      proposal_id: proposalId
    };
    let configured = false;
    const sent = new Set();
    window.dataLayer = [];
    function gtag() { window.dataLayer.push(arguments); }
    function configure() {
      if (configured) return;
      configured = true;
      gtag('consent', 'default', {
        analytics_storage: 'granted', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied'
      });
      gtag('js', new Date());
      // Set sanitized defaults BEFORE config or Google's library can emit anything.
      gtag('set', safePage);
      gtag('config', measurementId, {
        ...safePage, send_page_view: false, ignore_referrer: true,
        allow_google_signals: false, allow_ad_personalization_signals: false,
        ...(attributed ? { campaign_source: '17c_studio', campaign_medium: 'email', campaign_name: 'proposal' } : {}),
        ...(debug ? { debug_mode: true } : {})
      });
      const tag = document.createElement('script');
      tag.async = true;
      tag.referrerPolicy = 'no-referrer';
      tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.append(tag);
    }
    window.addEventListener('message', message => {
      if (message.source !== window.parent || message.origin !== location.origin) return;
      const data = message.data;
      if (data?.type !== 'studio:proposal-analytics') return;
      if (data.action === 'deny') {
        window[optOut] = true;
        if (configured) gtag('consent', 'update', { analytics_storage: 'denied' });
        return;
      }
      if (data.action === 'grant') {
        window[optOut] = false;
        if (configured) gtag('consent', 'update', { analytics_storage: 'granted' });
        return;
      }
      if (data.action !== 'event' || !events.has(data.name) || sent.has(data.name)) return;
      window[optOut] = false;
      configure();
      sent.add(data.name);
      gtag('event', data.name, { ...safePage, send_to: measurementId, ...(debug ? { debug_mode: true } : {}) });
    });
    window.parent.postMessage({ type: 'studio:proposal-analytics-ready' }, location.origin);
    return;
  }

  if (!script || script.dataset.enabled !== 'true' || !idPattern.test(script.dataset.proposalId || '')) return;
  // An accidental second include must not double-count this page load.
  if (window.studioProposalAnalyticsInitialized) return;
  window.studioProposalAnalyticsInitialized = true;
  const proposalId = script.dataset.proposalId;
  const section = document.querySelector(script.dataset.optionsSelector || '#investment');
  const params = new URLSearchParams(location.search);
  // Only a complete, exact generic campaign survives. No raw query values cross the boundary.
  const attributed = Object.entries(campaign).every(([key, value]) => {
    const values = params.getAll(key);
    return values.length === 1 && values[0] === value;
  });
  const frameURL = new URL('../proposal-analytics-frame.html', script.src);
  frameURL.searchParams.set('id', proposalId);
  if (attributed) frameURL.searchParams.set('campaign', 'email');
  // A local-only switch for QA; never forward arbitrary debug parameter values.
  let debug = window.studioProposalAnalyticsDebug === true;
  try { debug ||= sessionStorage.getItem('studio:proposal-analytics-debug') === 'true'; } catch { /* Optional QA switch. */ }
  if (debug) frameURL.searchParams.set('debug', 'true');
  let frame, ready = false, optionsSeen = false;
  const sent = new Set();
  // Current public pages load GA without a CMP. An explicit consent decision or
  // Google's existing opt-out flag always overrides that current site default.
  const allowed = () => window[optOut] !== true &&
    (window.studioAnalyticsConsent === undefined || window.studioAnalyticsConsent === 'granted');
  function send(name) {
    if (!ready || !allowed() || sent.has(name)) return;
    sent.add(name);
    frame.contentWindow.postMessage({ type: 'studio:proposal-analytics', action: 'event', name }, location.origin);
  }
  function start() {
    if (!allowed()) return;
    if (!frame) {
      frame = document.createElement('iframe');
      frame.hidden = true;
      frame.title = 'Proposal analytics';
      frame.setAttribute('aria-hidden', 'true');
      frame.referrerPolicy = 'no-referrer';
      frame.src = frameURL.href;
      document.body.append(frame);
    }
    send('proposal_open');
    if (optionsSeen) send('proposal_options_view');
  }
  window.addEventListener('message', message => {
    if (message.origin !== location.origin || message.source !== frame?.contentWindow ||
        message.data?.type !== 'studio:proposal-analytics-ready') return;
    ready = true;
    start();
  });
  window.addEventListener('studio:analytics-consent', () => {
    if (ready) {
      frame.contentWindow.postMessage({ type: 'studio:proposal-analytics', action: allowed() ? 'grant' : 'deny' }, location.origin);
    }
    start();
  });
  if (section) {
    // An intersecting sliver is enough; large pricing sections need not fit on screen.
    const seen = () => { optionsSeen = true; start(); };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        seen();
      }, { threshold: 0 });
      observer.observe(section);
    } else {
      const check = () => {
        const rect = section.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= innerHeight) return;
        window.removeEventListener('scroll', check);
        window.removeEventListener('resize', check);
        seen();
      };
      window.addEventListener('scroll', check, { passive: true });
      window.addEventListener('resize', check);
      check();
    }
  }
  start();
})();
