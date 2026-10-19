# SEO audit and implementation, October 19, 2026

## Baseline audit, before edits

The repository contains four HTML pages: home, services, contact and a fictional sample proposal. There are no separate About, project, privacy, terms or accessibility pages. README references to those pages are stale. The working tree was clean at the start of this task.

Priority findings:

1. High: no production canonical URLs, JSON-LD, or sitemap. robots.txt permits crawling but has no sitemap URL. The unused SEO generator references a deleted accessibility page and would publish local-only service-area data.
2. High: titles and descriptions exist and are unique, but the homepage title is vague, and contact metadata provides little information. Open Graph title/description exist on the three public pages, but URL/image tags are absent and Twitter only declares a card type.
3. High: all three public pages reference missing launch.css. Homepage wishlist dialog links to a nonexistent fragment. Contact wishlist JavaScript dereferences missing review/include controls. The existing checker reports 12 issues; several homepage wishlist warnings reflect obsolete checker assumptions rather than a running form.
4. Medium: the homepage introduction does not clearly identify custom web design early. The brand headline is present inside the single H1 and must remain. All four pages already have one H1. Service sections use H2/H3 correctly, except an H4 used as a visual closing slogan. Project screenshot cards have descriptive alt text but no project headings. Their case studies live on an external portfolio domain.
5. Medium: responsive hero and project images, explicit image dimensions, lazy loading, high-priority hero loading, preconnects and deferred main scripts already exist. Portrait is a 1.7 MB original; previous sips conversion produced black output, so avoid regenerating blindly. Fonts/CSS block rendering; third-party animation and font requests add cost. No measured field CWV or Lighthouse baseline is available.
6. Setup: no GA4, GTM or Search Console verification token found. Personalized pages load Calendly. Inquiry submission goes through the shared Formspree handler. Track confirmed success, not submit-button clicks; never put inquiry content into analytics.
7. Hosting: CNAME confirms 17c.studio. Live site and robots retrieval through the browsing tool failed. Redirects, CDN rules, cache headers and live indexability cannot be inferred from local files.

The current visual system, personalized links, service disclosures, wishlist selection, native POST fallback and animations must be preserved. No migration or deployment is authorized in this task.

## Implemented improvements

All SEO values are present in the delivered HTML, without relying on JavaScript. Public pages have individual HTTPS canonicals. The `/` canonical consolidates `/index.html` and prospect-query duplicates. Internal home links now use `./`, including personalized navigation. Distinct services and contact URLs retain their own canonicals. The fictional proposal keeps `noindex, nofollow`, has its own sharing metadata and is excluded from the sitemap.

The homepage retains its H1 and brand headline, typography, color system, animation scripts and layout. Its introduction now explicitly describes custom web design, development, redesigns and support. The About copy mentions nationwide collaboration once. Project-context text links to services. Existing platform deliverables substantiate WordPress and Shopify services; no new platform claims or placeholder landing pages were added.

All pages have one H1. Services use H2 chapters with H3 deliverable headings; the decorative H4 slogan is now a paragraph with matching styling. Informative project image alt text remains, decorative images retain empty alt attributes, and the portrait alt text identifies the designer. Existing service process content supplies useful crawlable answers; a new FAQ section was not necessary.

JSON-LD uses stable Organization and WebSite IDs, page entities and six Service entities tied to real section anchors. Nationwide service coverage matches visible copy. There is no invented address, phone, storefront, rating or review data. Breadcrumb schema was omitted because there is no visible breadcrumb trail. No special AI markup or machine-readable AI file was added. Google's AI search guidance prioritizes the same crawlability, helpful text and matching structured data used for search generally: [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features).

Removed the three missing launch.css requests, corrected the homepage dialog's broken contact destination and restored the contact form's missing wishlist controls using the existing services-page pattern. Wishlist script behavior itself remains unchanged. The static site checker now checks form controls when a form actually exists and understands directory homepage links.

The original portrait is preserved. Browser-decoded JPEG variants are 79,795 bytes (600 × 800) and 251,708 bytes (1200 × 1600), replacing the 1,787,309-byte download in page markup. This reduces that image's bytes by about 86% for the large variant and 96% for the small variant. Both were visually checked. Responsive source selection, dimensions, lazy loading and async decoding are supplied. Existing hero priority/preload and optimized project images remain. No LCP, INP or CLS improvement is claimed from byte savings alone.

## Page intent and final metadata

| Page | Primary intent | Final title | Final meta description |
| --- | --- | --- | --- |
| index.html | Custom web design for small and independent businesses | Custom Web Design for Small Businesses \| 17C Studio | Thoughtful custom websites, redesigns, and ongoing support for businesses ready to grow. Discover personalized web design and development with 17C Studio. |
| services.html | Compare redesign, development, SEO and maintenance services | Website Redesign, SEO & Maintenance Services \| 17C Studio | Explore website redesigns, custom development, Shopify design, SEO, and website maintenance. Find the right support for your business with 17C Studio. |
| form.html | Start a website project conversation | Talk About Your Website Project \| 17C Studio | Have a new website in mind, a redesign, or a few things to improve? Tell 17C Studio what you need and start a conversation about your next chapter. |
| proposal.html | Illustrative proposal, intentionally noindex | Sample Website Project Proposal \| 17C Studio | Explore an illustrative website design proposal from 17C Studio, including project scope, collaboration, timeline, and sample investment. |

