# Local business identity update

Recommendation and implementation date: October 27, 2026.

Latest review: the production and redirect retest at the end of this document supersedes earlier statements about repository identity and deployment status.

## Scope and inspection

The request confirms that 17C Studio is a web design business based in Holland, Michigan. The owner supplied the definitions of SEO-01 through SEO-04 after the first implementation. The follow-up review below maps the work to those definitions.

No AGENTS.md files were found in the workspace or its parent directory. This site uses static HTML, CSS, and JavaScript with no package installation or build step. README.md describes GitHub Pages deployment. CNAME contains 17c.studio, the Git remote is https://github.com/17c-studio/skyfloor.git, and there is no checked-in deployment workflow. Hosting settings and current deployment status were not inspected in GitHub.

The live homepage at https://17c.studio/ was retrieved with curl after the web retrieval tool failed. Its source matched the local homepage's generic title, description, and Organization data and had no Holland or Michigan references. This confirms an opportunity to clarify identity, not the cause of Google's reported AI response. No evidence establishes a merged Business Profile.

Canonicals, robots access, a four-page sitemap, an Organization entity, a WebSite entity, and linked Service entities already existed. These were retained.

## Changes

- Homepage: location and web design in the existing heading label, introduction, About text, title, description, and sharing metadata.
- Services and contact: page-specific titles and descriptions with the confirmed location. Contact includes visible location and nationwide service context.
- Home, Services, and Work: a compact identity and service-area paragraph in the existing footer, using existing paragraph styling.
- Organization data: the same stable #organization ID, an updated description, and city, state, and country in PostalAddress. No street address, postal code, telephone, hours, reviews, or new profile links were invented. Organization type is retained without claiming LocalBusiness rich-result eligibility.
- Work: generated sharing metadata and a WebPage entity linked to the existing business and website IDs.
- SEO tooling: standalone noindex proposals remain outside the public metadata template. The generator previously stopped because those files intentionally have no meta descriptions. The checker now applies the same scope and accepts PostalAddress.

Fonts, colors, backgrounds, stylesheets, scripts, forms, URLs, canonicals, robots rules, and sitemap membership are unchanged. New copy contains no em dashes. Nationwide service remains explicit.

## Verification

- python3 tools/configure_seo.py --base-url https://17c.studio/: four indexable pages generated.
- python3 tools/check_seo.py: five template-managed pages, four sitemap URLs, twelve schema entities, zero issues. Two standalone noindex proposals are excluded from template checks.
- python3 tools/check_site.py: seven HTML pages, 233 local references, zero issues.
- python3 tools/inline_home_critical.py --check: current.
- Local Chrome homepage: updated title and location copy appear in the rendered accessibility tree; desktop hero visually inspected.

These are structural checks, not a full responsive or accessibility audit or evidence of indexing. The follow-up below records external schema validation and sampled responsive checks. No changes have been committed, pushed, or deployed. Business Profile, Search Console, Bing Webmaster Tools, AI responses, and search inclusion were not verified.

## After deployment

Verify the published page source, canonical URLs, and structured data. Use Google's Rich Results Test or Schema Markup Validator, then Search Console URL Inspection for the homepage and other public pages. Review the existing Business Profile and public listings for factual consistency using authorized owner access. Allow for recrawling; these changes do not guarantee local rankings or inclusion in AI recommendations.

References: https://developers.google.com/search/docs/appearance/structured-data/organization and https://schema.org/Organization.

## Selected recommendation follow-up

