# 17C Studio

A static website for an independent web design studio based in Holland, Michigan, serving businesses across the United States. Plain HTML, CSS, and JavaScript; no package installation or build step.

## Pages

- `index.html`: studio introduction, mobile service cards, About and Sonder story, project examples, logos, and contact links.
- `services.html`: six native service disclosures, wishlist selection and review, inquiry.
- `form.html`: dedicated inquiry with saved wishlist review.
- `proposal.html`: fictional sample proposal, intentionally noindex and excluded from the sitemap.

## Preview and checks

Run `python3 -m http.server 8000`, then open `http://localhost:8000/`.
Run `python3 tools/check_site.py` for local references, fragment targets, duplicate IDs, image alt attributes, ARIA targets, and hardcoded development links in HTML.

Run `python3 tools/check_seo.py` for metadata, JSON-LD reference and sitemap checks. Read `LOCAL_SEO_UPDATE.md` for the October 27, 2026 local business identity changes and verification limits. `SEO_AUDIT.md` records the earlier SEO audit, metadata table, setup steps and verification results. Earlier audit files describe historical implementations.

The homepage inlines its first-viewport styles from `assets/home-critical.css` and loads the full stylesheets asynchronously, with ordinary stylesheet links inside `noscript` as a fallback. When changing shared theme, header, cover, or personalization styles, update the critical subset too, then run `python3 tools/inline_home_critical.py`. Run it with `--check` to verify that the inline copy is current. Check desktop and mobile with the full stylesheet unavailable before publishing changes to the critical subset.

## Contact delivery

`email-links.js` builds email links from an encoded address after parsing. Mark links with `data-email`, use `data-email-subject` for an optional subject, and keep `href="form.html"` as the no-JavaScript fallback. This reduces basic static scraping; it is not encryption and cannot stop bots that execute JavaScript.

The services and contact inquiry forms POST to `https://formspree.io/f/xoejkyvk`. `inquiry.js` shares validation, loading, success, and error handling. `wishlist.js` manages selections on the services and contact pages and provides optional submission content to the shared handler. HTML POST and native required-field validation work without JavaScript; wishlist inclusion requires JavaScript.

The public business email is `mariel@17c.studio`, confirmed for current use on October 15, 2026. Recipient verification, spam/CAPTCHA configuration, domain restrictions, and actual inbox delivery are controlled by Formspree and still need a hosted acceptance test. See `WISHLIST_SETUP.md`.

Contact form details are not saved in localStorage. The optional personalization name and selected service IDs are stored locally. Failed form requests retain inputs only in the current page; a refresh may clear them.

## Third-party resources

Google Fonts supplies DM Sans, Cormorant Garamond, and Bebas Neue. Pinned jsDelivr scripts provide GSAP 3.13.0, ScrollTrigger 3.13.0, and Lenis 1.3.26. Personalized links can load a Calendly embed. Three organization logos are hotlinked. No analytics or advertising tracker is installed. `analytics-events.js` and `inquiry.js` emit local integration events without sending or storing analytics. See `SEO_AUDIT.md` before connecting a consent-aware analytics adapter.

## Images and motion

Original images remain in place. The About portrait and project imagery use smaller variants in `assets/optimized` with responsive `srcset`, below-fold lazy loading, and dimensions. `python3 tools/optimize_images.py` regenerates variants on macOS using built-in `sips`; it is not needed by the deployed site. Reduced-motion preferences are supported. Portrait variants were decoded and resized through Chromium after a prior sips conversion defect; the sips script intentionally leaves them untouched.

## Personalized prospect links

Use `index.html?for=the-sky-floor` or `services.html?for=the-sky-floor`. Add entries to the array in `prospects.json`; use relative local logo paths. Optional meeting copy is used only when supplied. Context carries to the contact page, where the organization field is prefilled.

The JSON and logos are public assets. Include only information authorized for public access, never confidential proposals, private contact details, or secrets. A sessionStorage flag remembers the welcome animation. Tab or Escape can dismiss the entrance. Email links open drafts for visitors to send themselves.

## Before deployment

1. Review the current changes and approve deployment. This SEO task did not commit, push or deploy anything.
2. Production SEO is configured for `https://17c.studio/`. After changing page titles, descriptions, indexability or routes, rerun `python3 tools/configure_seo.py --base-url https://17c.studio/`, then both checks above. The generator uses existing HTML pages and excludes noindex pages from the sitemap.
3. Keep the sample proposal noindex. It contains illustrative scope and investment, not an actual client engagement.
4. Deploy the four root HTML files and referenced assets, CSS/JS, `logos`, `prospects.json`, `robots.txt` and `sitemap.xml`. Internal documentation and tooling are not website content.
5. Enable Enforce HTTPS in GitHub Pages settings and verify preferred-host redirects, caching, canonical URLs and social previews on the live host. Connect Search Console and analytics only with real account configuration.