## Files changed

| File | Reason |
| --- | --- |
| `index.html` | Specific metadata, canonical/social/schema block, clearer introduction, nationwide context, responsive portrait, service link and corrected home/contact links. |
| `services.html` | Distinct service intent metadata, canonical/social/service schema, semantic closing slogan, updated references and home links. |
| `form.html` | Contact intent metadata, canonical/social/ContactPage schema and restored wishlist controls. |
| `proposal.html` | Unique proposal metadata and social preview while retaining noindex. |
| `services.css` | Preserve the former H4 slogan's appearance after converting it to a paragraph. |
| `prospects.js` | Preserve personalized home navigation when homepage links use `./`. |
| `inquiry.js` | Emit an integration event only after confirmed form success, including selected service IDs without form values. |
| `analytics-events.js` | New local-only click event hooks for inquiry, email and direct Calendly links. |
| `assets/optimized/mariel-mat-600.jpg` | New smaller portrait variant. |
| `assets/optimized/mariel-mat-1200.jpg` | New larger portrait variant. |
| `robots.txt` | Add the production sitemap reference while allowing crawling. |
| `sitemap.xml` | New sitemap with only the three canonical indexable pages, without fabricated lastmod dates. |
| `tools/configure_seo.py` | Generate repeatable metadata/schema from current pages, excluding noindex pages from sitemap and eliminating obsolete location assumptions. |
| `tools/check_site.py` | Correct obsolete form assumptions and validate directory homepage links. |
| `tools/check_seo.py` | New checks for unique metadata, H1 count, canonical/social URLs, JSON-LD entities/references and sitemap membership. |
| `README.md` | Correct the documented page inventory, SEO commands, image behavior and deployment steps. |
| `SEO_AUDIT.md` | Baseline findings, final metadata, implementation notes and remaining setup. |

## Technical SEO checklist

| Item | Status |
| --- | --- |
| Unique titles/descriptions and social previews | Complete in local initial HTML for all four pages. |
| Canonicals | Complete. Root and index.html share the root canonical; services/contact retain distinct URLs. Query variants use the base canonical. |
| Sitemap / robots | Complete locally. Sitemap includes `/`, `/services.html`, `/form.html`; robots allows crawling and references it. |
| Indexing controls | Three public pages remain indexable. Sample proposal remains noindex. No staging pages added. |
| Structured data | Local JSON syntax, entity references, allowed types, production URLs and service-anchor checks pass. External Schema.org validation / Google's rendered-page inspection remain to do after deployment. |
| Images / favicon | Local references and alt attributes pass; portrait variants checked visually. Existing favicon resolves. No manifest is referenced, and the site does not require a PWA manifest. |
| Internal links / semantics | Local link, fragment, ID, ARIA and one-H1 checks pass. Project descriptions/individual case study pages remain a content opportunity. |
| HTTPS / hostname | Live HTTPS returns 200. `www` redirects 301 to the apex HTTPS URL. HTTP currently returns 200 without upgrading. Requires hosting configuration. |
| Duplicate homepage | Live `/index.html` and `/` both return 200. Canonical and preferred internal links address this locally. A server redirect is an optional future host/CDN configuration. |
| Mobile / runtime | Verified locally at mobile, tablet and desktop widths; details below. |
| Field CWV / Lighthouse | Not measured. Lighthouse/Node CLI is unavailable in the current shell. Use PageSpeed Insights and Search Console after publishing, then compare field data over time. |
| Search Console | Requires owner verification, sitemap submission and live URL inspection. No token supplied or invented. |
| GA4 | Local hooks prepared. No tracker installed and no analytics requests/storage added. Needs measurement ID, consent configuration and live validation. |
| AI-assisted search | Clear text, normal crawl access, internal links and schema implemented. CDN/bot restrictions and indexing must be checked on the host. Inclusion is not guaranteed. |
| Release | Local changes only. No commit, push, hosting change, sitemap submission or deployment performed. |

## Search Console and analytics setup

