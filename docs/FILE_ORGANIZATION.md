# File organization

The root HTML files are live entry pages. Keep their filenames so links already sent to clients and prospects continue to work. Edit those HTML files directly; there is no build or synchronization step.

## Studio pages

| Page | Entry file | Supporting files |
| --- | --- | --- |
| Home | `index.html` | `studio/css/styles.css`, `studio/js/home.js` |
| Services | `services.html` | `studio/css/services.css`, `studio/js/services.js` |
| Contact | `form.html` | Shared inquiry and wishlist code |
| Work | `work.html` | `studio/css/work.css`, `studio/js/work.js` |

`studio/css/home-critical.css` is an authoring source embedded in the homepage, not a separately linked stylesheet. Its image URLs resolve against the root homepage. After changing it, run `python3 tools/inline_home_critical.py`; use `--check` to confirm the inline copy is current. Ordinary external CSS image URLs resolve relative to their stylesheet.

## Proposals

| Proposal | Entry file | Supporting folder |
| --- | --- | --- |
| Mr Rebuild | `proposal-mr-rebuild.html` | `proposals/mr-rebuild/` |
| Zeeland Christian School | `proposal-zcs.html` | `proposals/zcs/` |
| Estella Rose | `proposal-estella-rose.html` | `proposals/estella-rose/` |
| Estella Rose legacy version | `proposal-erf.html` | `proposals/estella-rose/legacy/` |
| Sample | `proposal.html` | `proposals/sample/` |
| Reusable template | `proposal-template-17c.html` | Self-contained root template |

Client imagery lives in each client's `assets/` folder. Mr Rebuild and ZCS have inline styles in their entry HTML; Estella Rose and the sample have external stylesheets. Each client retains its own signing script and scope. The Formspree endpoints and published proposal URLs remain unchanged.

## Prospects and shared code

- `prospects/prospects.json`: prospect data, with logo paths relative to the public root page.
- `prospects/logos/`: prospect/business logos.
- `prospects/prospects.js` and `prospect-reveal.js`: personalization and welcome behavior.
- `prospects/Personal-Links-for-Prospects.md`: personalized URL instructions.
- `shared/js/`: email links, contact navigation, inquiry submission, wishlist, and shared browser behavior.
- `shared/css/wishlist.css`: wishlist styles used on multiple studio pages.

Prospect URLs such as `/?for=the-sky-floor` and `services.html?for=the-sky-floor` still use the root entry pages. Runtime fetches resolve against those pages, not against the JavaScript file's folder.

## Assets and documentation

- `assets/brand/`: original studio logo and favicon.
- `assets/images/studio/`: original studio/portrait images.
- `assets/images/services/`: service photographs and existing source copies.
- `assets/images/work/`: original portfolio screenshots.
- `assets/video/`: video files.
- `assets/optimized/`: existing optimized public images and size metadata.
- `assets/cursors/`: custom cursor artwork.
- `docs/audits/`: historical SEO, accessibility, and launch notes.
- `docs/setup/`: configuration instructions.
- `docs/pages/`: page-specific documentation.
- `audit/`: the existing ignored local screenshot folder; its contents were preserved.

Original images are retained; this task did not resize or remove media. The optional image optimizer still requires the original source files listed in its configuration; some older originals, including `laptop-computer.png`, were already absent from this checkout.

## Validation and publishing

Run from the repository root:

```sh
python3 tools/check_site.py
python3 tools/check_seo.py
python3 tools/inline_home_critical.py --check
```

Preview the repository root with a local static server or the editor's existing Live Server. GitHub Pages continues serving the root entry pages; no hosting or custom-domain changes are required. Keep `CNAME`, `robots.txt`, and `sitemap.xml` at the root.