| ID | Status | Implementation and limits |
| --- | --- | --- |
| SEO-01 | Implemented locally | Homepage title and visible copy identify web design in Holland, Michigan. The existing About section now names Mariel Whitney as founder. The shared footer describes website design, SEO, and ongoing care. There is no separate About page; existing About fragment links are retained. |
| SEO-02 | Public investigation complete; owner checks remain | Live responses, redirects, canonical tags, robots directives, sitemap, links, and logo checked. HTTP does not redirect to HTTPS. Hosting and account follow-up is below. No source-level crawl block found in the tested public pages. |
| SEO-03 | Implemented and validated locally; profile verification remains | One stable Organization definition retains its existing URL, logo, and identifier. Description and city-level address match visible content. No sameAs links were added because the existing personal LinkedIn/Pinterest and branded Instagram destinations were not independently verified as business identity profiles. The existing public email link is retained; email was not newly exposed in JSON-LD, consistent with the existing email-link handling. |
| SEO-04 | Available content improvements complete; attribution evidence remains unverified | Existing services already distinguish new builds, redesigns, platforms, process, SEO, and care. Added clear inquiry/quote copy and contextual Services/Work links. Existing project challenge and solution descriptions are retained. Changed “Project outcome” labels to “Design detail” to distinguish described functionality from measured business outcomes. No new project contribution or collaborator claims were added. |

The project-context question received “n/a.” This does not establish whether each project was independent studio work, employment, or collaboration. Future case-study expansion requires accurate role, employer/collaborator credits, permission to use relevant material, and evidence for any measured result. Do not assume sole responsibility. WORK_PAGE.md is historical and its statement about role placeholders does not describe the current HTML, which has challenge, solution, and design-detail entries.

### Live technical evidence

GET requests followed redirects on October 27, 2026:

| Requested URL | Observed response chain |
| --- | --- |
| http://17c.studio/ | 200 at the HTTP URL; no HTTPS redirect |
| https://17c.studio/ | 200 |
| http://www.17c.studio/ | 301 to http://17c.studio/, then 200 |
| https://www.17c.studio/ | 301 to https://17c.studio/, then 200 |
| https://17c.studio/services.html | 200 |
| https://17c.studio/work.html | 200 |
| https://17c.studio/form.html | 200 |
| https://17c.studio/robots.txt | 200, Allow: / and HTTPS sitemap reference |
| https://17c.studio/sitemap.xml | 200, homepage, Services, Work, and Contact URLs |
| https://17c.studio/assets/optimized/17c-logo-224.png | 200 |

Homepage, Services, Work, and Contact source HTML each has the expected single HTTPS canonical, no meta robots exclusion, no observed X-Robots-Tag exclusion in the response headers, and crawlable navigation links to the homepage, Services, Work, Contact, and the homepage About section. This establishes public technical signals only, not Google's indexing status. The live content precedes the local changes.

The HTTP behavior requires a hosting setting rather than an HTML redirect. With repository admin access, review Settings > Pages > Enforce HTTPS for 17c-studio/skyfloor, then enable it if this repository is confirmed as the production Pages source. Retest both HTTP variants and verify they finish at https://17c.studio/ with a permanent redirect. No hosting settings were changed. Official guidance: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https.

### Validation performed in follow-up

- Schema Markup Validator, code-snippet mode: tested the local homepage JSON-LD graph, including Organization, PostalAddress, WebSite, and WebPage. The validator resolved the graph under WebPage and reported zero errors and zero warnings. This was code validation, not a fetch of the undeployed version or a Google rich-result guarantee.
- Chrome: desktop homepage previously inspected; 390 × 844 mobile hero and About text inspected, plus mobile Services quote copy and shared footer. Text wraps within the existing layout. Temporary viewport override reset afterward. This is a sample, not a full device matrix.
- Existing local site, SEO, critical CSS, and whitespace checks rerun after content edits. No build or lint package exists in this static repository.

### Precise owner account actions

No Search Console or Business Profile account connector is available in this session. A public business-name search did not establish a specific Business Profile; it is not evidence that one does not exist. No account data or listing was changed.

