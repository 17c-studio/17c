# 17C Studio pre-launch audit

Reviewed October 15, 2026. Local implementation only; nothing was deployed and no real inquiry or booking was sent.

## 1. Changes implemented

The original typography, palette, photographic covers, project composition, personal storytelling, service disclosures, personalization, and animation language were retained. The pre-existing mobile title-width adjustment remains in place.

### Initial findings, before implementation

| Finding | Classification | Priority | Result |
| --- | --- | --- | --- |
| Homepage loads wishlist.js but lacks the inclusion/review controls it expects; console shows a null addEventListener error | Confirmed functional bug | Launch-critical | Restored the missing controls and added a static regression check |
| Dedicated Connect page uses native POST but has no AJAX submission feedback, footer, or wishlist review | Missing functionality | High | Shared inquiry handler and consistent footer/wishlist UI |
| No privacy, terms, accessibility, skip link, or domain-based SEO setup | Missing launch essentials | High | Local policy drafts, accessibility statement, skip links, and SEO configuration tool |
| Large originals are used for portrait, project screenshots, and service-page background | Confirmed loading cost | High | Optimized responsive variants, originals preserved |
| Personalized links stop carrying context on the dedicated form; homepage email links are rewritten to the scheduler | Confirmed conversion issue | Medium | Context now reaches the form; the public footer email stays a mailto link |
| Long-lived automatic decorative motion has no explicit pause control | Accessibility improvement | Medium | Homepage pause control, existing reduced-motion support retained |
| Business editor is ambiguous and can be awkward with limited vertical space | Usability improvement | Medium | Playful clarified label, close control, visualViewport-aware sizing |
| Footer differs across pages and is absent on Connect | Missing business information | High | Shared static footer content across six pages |
| Production URL, recipient delivery, legal operator, project roles, permissions, and testimonial approval are unconfirmed | Owner/external review | Release gates | Checklist below; no invented facts |

Baseline responsive checks of the original three pages at 320, 375, 390, 430, 768, 1024, and 1440px did not show horizontal page overflow. The existing header already fit those widths; an unnecessary mobile menu was not added.

### Files and responsibilities

| Files | Work |
| --- | --- |
| index.html, services.html, form.html | Static footer, skip link, stable form names, honeypot, privacy notice, wishlist integration, optimized media, metadata and font links |
| inquiry.js (new), wishlist.js | One shared submission/validation handler; existing wishlist state and dialog reused on all inquiry pages |
| launch.css, launch.js (new) | Scoped layout/focus/footer refinements, motion pause control, year updates, back-to-top focus, contact personalization |
| business-customization.js | Mobile editor position/max-height follows visualViewport; explicit close support |
| prospects.js, prospect-reveal.js | Context reaches Connect, organization prefill, direct email preserved, Tab/Escape dismiss entrance |
| script.js | Decorative motion obeys pause; unused legacy inquiry-modal implementation removed |
| styles.css, services.css | Fonts move from CSS imports into HTML; service background uses optimized image |
| privacy.html, terms.html (new) | Clearly labeled, noindex legal/business review drafts |
| accessibility.html (new) | Actual practices, limitations, and email alternative; no certification claim |
| assets/optimized/ | Responsive JPEG/PNG variants, 1200×630 social image, measured byte manifest |
| robots.txt, tools/configure_seo.py | Crawl defaults and domain-dependent SEO generator, with no invented production URL |
| tools/check_site.py, tools/optimize_images.py | Repeatable static validation and dependency-free macOS image regeneration |
| README.md, WISHLIST_SETUP.md | Current architecture, deployment instructions, storage and hosted acceptance checks |

## 2. Mobile and accessibility fixes

- Final Chrome checks covered all six pages at **320, 375, 390, 430, 640, 768, 1024, and 1440px**: 48 page/width combinations, no document-width overflow or completed broken-image loads. The 640 and 320 CSS-pixel views also exercise reflow equivalent to a 1280px layout at 200%/400%; actual browser zoom was not independently verified.
- All inquiry inputs render at 16px on phone widths. Header links, full-width service buttons, editor controls, wishlist controls, and footer links have usable targets. The inline Sonder control retains its inline-text context.
- Skip links target the main landmark; footer back-to-top links restore focus to the header home link. Focus styles use the existing light/dark palette, with a more visible focus color inside the light homepage inquiry section.
- Keyboard Enter opens service disclosures; the wishlist opens as a native modal dialog, Escape closes it, and focus returns to its opener. The floating wishlist intentionally hides when it would cover a control; the form's Review wishlist button remains available.
- The existing compact About story and single Sonder definition remain. Enter/click opens the definition; Escape/outside interaction closes it. At 320px its measured horizontal bounds were within the viewport. Hidden pronunciation/definition content was absent from the accessibility snapshot, and appeared once when opened.
- A 20-character unbroken business name updated all seven homepage personalization targets with no horizontal page overflow. The editor measured inside the 320px viewport. It now tracks the visual viewport and allows internal scrolling, but a physical iOS/Android keyboard was not available for verification.
- Homepage and service-page entrances are brief while retaining their motion. Decorative video and logo rotation respect reduced motion and the explicit pause control. A local reduced-motion fixture confirmed no cover animation, no automatic logo loop, paused video, native scrolling, and no typewriter replacement. This was a test fixture, not an OS preference change.
- Meaningful logos have alt text; decorative background/service imagery and hidden brand rails remain decorative. The home link already had an accessible name before this audit.
- Selected solid-color contrast checks: dark ink on light surface **8.59:1**, muted copy on light surface **5.10:1**, light text on dark surface **16.58:1**, muted copy on dark surface **9.59:1**. These are palette checks, not a complete photographic-background or interactive-state conformance audit.

