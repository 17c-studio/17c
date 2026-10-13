// Prospect links personalize only the current page.
window.studioProspectReady = (async () => {
  const slug = new URLSearchParams(window.location.search).get('for');
  if (!slug) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const text = value => typeof value === 'string' ? value.trim() : '';
  let prospect;
  try {
    const response = await fetch('prospects.json', { signal: controller.signal });
    if (!response.ok) return;
    const entries = await response.json();
    if (!Array.isArray(entries)) return;
    const entry = entries.find(item => item && item.slug === slug && text(item.businessName));
    if (!entry) return;
    prospect = Object.fromEntries(['slug', 'businessName', 'domain', 'firstName', 'personalLine', 'proposedTime', 'logo'].map(key => [key, text(entry[key])]));
  } catch {
    return; // Leave the normal site intact on HTTP, JSON, or network failures.
  } finally {
    clearTimeout(timeout);
    if (!prospect) window.studioProspectReveal?.cancel();
  }

  window.studioProspect = prospect;
  document.body.classList.add('has-prospect');
  const business = document.querySelector('#wishlist-form [name="business"]');
  if (business) {
    business.value = prospect.businessName;
    // Native resets should restore the prospect's name, like other field defaults.
    business.defaultValue = prospect.businessName;
  }
  // Carry the link context only to this site's home and services pages.
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    const url = new URL(href, window.location.href);
    const directory = new URL('.', window.location.href);
    if (url.origin !== directory.origin || !['index.html', 'services.html'].some(page => url.pathname === directory.pathname + page)) return;
    url.searchParams.set('for', prospect.slug);
    link.setAttribute('href', url.pathname.slice(directory.pathname.length) + url.search + url.hash);
  });

  const main = document.querySelector('main');
  if (!main) return;
  const coverLabel = document.querySelector('.cover-title > .editorial-label, .services-hero .hero-heading > .editorial-label');
  if (coverLabel) {
    const brand = document.createElement('span');
    brand.className = 'prospect-brand';
    const wordmark = document.createElement('span');
    wordmark.className = 'prospect-wordmark';
    wordmark.textContent = prospect.businessName;
    brand.append(wordmark);
    if (prospect.logo) {
      // Saved logos must be relative files in this site's directory, not services.
      const directory = new URL('.', window.location.href);
      let logo;
      try { logo = new URL(prospect.logo, directory); } catch { /* Keep the wordmark. */ }
      if (logo && !/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(prospect.logo) && logo.origin === directory.origin && logo.pathname.startsWith(directory.pathname)) {
        const image = document.createElement('img');
        image.className = 'prospect-logo';
        image.alt = prospect.businessName;
        image.hidden = true;
        image.addEventListener('load', () => { image.hidden = false; wordmark.hidden = true; });
        image.addEventListener('error', () => { image.remove(); wordmark.hidden = false; });
        image.src = prospect.logo;
        brand.append(image);
      }
    }
    coverLabel.replaceWith(brand);
    window.studioProspectReveal?.show(brand);
  } else {
    window.studioProspectReveal?.cancel();
  }

  const email = 'marielwhitney.design@gmail.com';
  document.querySelectorAll(`.header .nav-cta, .home-page a[href="mailto:${email}"]`).forEach(link => {
    link.setAttribute('href', '#contact');
  });
  const invitation = document.createElement('section');
  invitation.id = 'contact';
  invitation.tabIndex = -1;
  invitation.className = 'prospect-invitation';
  invitation.setAttribute('aria-labelledby', 'prospect-invitation-title');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'LET’S WORK TOGETHER';
  const heading = document.createElement('h2');
  heading.id = 'prospect-invitation-title';
  heading.textContent = prospect.proposedTime ? `Could I stop by ${prospect.proposedTime}?` : 'What day and time would work for a chat?';
  const actions = document.createElement('div');
  actions.className = 'prospect-actions';
  const addDraft = (label, message) => {
    const link = document.createElement('a');
    link.className = 'button';
    link.textContent = label;
    const body = `Hi Mariel,\n\n${message}\n\n${prospect.firstName || prospect.businessName}\n${prospect.businessName}`;
    link.href = `mailto:${email}?subject=${encodeURIComponent(`17C — A visit with ${prospect.businessName}`)}&body=${encodeURIComponent(body)}`;
    actions.append(link);
  };
  if (prospect.proposedTime) {
    addDraft('That works', `A visit to ${prospect.businessName} ${prospect.proposedTime} works for me.`);
    addDraft('Suggest another time', `Could we arrange another time to visit ${prospect.businessName}?\nMy suggested day and time: `);
  } else {
    const widget = document.createElement('div');
    widget.className = 'calendly-inline-widget';
    widget.dataset.url = 'https://calendly.com/marielwhitney-design/30-minute-meeting?background_color=171614&text_color=f6f5f1&primary_color=f6f5f1';
    widget.style.minWidth = '320px';
    widget.style.height = '700px';
    actions.append(widget);
  }
  invitation.append(eyebrow, heading, actions);
  if (!prospect.proposedTime) {
    const directContact = document.createElement('p');
    directContact.className = 'contact-note';
    const helloLink = document.createElement('a');
    helloLink.href = 'mailto:marielwhitney.design@gmail.com';
    helloLink.textContent = 'OR SAY HELLO DIRECTLY';
    const arrow = document.createElement('span');
    arrow.className = 'arrow-drift';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    helloLink.append(' ', arrow);
    directContact.append(helloLink);
    invitation.append(directContact);
  }
  main.append(invitation);
  if (!prospect.proposedTime) {
    const widgetScript = document.createElement('script');
    widgetScript.src = 'https://assets.calendly.com/assets/external/widget.js';
    widgetScript.async = true;
    document.body.append(widgetScript);
  }
})();
