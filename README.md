# 17C Studio

A static website for an independent web design studio in Holland, Michigan. Plain HTML, CSS, and JavaScript; no package installation or build step.

## Pages

- `index.html`: studio introduction, mobile service cards, About and Sonder story, project examples, testimonial, logos, inquiry.
- `services.html`: six native service disclosures, wishlist selection and review, inquiry.
- `form.html`: dedicated inquiry with expandable next steps.
- `privacy.html`, `terms.html`: clearly marked, noindex drafts requiring business and legal review.
- `accessibility.html`: practices, limitations, and a contact route. No formal conformance claim.

## Preview and checks

Run `python3 -m http.server 8000`, then open `http://localhost:8000/`.
Run `python3 tools/check_site.py` for local references, fragment targets, duplicate IDs, image alt attributes, ARIA targets, and hardcoded development links in HTML.

Read `PRELAUNCH_AUDIT.md` for findings, changes, validation, and remaining release gates. Older audit files are historical and describe earlier implementations.

## Contact delivery

All three inquiry forms POST to `https://formspree.io/f/xoejkyvk`. `inquiry.js` shares validation, loading, success, and error handling. `wishlist.js` manages selections on all three inquiry pages and provides optional submission content to the shared handler. HTML POST and native required-field validation work without JavaScript; wishlist inclusion requires JavaScript.

The public business email is `marielwhitney.design@gmail.com`, confirmed for current use on October 15, 2026. Recipient verification, spam/CAPTCHA configuration, domain restrictions, and actual inbox delivery are controlled by Formspree and still need a hosted acceptance test. See `WISHLIST_SETUP.md`.

Contact form details are not saved in localStorage. The optional personalization name and selected service IDs are stored locally. Failed form requests retain inputs only in the current page; a refresh may clear them.

## Third-party resources

Google Fonts supplies DM Sans, Cormorant Garamond, and Bebas Neue. Pinned jsDelivr scripts provide GSAP 3.13.0, ScrollTrigger 3.13.0, and Lenis 1.3.26. Personalized links can load a Calendly embed. Three organization logos are hotlinked. The draft Privacy Policy documents these actual requests and identifies settings requiring review. No analytics or advertising tracker was found in the source.

## Images and motion

Original images remain in place. The About portrait uses its original file after a conversion defect; other production imagery uses smaller variants in `assets/optimized` with responsive `srcset`, below-fold lazy loading, and dimensions. `python3 tools/optimize_images.py` regenerates variants on macOS using built-in `sips`; it is not needed by the deployed site. The homepage has a pause control for decorative motion, and reduced-motion preferences disable the automatic logo loop and video.

## Personalized prospect links

Use `index.html?for=the-sky-floor` or `services.html?for=the-sky-floor`. Add entries to the array in `prospects.json`; use relative local logo paths. Optional meeting copy is used only when supplied. Context carries to the contact page, where the organization field is prefilled.

The JSON and logos are public assets. Include only information authorized for public access, never confidential proposals, private contact details, or secrets. A sessionStorage flag remembers the welcome animation. Tab or Escape can dismiss the entrance. Email links open drafts for visitors to send themselves.

## Before deployment

1. Complete the review gates in `PRELAUNCH_AUDIT.md`, especially legal drafts, portfolio attribution/permissions, testimonial approval, provider settings, and hosted delivery.
2. Set the confirmed HTTPS production URL, including any subdirectory, using `python3 tools/configure_seo.py --base-url YOUR_CONFIRMED_HTTPS_URL`. This generates canonical and social URLs, limited organization data, `sitemap.xml`, and a sitemap reference in `robots.txt`. No domain is invented in the repository. Draft legal pages remain excluded from the sitemap and noindex.
3. After policy approval, replace draft language, add the approved effective date, update all footer/form labels, and remove policy noindex only if appropriate. Do not deploy the drafts as finalized policies.
4. Upload the six root HTML files, referenced local CSS/JS, `assets`, `logos`, `prospects.json`, `robots.txt`, generated sitemap, and the referenced decorative video. Do not upload `.git`, `.codex`, `.aws`, local audit fixtures, or private working documents.
5. In the host dashboard, verify HTTPS, redirects, canonical hostname, caching/MIME types, and supported security headers. Test the final deployed URLs and social previews. No deployment was performed during this audit.
