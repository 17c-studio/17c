// Resolve prospect copy before measuring headings and initializing animations.
(async () => {
  await window.studioProspectReady;
await window.studioBusinessReady;
// Keep the original wording available when a public visitor clears their name.
const personalizedCopy = [
  ['.cover-title-line--first', name => `Custom-crafted for ${name}.`],
  ['#introduction .intro', (name, original) => original.replace('independent businesses', () => name)],
  ['#services-title', (name, original) => original.replace('your business', () => name)],
  ['.about-transition', name => `Enough about me, let’s imagine what I could make for ${name}.`],
  ['#possibilities-title .possibility-title-line--right', name => `that feels like ${name}.`]
].map(([selector, personalize]) => ({ element: document.querySelector(selector), personalize }))
  .filter(({ element }) => element)
  .map(target => ({ ...target, original: target.element.textContent }));
const applyBusinessCopy = () => {
  const name = window.studioProspect?.businessName || window.studioCustomBusiness;
  personalizedCopy.forEach(({ element, personalize, original }) => {
    const copy = name ? personalize(name, original) : original;
    if (element.matches('.about-transition') && element.querySelector('.about-transition-typed')) {
      window.dispatchEvent(new CustomEvent('studio:transition-copy', { detail: copy.trim() }));
    } else {
      element.textContent = copy;
    }
    if (name) element.dataset.personalized = 'true';
    else delete element.dataset.personalized;
  });
  window.ScrollTrigger?.refresh(true);
};
applyBusinessCopy();
window.addEventListener('studio:business-change', applyBusinessCopy);

// Set this to the studio's real email address to enable email inquiries.
const CONTACT_EMAIL = 'marielwhitney.design@gmail.com';

const dialog = document.querySelector('#inquiry-dialog');
const form = document.querySelector('#inquiry-form');
const status = document.querySelector('#form-status');

// Drive smooth scrolling and the pinned services from the same animation clock.
const scrollMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let destroySmoothScroll = () => {};

const initSmoothScroll = () => {
  destroySmoothScroll();
  destroySmoothScroll = () => {};
  if (!window.Lenis || scrollMotionPreference.matches) return;

  const useGsapTicker = Boolean(window.gsap && window.ScrollTrigger);
  const smoothScroll = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
    syncTouch: false,
    anchors: { offset: -25 },
    allowNestedScroll: true,
    autoRaf: !useGsapTicker,
    prevent: element => element.closest('dialog[open]') !== null
  });
  const tick = time => smoothScroll.raf(time * 1000);
  window.studioSmoothScroll = smoothScroll;

  if (useGsapTicker) {
    smoothScroll.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }

  destroySmoothScroll = () => {
    if (useGsapTicker) gsap.ticker.remove(tick);
    smoothScroll.destroy();
    if (window.studioSmoothScroll === smoothScroll) delete window.studioSmoothScroll;
  };
};

initSmoothScroll();
scrollMotionPreference.addEventListener('change', initSmoothScroll);
window.addEventListener('pagehide', () => destroySmoothScroll());
window.addEventListener('pageshow', event => {
  if (event.persisted) initSmoothScroll();
});