This is progress toward WCAG 2.2 AA, not a formal conformance determination. VoiceOver/NVDA, Safari/Firefox, real phone keyboards, text-only resizing, forced colors, and actual 200%/400% browser zoom still need manual checks.

## 3. SEO and performance improvements

- Homepage title/description now accurately describe website design in Holland and West Michigan. Existing pages have unique titles, one h1 each, and crawlable HTML content.
- Added Open Graph title, description, site name/type, and Twitter card metadata to public pages. No nonexistent domain, business hours, phone number, rating, review, or street address was invented.
- Added preconnects and one Google Fonts stylesheet per page instead of chained CSS @imports; removed the unused Libre Caslon font request. The existing used typefaces are unchanged.
- Important hero imagery remains eager/high priority and has a matching responsive preload. Project images, portrait, service images, and organization logos load lazily below the fold. Added/updated dimensions and responsive sizes/srcset; service-page backgrounds have mobile/desktop variants.
- The **10 selected originals total 29,237,274 bytes**, compared with **4,070,147 bytes for their larger optimized variants**, an **86.1% reduction**. This comparison is asset size, not measured page transfer or a Core Web Vitals score. Smaller variants provide further savings when selected by the browser. Original files remain for future editing. The JSON manifest contains per-file measurements.
- Favicon now reuses a small version of the actual monogram instead of the 204KB SVG with embedded raster data.
- Removed the unused legacy inquiry-modal JavaScript from the homepage and its unused email-draft script request. No packages were installed.
- robots.txt allows crawling; draft privacy/terms pages have noindex, follow. A production sitemap and absolute canonical/social URLs are deliberately **not generated until the actual HTTPS production URL is supplied**.
- Run `python3 tools/configure_seo.py --base-url YOUR_CONFIRMED_HTTPS_URL` once known. It handles subdirectory deployments, adds canonical/og:url/og:image, limited supported Organization data, and a sitemap for Home, Services, Connect, and Accessibility. Draft legal pages remain excluded. Its idempotence and XML output were tested in a disposable directory using a reserved example host; no example host was written into production pages.

No Lighthouse, field LCP/INP/CLS, real mobile-network, or deployed-cache measurements were available. Do not treat byte savings as proof of passing Core Web Vitals.

## 4. Items requiring owner review

### Business, legal, and privacy

- [x] Public business email: **mariel@17c.studio**, confirmed for current use during this task.
- [ ] Confirm legal operator/registered business name; Holland, Michigan and studio positioning came from the supplied request. No street address is invented.
- [ ] Review privacy.html and terms.html with appropriate business/legal advice. They are visibly drafts and noindex; they are not finalized policies.
- [ ] Confirm retention/deletion practices, provider recipients/access, Formspree integrations and CAPTCHA configuration, Calendly cookies/booking practices, and hosting logs/analytics.
- [ ] After approval, replace review placeholders, approve effective dates, update draft footer/form labels, and decide whether to remove policy noindex. Do not publish drafts as final policies.
- [ ] Confirm the accessibility statement accurately reflects ongoing support and the chosen reporting channel.
- [ ] Review prospects.json and prospect logos for public-release authorization. Query links are not private accounts, and the JSON is public.

### Portfolio and testimonial checklist

Project examples were retained. No project was relabeled with an invented relationship or role. Add verified attribution (for example Professional Experience, Collaborative Project, Freelance Project, or Independent Project) to the portfolio or supporting project descriptions after confirming it.

| Example | Verify before public launch |
| --- | --- |
| Glass House Creative Community | Role/employer or collaborators, dates/scope, screenshot and brand permission |
| Dare to Hope admissions | Same role, attribution, and publication checks |
| Hope College basketball | Same checks; avoid implying a separate 17C client engagement without confirmation |
| Haworth Hotel | Role/collaborator attribution and screenshot/logo permission |
| Font Playground | Confirm independent/client context and ownership |
| Anchor | Confirm role, organization context, and screenshot permission |
| GHC Events | Confirm role, relationship, and permission |
| Degree program | Confirm institution, scope/contribution, and publication permission |
| “17C brought clarity…” attributed to Just Travis | Confirm exact quotation, speaker identity/display preference, authentic relationship, and publication consent |
| Glass House, Haworth, Hope College logos | Confirm rights/permission and accurate relationship; “Client logos” currently implies a client relationship and requires owner verification |

