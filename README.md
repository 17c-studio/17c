# 17C Studio

A responsive, single-page website for 17C. Built with plain HTML, CSS, and JavaScript; no build step or dependencies.

## Preview

Open `index.html` in a browser, or run `python3 -m http.server 8000` from this directory and visit http://localhost:8000.

## Contact

The inquiry forms on `index.html` and `services.html` submit to `https://formspree.io/f/xoejkyvk`. Plain JavaScript adds validation, loading, success, and error feedback; the HTML form also supports standard POST submission without JavaScript. Visitors can include their saved service wishlist from either page. Formspree controls the recipient and email delivery settings. See `WISHLIST_SETUP.md` for verification.

## Design

Palette: Stone `#696158`, Chalk `#E1DED7`, and Grey `#B7B4AF`, with darker Stone for hover and focus states. Grey is used for decorative accents rather than body text.

The monogram is an SVG interpretation of the supplied reference. The original uploaded logo was not available as a file in the workspace. Both portfolio previews are original illustrative design concepts, clearly labeled as such. They are not claims of completed client work.

Google Fonts supplies DM Sans and Libre Caslon Display, with system fallbacks if unavailable. All illustrations are local SVG or CSS.

## Publish

Upload both HTML pages, all local CSS and JavaScript files (including `wishlist.css`, `wishlist.js`, and `wishlist-catalog.js`), the image files, and the `assets` folder to any static website host. No credentials or server configuration are required by the site itself.

## Personalized prospect links

Run `python3 -m http.server 8000` in this folder. Prospect data loads over HTTP;
opening the HTML directly as a file will show the normal site instead.

Sky Floor example: http://localhost:8000/?for=the-sky-floor
Wishlist: http://localhost:8000/services.html?for=the-sky-floor

Personalized pages show an ivory curtain once per business per browser session.
The logo entrance, hold, and curtain take about 8 seconds on mobile and desktop once assets are ready.
The browser remembers it in session storage; a fresh browser session previews it again. Reduced-motion visitors see a short fade instead.
Include `prospect-reveal.js` when uploading the site.
Include `contact-navigation.js` too; it handles the personalized contact links
after the invitation and fonts are ready.

To add another prospect in under two minutes:

1. Open `prospects.json`, copy the existing object, and separate the objects with a comma.
2. Give the copy a unique lowercase slug such as `another-business` and its exact `businessName`.
3. Fill optional fields only with information you have. Leave `personalLine` and `proposedTime` empty until supplied. Use an empty `logo` for the styled business-name fallback, or a relative saved-file path such as `logos/another-business.png`.
4. Save and open `http://localhost:8000/?for=another-business`.

Example entry (replace the sample name):

```json
{
  "slug": "another-business",
  "businessName": "Another Business",
  "domain": "",
  "firstName": "",
  "personalLine": "",
  "proposedTime": "",
  "logo": ""
}
```

The JSON is an array: keep the surrounding `[` and `]`, and avoid trailing commas.
The domain is informational; the site does not call any logo services.
The home and services pages always use the dark theme and circle cursor.
Prospect names apply only through the prospect link. Email links open drafts
for the visitor to send.

When hosted, `prospects.json` will be publicly readable. Include no private
information or secrets. These links use relative paths and also work when the
whole site is hosted in a subfolder. Include `prospects.json`, `prospects.js`, and
any saved logos along with all the existing site files when eventually publishing.
Nothing has been published as part of this feature.
# skyfloor