const servicesSection = document.querySelector('#services');
const serviceTrack = servicesSection?.querySelector('.service-track');
// Mobile cards expose their copy through real buttons rather than hover states.
const mobileServiceCards = window.matchMedia('(max-width: 767px)');
let restoreServiceCards = () => {};
const syncServiceCards = () => {
  restoreServiceCards();
  restoreServiceCards = () => {};
  if (!mobileServiceCards.matches) return;
  const cleanups = [];
  document.querySelectorAll('.service-grid article').forEach((card, index) => {
    const heading = card.querySelector('h3');
    if (!heading) return;
    const originalHeading = [...heading.childNodes];
    const originalTabIndex = card.getAttribute('tabindex');
    const originalCopy = card.querySelector('p');
    const copy = originalCopy || document.createElement('p');
    if (!originalCopy) copy.textContent = 'Explore the full range of ways I can help your business grow.';
    const panel = document.createElement('div');
    panel.className = 'service-card-copy';
    panel.id = `service-card-copy-${index + 1}`;
    panel.hidden = true;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'service-card-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', panel.id);
    const label = document.createElement('span');
    label.textContent = heading.textContent.trim();
    const indicator = document.createElement('span');
    indicator.className = 'service-card-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    indicator.textContent = '+';
    button.append(label, indicator);
    heading.replaceChildren(button);
    card.removeAttribute('tabindex');
    heading.after(panel);
    panel.append(copy);
    const link = card.querySelector('.service-card-link');
    const originalLinkContent = link ? [...link.childNodes] : [];
    if (link) {
      link.textContent = 'View all services →';
      panel.append(link);
    }
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(expanded));
      indicator.textContent = expanded ? '−' : '+';
      panel.hidden = !expanded;
    });
    cleanups.push(() => {
      heading.replaceChildren(...originalHeading);
      if (originalTabIndex !== null) card.setAttribute('tabindex', originalTabIndex);
      if (originalCopy) heading.after(originalCopy);
      if (link) {
        link.replaceChildren(...originalLinkContent);
        heading.before(link);
      }
      panel.remove();
    });
  });
  restoreServiceCards = () => cleanups.forEach(cleanup => cleanup());
};
syncServiceCards();
mobileServiceCards.addEventListener('change', syncServiceCards);
const SERVICE_SCROLLER_KEY = '__17cServiceScrollerCleanup';

// Apply the final responsive layout before the browser restores a saved scroll
// position. Function-based measurements are refreshed after fonts/layout settle.


const initServiceScroller = () => {
  if (!servicesSection || !serviceTrack || !window.gsap || !window.ScrollTrigger) return () => {};

  gsap.registerPlugin(ScrollTrigger);
  window[SERVICE_SCROLLER_KEY]?.();
  ScrollTrigger.getById('services-horizontal')?.kill(true);
  const media = gsap.matchMedia();
  let refreshTimer;
  let destroyed = false;

  const refresh = () => {
    if (destroyed) return;
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      requestAnimationFrame(() => {
        if (destroyed) return;
        // Preserve the scroll position and let an active gesture finish
        // before recalculating the pinned section.
        ScrollTrigger.refresh(true);
      });
    }, 150);
  };

  media.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    document.documentElement.classList.add('services-scroll-ready');
    const shell = document.createElement('div');
    shell.className = 'service-scroll-shell';
    servicesSection.before(shell);
    shell.append(servicesSection);
    const horizontalDistance = () => Math.max(
      0,
      serviceTrack.scrollWidth - window.innerWidth
    );
    // Reserve the horizontal travel in normal flow. Native sticky positioning
    // releases the section at the shell boundary without switching pin modes.
    const measure = () => {
      shell.style.height = `${servicesSection.offsetHeight + horizontalDistance()}px`;
    };
    measure();
    const tween = gsap.to(serviceTrack, {
      x: () => -horizontalDistance(),
      ease: 'none',
      scrollTrigger: {
        id: 'services-horizontal',
        trigger: shell,
        start: 'top top',
        end: () => `+=${horizontalDistance()}`,
        scrub: true,
        invalidateOnRefresh: true,
        onRefreshInit: measure,
        // A large reverse wheel/trackpad gesture can skip the full trigger range.
        onLeaveBack: self => self.animation.progress(0),
      }
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(serviceTrack, { clearProps: 'transform' });
      shell.before(servicesSection);
      shell.remove();
      document.documentElement.classList.remove('services-scroll-ready');
    };
  });

  window.addEventListener('load', refresh);
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('orientationchange', refresh);
  document.fonts?.ready.then(refresh);
  refresh();

  const cleanup = () => {
    if (destroyed) return;
    destroyed = true;
    window.clearTimeout(refreshTimer);
    window.removeEventListener('load', refresh);
    window.removeEventListener('resize', refresh);
    window.removeEventListener('orientationchange', refresh);
    media.revert();
    ScrollTrigger.getById('services-horizontal')?.kill(true);
    gsap.set(serviceTrack, { clearProps: 'transform' });
    document.documentElement.classList.remove('services-scroll-ready');
  };

  window[SERVICE_SCROLLER_KEY] = cleanup;
  return cleanup;
};