1. In Search Console, select the 17c.studio property. Inspect https://17c.studio/, https://17c.studio/services.html, and https://17c.studio/work.html. Record the indexed status, last crawl, crawl allowed, page fetch result, indexing allowed, user-declared canonical, and Google-selected canonical. Keep indexed data separate from Test live URL results. Repeat the live test after deployment and any hosting fix.
2. Open Search Console > Sitemaps and review https://17c.studio/sitemap.xml: processing status, last read date, discovered URLs, and reported errors. Review Page indexing reasons for excluded public pages. Supply the report/export for any diagnosis that needs account evidence.
3. Open the existing Business Profile while signed into its owner account. Confirm the real name “17C Studio,” the accurate available primary category (for example, Website designer), website https://17c.studio/, services, public contact details, and actual service area. Confirm eligibility and current ownership before considering any new listing. Do not create a duplicate.
4. Keep a private home address hidden when customers do not visit. Nationwide remote website services do not by themselves justify selecting the entire country as a Business Profile service area. Use the actual eligible in-person service area. Confirm branded profile URLs before adding sameAs to the schema.

Account guidance: https://support.google.com/webmasters/answer/9012289?hl=en, https://support.google.com/business/answer/3038177, and https://support.google.com/business/answer/9157481?hl=en.

Changed files across this task: index.html, services.html, form.html, work.html, tools/configure_seo.py, tools/check_seo.py, README.md, and this report. No dependencies, prices, additional location pages, commits, pushes, or deployments were added.

## Production and redirect retest

October 27, 2026, approximately 11:20 a.m. EDT. This review made no hosting or website-content changes.

Production hosting is now confirmed through the signed-in GitHub Pages settings at https://github.com/17c-studio/17c/settings/pages:

- Repository: 17c-studio/17c. The local origin still uses 17c-studio/skyfloor; GitHub redirects that old repository URL to 17c-studio/17c. The local origin was not changed.
- Source: Deploy from a branch, main, / (root).
- Custom domain: 17c.studio. DNS check successful.
- Enforce HTTPS: unchecked.
- Deployment: commit 6243c0905c79835bff415ded8950fa5d6c5ae182, successful on October 27 at 11:18:24 a.m. EDT. Public deployment status: https://api.github.com/repos/17c-studio/17c/deployments/7362440117/statuses.
- The fetched production index.html, services.html, work.html, and form.html each exactly match the local files byte for byte. The local homepage also matches remote main. These changes are already live, superseding the earlier implementation-time statement that they were local only. The review itself did not commit, push, or deploy.

Fresh GET requests reproduce the earlier server behavior: http://17c.studio/ returns 200 without a redirect; http://www.17c.studio/ redirects once to the HTTP apex and returns 200. HTTPS apex returns 200, and HTTPS www redirects to HTTPS apex. A second test with a unique query string and Cache-Control: no-cache returned the same HTTP behavior. GitHub.com response headers and the inspected Pages setting support this finding. Browser HTTPS-first behavior or a remembered browser upgrade could explain a different apparent result, but the specific cause of the previously observed browser behavior was not tested.

Now that the actual production configuration is verified, enabling Enforce HTTPS in this repository is a supported recommendation. No domain removal, DNS edit, canonical change, or HTML redirect is indicated by this evidence. After any separately authorized setting change, retest both HTTP variants for a permanent redirect to HTTPS and confirm query strings and paths are preserved.

Review results: SEO check passed (five template-managed pages, four sitemap URLs, twelve schema entities); site check passed (seven pages, 235 local references); critical CSS check passed; committed diff whitespace check passed. No source-level release blocker was identified in this review. Previous sampled responsive inspection and external schema validation remain as recorded above; they were not repeated in this read-only source and hosting review.

Remaining items: HTTPS enforcement is the confirmed hosting issue. Search Console indexing and Business Profile details remain unverified owner checks, not established defects. Project employment/collaboration credits and business-profile ownership remain unverified, so no new attribution or sameAs claims should be added without evidence. The local Git remote's old repository name and earlier deployment notes are maintenance details, not production failures. No further deployment is needed to publish the reviewed HTML; only this updated report remains local.