The existing examples and quote were not removed automatically. The project section now invites questions about contributions/collaborators without asserting that every example was independently produced through 17C. No results or testimonials were fabricated.

### Hosting and external services

- [ ] Supply the final HTTPS URL, including any subdirectory; run the SEO generator and inspect the generated canonical URLs/sitemap/social preview.
- [ ] Confirm the Formspree recipient is verified. Send an authorized test from the hosted domain on all three forms and verify inbox arrival, including wishlist inclusion/exclusion.
- [ ] Confirm endpoint spam controls, limits, domain restrictions, CAPTCHA behavior, and failure recovery against the actual account.
- [ ] Verify Calendly loads and bookings work on the final domain. Local inspection confirmed the titled scheduler iframe and email fallback; no booking was made.
- [ ] Verify HTTP→HTTPS and preferred-host redirects, certificate, content types, cache settings, 404 handling, and security headers in the actual host. Consider X-Content-Type-Options and Referrer-Policy; test any CSP/report-only policy against fonts, jsDelivr, Formspree, and Calendly before enforcing it. No untested CSP/HSTS/iframe restriction was installed.
- [ ] Check the external portfolio, Instagram, and hotlinked logos from the deployed site. Logos loaded locally; external-link availability and rights are separate checks. The portfolio loaded successfully in Chrome as “Mariel — Portfolio”; project attribution and permissions still need owner review.

## 5. Functional QA and remaining limits

Completed:

- Dependency-free static audit: **six HTML pages, 210 local references**, no missing files/fragments, duplicate IDs, missing alt attributes, unresolved ARIA references, missing expected wishlist controls, or hardcoded localhost URLs in HTML.
- All root JavaScript files parsed successfully using macOS JavaScriptCore. No new console errors in the final six-page responsive run. Earlier wishlist errors were confirmed and fixed, not ignored.
- Local-only response fixtures exercised required-field focus/errors, accepted responses, field-level rejection with retained inputs, wishlist-bearing submission, and submission with wishlist excluded. Fields are disabled during a request and re-enabled afterward. Honeypot presence and wishlist inclusion were checked by logging field names/booleans only, not inquiry content.
- Cross-page wishlist selection persisted from Services to Connect; excluding it retained the unsubmitted selection. Modal Escape and Remove behavior worked; test selections were restored to empty.
- Personalized context and organization prefill reached Connect without duplicating the scheduler there. The public email remained a direct mailto link. Long-name layout, editor bounds, single Sonder definition, mobile accordions, and no-CDN fallback were checked.
- A no-CDN fixture retained readable mobile headings and functional local card buttons. Reduced-motion and pause behavior were checked separately.
- Common exposed-key/private-key patterns were not found in current root HTML/JS/JSON; this is not a full secret/history audit. No contact information is written to localStorage or console by the form handler.
- Dependencies remain pinned. The reviewed GSAP advisory affects versions before 3.6.0, while this site loads 3.13.0. The Lenis repository security page was inspected. This is a limited advisory review, not an exhaustive vulnerability certification.

Still unverified: actual form inbox delivery, actual timeout/rate-limit/CAPTCHA behavior against Formspree, booked appointments, deployment/redirects/TLS/security headers, external portfolio content and permissions, all photographic contrast combinations, real assistive technology, non-Chrome browsers, actual zoom, physical phone keyboards, and field Core Web Vitals. These require the real services/devices or owner decisions above.

Screenshots and the 48-entry responsive-results.json are saved under the locally ignored audit/ directory. Local QA endpoints and fixtures were kept outside deployment files. No test request was sent to Formspree.

## 6. Final launch readiness

**Ready after manual review.** The confirmed local functional bugs are fixed and the tested layouts pass. Public launch still depends on approving the legal/business/portfolio items, specifying the production URL, and verifying hosted delivery and deployment settings. This classification does not mean the policy drafts or unverified attribution are ready to publish as final.

### Sources used for implementation and review

- [Formspree honeypot filtering](https://help.formspree.io/articles/building-your-form/honeypot-spam-filtering) supports the `_gotcha` field; server/account configuration still matters.
- [WCAG 2.2 Understanding documents](https://www.w3.org/WAI/WCAG22/Understanding/) informed the accessibility target and manual follow-up scope.
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) informed absolute production URL generation.
- [Calendly cookie management](https://calendly.com/help/calendly-cookie-management-and-banner) identifies provider settings to review, rather than assuming no third-party cookies.
- [GSAP advisory GHSA-6g8v-hpgw-h2v7](https://github.com/advisories/GHSA-6g8v-hpgw-h2v7) and [Lenis security page](https://github.com/darkroomengineering/lenis/security) were checked without claiming a full dependency certification.

## Portrait correction

The sips-generated portrait JPEG variants decoded but rendered solid black. The original mariel-mat.jpeg is restored, its dimensions and alt text corrected, and it is excluded from image regeneration. The media container and its sticky/rounded styling are unchanged. Earlier checks for image decoding did not detect the visual corruption.