1. Create a Search Console Domain property for `17c.studio` and add the exact DNS TXT record provided by Google through your DNS provider. Alternatively, provide the exact verification meta-tag value or HTML file for a URL-prefix property. No passwords are needed in the source tree. See [Google ownership verification](https://support.google.com/webmasters/answer/9008080).
2. After deployment, submit `https://17c.studio/sitemap.xml`; inspect all three canonical pages and check the reported Google-selected canonicals. Inspect a prospect URL to confirm consolidation.
3. Provide the GA4 web stream measurement ID (`G-…`) and the chosen consent/privacy approach before connecting an adapter. Use one installation. Subscribe to the `studio:analytics` window event only after the relevant consent decision. The hooks do not queue or retain events.
4. Event detail uses `name` and `page_path`. `generate_lead` additionally includes an array of selected/included `service_ids` such as `service-1`. It fires only after an accepted AJAX submission, not on validation errors, server errors or button clicks. Map it to the intended GA4 key event and test in DebugView. Disable or reconcile automatic form tracking to avoid counting the same inquiry twice. Native non-JavaScript POST success cannot emit this event.
5. `inquiry_click`, `email_click` and `consultation_click` track their respective anchor intents locally. Email clicks are not confirmed leads. Current Calendly booking UI lives inside a third-party iframe, so this hook cannot observe iframe clicks or completed bookings. Tracking real bookings needs a supported Calendly event integration with origin validation and deduplication; that is a separate setup step.
6. Use page paths to compare services/contact entry points, and register an appropriate GA4 representation for selected service IDs when wiring the adapter. They reflect the included wishlist, not proven acquisition attribution. An empty wishlist cannot identify which service caused the inquiry. Never forward form values, full mailto URLs, prospect parameters or raw booking event payloads. Configure GA page-location sanitization too, so automatic page views do not expose query strings. See [Google Analytics event setup](https://developers.google.com/analytics/devguides/collection/ga4/events).

## Prioritized remaining recommendations

| Priority | Action | Effort and benefit |
| --- | --- | --- |
| 1 | Enable Enforce HTTPS in repository Settings → Pages; verify HTTP now permanently redirects to HTTPS. If Cloudflare is placed in front later, verify its HTTPS/redirect rules without creating a loop. | Low effort; removes an observed live protocol duplicate. [GitHub HTTPS instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https). |
| 2 | Review and approve this change, deploy it, verify Search Console and submit the sitemap. Check live social images, canonical tags and schema. | Low effort; makes the local improvements available to crawlers. |
| 3 | Run PageSpeed Insights on home and services, mobile first. Use actual LCP/CLS/INP findings to decide whether to self-host/subset fonts, adjust animations or change asset loading. | Medium effort; performance work guided by measurements. Avoid blind removal of styling or animation dependencies. |
| 4 | Add a few substantive project stories under `/work/project-name/` with confirmed role, scope and real outcomes. Add visible titles/captions to homepage project cards when their context is confirmed. | Medium effort; unique first-party evidence and stronger contextual links. Existing work is on `marielwhitney.github.io/portfolio/`, which has its own indexing and canonical context. First-party case studies could build 17c.studio's content depth. Do not copy or migrate blindly; coordinate canonicals or permanent redirects with the old host if URLs actually move. |
| 5 | Connect consent-aware GA4 and confirmed inquiry/booking measurement. | Medium effort; reveals which services and search visits lead to real conversations. Requires account configuration. |
| 6 | When enough unique content exists, consider dedicated custom web design, website redesign, and website maintenance pages, linked from the services overview. Include process, scope and relevant verified work on each. | Medium to high effort; distinct search intent without thin keyword pages. No placeholder pages created. |

## Verification results

- `python3 tools/check_site.py`: passed. Four HTML pages, 148 local references, zero missing local files/anchors, duplicate IDs, missing alt attributes or broken ARIA targets. Baseline had 12 reported issues; outdated wishlist-control assumptions were corrected as well as actual defects.
- `python3 tools/check_seo.py`: passed. Four pages, three sitemap URLs and 11 defined schema entities, zero issues. Covers metadata uniqueness, one H1 per page, canonical/social values, parseable JSON-LD, entity references and real service anchors. This is structural validation, not a claim of external rich-result eligibility.
- SEO generator rerun: byte-identical output on consecutive runs. Idempotency passed.
- Local Chromium responsive checks: all four pages at 390, 768 and 1440 pixels (12 page/viewport combinations), with reduced motion enabled. Each had one H1, no horizontal overflow, no page JavaScript exceptions and no observed HTTP error responses.
- Normal-motion checks: home and services loaded/scrolled without runtime errors or horizontal overflow. Personalized homepage copy and root navigation were checked separately.
- Interaction checks: two selected services restored on the contact page; review dialog opened/closed; mocked server failure retained the message and emitted no lead event; mocked success cleared the form and emitted one lead event with the two expected service IDs. Event payload contained no test form content. No actual Formspree submission or email was sent.
- Prospect navigation: the Cultured Kombucha home link retained its query string, reached the root homepage and kept the root canonical. Leon Footwear personalization remained functional.
- Visual review: mobile homepage, desktop introduction, contact form and resized portrait reviewed. Brand headline, original hero imagery, typography and colors retained. Original portrait preserved.
- Live header checks with curl: `https://17c.studio/` returned 200, `http://17c.studio/` returned 200, `https://www.17c.studio/` returned 301 to `https://17c.studio/`, and `https://17c.studio/index.html` returned 200. HTTPS enforcement therefore remains a host task. Live headers identify GitHub Pages and a 600-second cache lifetime; no Cloudflare dashboard state was accessed.
- `git diff --check`: passed.

Limits: local browser checks are not a complete accessibility audit or a field performance measurement. External schema validation, hosted canonical/image checks, live form delivery, real booking tracking, consent behavior and Search Console indexing require post-approval hosted testing. Lighthouse was not available; no scores were fabricated. No changes were pushed or deployed.