let destroyServiceScroller = initServiceScroller();
window.addEventListener('pagehide', () => destroyServiceScroller());
window.addEventListener('pageshow', event => {
  if (event.persisted) destroyServiceScroller = initServiceScroller();
});

const initPossibilityHeadingAnimation = () => {
  const heading = document.querySelector('.possibilities-heading h2');
  const leftLine = heading?.querySelector('.possibility-title-line--left');
  const rightLine = heading?.querySelector('.possibility-title-line--right');
  if (!heading || !leftLine || !rightLine || !window.gsap || !window.ScrollTrigger) return () => {};

  ScrollTrigger.getById('possibilities-heading-lines')?.kill(true);
  const media = gsap.matchMedia();

  media.add({
    desktop: '(min-width: 768px)',
    reducedMotion: '(prefers-reduced-motion: reduce)'
  }, context => {
    const { desktop, reducedMotion } = context.conditions;

    if (reducedMotion) {
      gsap.set([leftLine, rightLine], { xPercent: 0 });
      return () => gsap.set([leftLine, rightLine], { clearProps: 'transform' });
    }

    const travel = desktop ? 32 : 14;
    const timeline = gsap.timeline({
      scrollTrigger: {
        id: 'possibilities-heading-lines',
        trigger: heading,
        start: 'top bottom',
        end: 'center center',
        scrub: true,
        invalidateOnRefresh: true
      }
    });

    timeline
      .fromTo(leftLine, { xPercent: -travel }, { xPercent: 0, ease: 'none' }, 0)
      .fromTo(rightLine, { xPercent: travel }, { xPercent: 0, ease: 'none' }, 0);

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      gsap.set([leftLine, rightLine], { clearProps: 'transform' });
    };
  });

  return () => {
    media.revert();
    ScrollTrigger.getById('possibilities-heading-lines')?.kill(true);
    gsap.set([leftLine, rightLine], { clearProps: 'transform' });
  };
};

let destroyPossibilityHeadingAnimation = initPossibilityHeadingAnimation();
window.addEventListener('pagehide', () => destroyPossibilityHeadingAnimation());
window.addEventListener('pageshow', event => {
  if (event.persisted) destroyPossibilityHeadingAnimation = initPossibilityHeadingAnimation();
});

const aboutTransition = document.querySelector('.about-transition');

