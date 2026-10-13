# Site audit and fixes — October 5, 2026

The existing layout, colors, typefaces, cover heights, and animation timing were preserved. Interactive verification covered index.html and services.html in desktop Chrome. Static link, image, and ARIA-reference checks covered all five root HTML files. No email was sent.

## Confirmed bugs and fixes

| Issue | Fix |
| --- | --- |
| Triangle cursor preview was an empty span with transparent background; `fill` had no visible geometry. | Replaced it with a small inline SVG that uses `currentColor`, visible on both the selected and unselected theme backgrounds. |
| The customization form offered `square`, while saved preferences migrated it to `ring`. | Made the option value, preview, and label consistently Ring. Existing saved Square preferences continue to migrate to Ring. |
| Homepage form referenced nonexistent description elements and used only a combined error message. | Added individual error elements referenced by each required field; removed stale form description references. Validation focuses the first invalid field and clears its error on edit. Existing wishlist field/error associations remain intact. |
| Visitors without an email app had no usable fallback when the email recipient was configured. | Both forms now prepare an encoded mailto link, UTF-8 text download, and selectable plain-text draft. Draft generation does not clear fields or claim delivery. |
| Homepage animations were destroyed on pagehide but not rebuilt after history restoration. | Reinitialize service and heading animation lifecycles on persisted pageshow; reusable cleanup remains attached. The services page also cleans up and restores Lenis. |
| Decorative video autoplay ignored reduced motion. | Removed unconditional autoplay; playback follows reduced-motion, visibility, and viewport intersection. |
| Wishlist selection visuals depended on an external icon font. | Replaced that dependency with styled native checkbox controls, retaining the circular visual treatment. Added focus-within outlining. |
| `work.html` linked to missing `index.html#studio`. | Updated it to the existing About section, `index.html#about-mariel`. |
| A paragraph was nested inside the cover h1. | Replaced it with a block-styled span while retaining the cover content. |

## Tests actually performed

- JavaScript syntax parsing passed for script.js, services.js, wishlist.js, customizer.js, preferences.js, and email-draft.js.
- Both interactive pages at 320, 360, 375, 390, 414, and 430px viewport widths in both light and dark themes: document width matched the viewport, with no horizontal overflow. Dark-theme heading, paragraph, input, textarea, and navigation bounds were also checked.
- Open customization panel at all six widths in dark mode and at 320px in light mode: panel remained within the viewport; no internal horizontal overflow. Expanded first service chapter at 320px remained within the viewport.
- Keyboard: Enter opened customization; Tab moved from the theme switch to the cursor choices; visible 2px focus outlines were confirmed in both themes. Escape closed customization and restored focus to its trigger. Required form validation focused Name, with a visible outline in both themes. Four desktop service cards received visible keyboard focus. Native Enter opened a service disclosure, Space selected a wishlist item, and Escape closed the wishlist dialog and restored focus to the floating button.
- Persistence: saved Triangle in dark mode and Ring in light mode, refreshed, and checked both the page dataset and selected radio. Theme settings also persisted across refresh and navigation. Original local-preview settings were restored to dark/Circle/no business name.
- Business name: a 20-character ASCII input was limited to `123456789012345`; counter displayed `15 / 15`, and the 15-character value persisted and personalized page text after refresh. Clearing the name restored default copy.
- Both forms: empty required fields produced field-specific descriptions. Correcting the homepage fields cleared their invalid state. Prepared drafts preserved plus signs, ampersands, percent signs, hashes, apostrophes, accented text, typographic quotes, Japanese text, and newlines.
- Wishlist draft included the selected service when checked, excluded it when unchecked, and kept only one current fallback panel after regeneration.
- A fallback text file was downloaded and read back as UTF-8; all tested special characters were retained. A browser download-event wait timed out, but the saved file was independently found and its contents verified.
- Chrome Back navigation restored the homepage's `services-scroll-ready` state.
- Isolated local fixtures omitted GSAP/ScrollTrigger, Lenis, or all CDN scripts/styles (including Google font imports). Static service layout and form validation remained usable. No-CDN mobile layout also passed at 320px. Lenis absence retained the GSAP service layout.
- Reduced-motion fixture applied the production reduced-motion rules and simulated the matching JavaScript media preference: cover/scroll animations were `none`, headings visible, smooth scrolling disabled, decorative video paused, and the typewriter replacement absent. Services headings also had no animation and opacity 1.
- Coarse-pointer fixture disabled the fine-pointer cursor CSS rules: computed cursors no longer contained custom SVG URLs on either page. This was a conditional-CSS simulation, not a physical touch-device test.
- Static audit after fixes: 75 local HTML references across five pages, all ID/ARIA references and anchors valid, no duplicate IDs or missing local assets. Fifteen referenced local raster images decoded successfully with macOS image tools; CSS asset paths were also checked.
- Eight external HTML links/resources returned HTTP 200, including the portfolio, three remote logos, GSAP/ScrollTrigger, and Lenis JS/CSS. The final homepage console error check was empty.

## Limits and remaining observations

- Browser execution was Chrome on macOS, not Firefox, Safari, iOS, or Android. Physical touch behavior and OS reduced-motion settings were simulated through isolated QA fixtures; no OS settings were changed.
- Email-app opening and actual email delivery were not tested. Auto-opening the email app was suppressed in the draft-test fixtures; the same production encoding and fallback helper were exercised.
- The optional Formspree endpoint remains unconfigured. Direct network delivery, spam protection, and inbox acceptance were not tested in this audit.
- Image files remain large, particularly the full-height portfolio screenshots. Their validity was checked; recompression and responsive image variants were not performed in this design-preserving fix.
- A successful external URL check is a point-in-time response, not a guarantee that the third-party asset will remain available.

![Triangle preview in dark mode](audit/triangle-dark.png)