if (aboutTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let transitionText = aboutTransition.textContent.trim();
  let transitionVersion = 0;
  const typedText = document.createElement('span');
  const reservedText = document.createElement('span');
  reservedText.className = 'about-transition-reserved';
  reservedText.textContent = transitionText;
  reservedText.setAttribute('aria-hidden', 'true');
  typedText.className = 'about-transition-typed';
  typedText.setAttribute('aria-hidden', 'true');
  aboutTransition.setAttribute('aria-label', transitionText);
  aboutTransition.textContent = '';
  // Reserve the full wrapped height throughout typing, including on mobile.
  aboutTransition.append(reservedText, typedText);

  window.addEventListener('studio:transition-copy', event => {
    transitionVersion += 1;
    transitionText = event.detail;
    reservedText.textContent = transitionText;
    typedText.textContent = transitionText;
    aboutTransition.setAttribute('aria-label', transitionText);
    aboutTransition.classList.add('is-typed');
  });

  const typeTransition = () => {
    if (aboutTransition.classList.contains('is-typed')) return;
    const version = transitionVersion;
    const characters = Array.from(transitionText);
    let characterIndex = 0;

    const typeNextCharacter = () => {
      if (version !== transitionVersion) return;
      if (scrollMotionPreference.matches) {
        typedText.textContent = transitionText;
        aboutTransition.classList.add('is-typed');
        return;
      }
      typedText.textContent += characters[characterIndex];
      const character = characters[characterIndex];
      characterIndex += 1;

      if (characterIndex >= characters.length) {
        window.setTimeout(() => aboutTransition.classList.add('is-typed'), 600);
        return;
      }

      const delay = /[,.—]/.test(character) ? 260 : 85;
      window.setTimeout(typeNextCharacter, delay);
    };

    typeNextCharacter();
  };

  if ('IntersectionObserver' in window) {
    const typingObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      typeTransition();
      typingObserver.disconnect();
    }, { threshold: 0.6 });

    typingObserver.observe(aboutTransition);
  } else {
    typeTransition();
  }
}

const projectPreviews = document.querySelectorAll('[data-project-preview]');

const updateProjectPreview = preview => {
  const image = preview.querySelector('.project-screenshot');
  if (!image || !image.complete) return;

  const distance = Math.max(0, image.getBoundingClientRect().height - preview.clientHeight);
  const duration = Math.min(28, Math.max(6, distance / 150));
  preview.style.setProperty('--preview-distance', `${distance}px`);
  preview.style.setProperty('--preview-duration', `${duration}s`);
};

const previewResizeObserver = 'ResizeObserver' in window
  ? new ResizeObserver(entries => {
      requestAnimationFrame(() => entries.forEach(entry => {
        const preview = entry.target.matches?.('[data-project-preview]')
          ? entry.target
          : entry.target.closest?.('[data-project-preview]');
        if (preview) updateProjectPreview(preview);
      }));
    })
  : null;

projectPreviews.forEach(preview => {
  const image = preview.querySelector('.project-screenshot');
  if (!image) return;
  image.addEventListener('load', () => updateProjectPreview(preview), { once: true });
  if (image.complete) updateProjectPreview(preview);
  previewResizeObserver?.observe(preview);
  previewResizeObserver?.observe(image);
});

const possibilitiesSection = document.querySelector('.possibilities');
const possibilityCards = [...document.querySelectorAll('.possibilities .project-preview-card')];

if (possibilitiesSection && possibilityCards.length) {
  const desktopProjects = window.matchMedia('(min-width: 768px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let parallaxFrame;

  const updatePossibilityParallax = () => {
    parallaxFrame = null;

    if (!desktopProjects.matches || reducedMotion.matches) {
      possibilityCards.forEach(card => card.style.removeProperty('--project-parallax-y'));
      return;
    }

    const rect = possibilitiesSection.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0,
      (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
    ));

    possibilityCards.forEach(card => {
      const from = Number(card.dataset.parallaxFrom) || 0;
      const to = Number(card.dataset.parallaxTo) || 0;
      const offset = from + (to - from) * progress;
      card.style.setProperty('--project-parallax-y', `${offset.toFixed(2)}px`);
    });
  };

  const requestPossibilityUpdate = () => {
    if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updatePossibilityParallax);
  };

  window.addEventListener('scroll', requestPossibilityUpdate, { passive: true });
  window.addEventListener('resize', requestPossibilityUpdate, { passive: true });
  desktopProjects.addEventListener?.('change', requestPossibilityUpdate);
  reducedMotion.addEventListener?.('change', requestPossibilityUpdate);
  requestPossibilityUpdate();
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

if (form && status) {
  if (dialog) {
    document.querySelector('#open-inquiry')?.addEventListener('click', () => dialog.showModal());
    document.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  }

  if (CONTACT_EMAIL) {
    const formNote = document.querySelector('#form-note');
    const submitInquiry = document.querySelector('#submit-inquiry');
    if (formNote) formNote.textContent = 'Tell us a little about your business and what you have in mind. We’ll open your email app with your inquiry ready to send.';
    if (submitInquiry) submitInquiry.innerHTML = 'Open email draft <span class="arrow-drift" aria-hidden="true">→</span>';
  }

  const fields = [...form.querySelectorAll('input, textarea')];
  fields.forEach(field => {
    field.addEventListener('input', () => {
      field.removeAttribute('aria-invalid');
      const error = document.querySelector(`#inquiry-${field.name}-error`);
      if (error) error.textContent = '';
      if (status.classList.contains('is-error')) {
        status.textContent = '';
        status.classList.remove('is-error');
      }
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    fields.forEach(field => {
      field.removeAttribute('aria-invalid');
      const error = document.querySelector(`#inquiry-${field.name}-error`);
      if (error) error.textContent = '';
    });
    status.classList.remove('is-error');

    const nameField = form.elements.name;
    const emailField = form.elements.email;
    const projectField = form.elements.project;
    const invalid = [];

    if (!nameField.value.trim()) invalid.push([nameField, 'Enter your name.']);
    if (!emailField.value.trim()) {
      invalid.push([emailField, 'Enter your email address.']);
    } else if (emailField.validity.typeMismatch) {
      invalid.push([emailField, 'Enter a valid email address.']);
    }
    if (!projectField.value.trim()) invalid.push([projectField, 'Tell us what you would like help with.']);

    if (invalid.length) {
      invalid.forEach(([field, message]) => {
        field.setAttribute('aria-invalid', 'true');
        document.querySelector(`#inquiry-${field.name}-error`).textContent = message;
      });
      status.textContent = invalid.map(([, message]) => message).join(' ');
      status.classList.add('is-error');
      invalid[0][0].focus();
      return;
    }

    const data = new FormData(form);
    const brief = `17C — Project inquiry\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nOrganization: ${data.get('organization') || 'Not provided'}\n\nWhat can we help with?\n${data.get('project')}\n`;
    if (CONTACT_EMAIL) {
      const draftUrl = window.prepareEmailDraft(form, { to: CONTACT_EMAIL, subject: 'A new project for 17C — ' + data.get('name'), body: brief });
      window.location.href = draftUrl;
      status.textContent = 'Send the draft in your email app to finish. If no app opens, use the save or copy option below.';
      return;
    }
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = '17C-project-brief.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Your brief is ready to save. Nothing has been sent; keep this file to share with the studio.';
  });
}

// A subpixel transform keeps the mobile logo loop smooth; swipes use native scrolling.
const logoRow = document.querySelector('.business-names');
if (logoRow) {
  const mobileLogos = window.matchMedia('(max-width: 767px)');
  let disposeLogoCarousel = () => {};
  const syncLogoCarousel = () => {
    disposeLogoCarousel();
    disposeLogoCarousel = () => {};
    if (!mobileLogos.matches || scrollMotionPreference.matches || logoRow.scrollWidth <= logoRow.clientWidth) return;
    const originals = [...logoRow.children];
    const track = document.createElement('div');
    track.className = 'logo-carousel-track';
    track.append(...originals);
    const clones = originals.map(original => {
      const clone = original.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.append(clone);
      return clone;
    });
    logoRow.append(track);
    logoRow.classList.add('is-rotating');
    const period = clones[0].offsetLeft - originals[0].offsetLeft;
    if (period <= 0) {
      logoRow.replaceChildren(...originals);
      logoRow.classList.remove('is-rotating');
      return;
    }
    const normalize = value => ((value % period) + period) % period;
    // Linear transforms retain fractional pixels and wrap across identical copies.
    const animation = track.animate([
      { transform: 'translate3d(0, 0, 0)' },
      { transform: `translate3d(${-period}px, 0, 0)` }
    ], { duration: period / 18 * 1000, iterations: Infinity, easing: 'linear' });
    animation.pause();
    animation.currentTime = normalize(logoRow.scrollLeft) / 18 * 1000;
    logoRow.scrollLeft = 0;
    let resumeTimer;
    let hovered = false, touching = false, pointerHeld = false, visible = false, nativeScrolling = false;
    let disposed = false;
    const canRun = () => !disposed && !hovered && !touching && visible && !document.hidden && !logoRow.matches(':focus-visible');
    const sync = () => {
      if (canRun()) {
        if (nativeScrolling) {
          animation.currentTime = normalize(logoRow.scrollLeft) / 18 * 1000;
          logoRow.scrollLeft = 0;
          nativeScrolling = false;
        }
        animation.play();
      } else {
        animation.pause();
      }
    };
    const useNativeScroll = () => {
      animation.pause();
      if (nativeScrolling) return;
      const position = normalize(Number(animation.currentTime) / 1000 * 18 + logoRow.scrollLeft);
      animation.currentTime = 0;
      logoRow.scrollLeft = position;
      nativeScrolling = true;
    };
    const listeners = [];
    const listen = (target, name, callback, options) => {
      target.addEventListener(name, callback, options);
      listeners.push(() => target.removeEventListener(name, callback, options));
    };
    listen(logoRow, 'pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; sync(); } });
    listen(logoRow, 'pointerleave', () => { hovered = false; sync(); });
    listen(logoRow, 'focusin', () => { useNativeScroll(); sync(); });
    listen(logoRow, 'focusout', sync);
    listen(logoRow, 'pointerdown', () => {
      clearTimeout(resumeTimer);
      touching = true;
      pointerHeld = true;
      useNativeScroll();
    }, { passive: true });
    const release = () => {
      if (!touching || pointerHeld) return;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { touching = false; sync(); }, 3000);
    };
    const endPointer = () => { pointerHeld = false; release(); };
    listen(window, 'pointerup', endPointer, { passive: true });
    listen(window, 'pointercancel', endPointer, { passive: true });
    listen(logoRow, 'wheel', () => { touching = true; useNativeScroll(); release(); }, { passive: true });
    // Keep waiting while a swipe's momentum is still moving the native scroller.
    listen(logoRow, 'scroll', () => { if (touching) release(); }, { passive: true });
    listen(document, 'visibilitychange', sync);
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    observer.observe(logoRow);
    disposeLogoCarousel = () => {
      disposed = true;
      const position = normalize(Number(animation.currentTime) / 1000 * 18 + logoRow.scrollLeft);
      animation.cancel();
      clearTimeout(resumeTimer);
      observer.disconnect();
      listeners.forEach(remove => remove());
      logoRow.replaceChildren(...originals);
      logoRow.classList.remove('is-rotating');
      logoRow.scrollLeft = position;
    };
  };
  syncLogoCarousel();
  mobileLogos.addEventListener('change', syncLogoCarousel);
  scrollMotionPreference.addEventListener('change', syncLogoCarousel);
  window.addEventListener('pagehide', () => disposeLogoCarousel());
  window.addEventListener('pageshow', event => { if (event.persisted) syncLogoCarousel(); });
}

// Decorative video follows the motion preference and only runs while visible.
const decorativeVideo = document.querySelector('.service-more-video');
if (decorativeVideo) {
  let videoVisible = false;
  const syncVideo = () => {
    if (scrollMotionPreference.matches || !videoVisible || document.hidden) decorativeVideo.pause();
    else decorativeVideo.play().catch(() => {});
  };
  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(([entry]) => { videoVisible = entry.isIntersecting; syncVideo(); });
    videoObserver.observe(decorativeVideo);
  }
  scrollMotionPreference.addEventListener('change', syncVideo);
  document.addEventListener('visibilitychange', syncVideo);
}

})();
