#!/usr/bin/env python3
"""Check local pages/assets without sending forms or crawling external sites."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from collections import Counter
import re
import json

ROOT = Path(__file__).resolve().parents[1]
CSS_URL = re.compile(r'''url\(\s*(?:(["'])(.*?)\1|([^)]*))\s*\)''', re.S)

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.nodes = []
        self.source = path.read_text()
        self.feed(self.source)

    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))

pages = {p.name: Page(p) for p in ROOT.glob('*.html')}
issues = []
count = 0

def check_reference(ref, source, base):
    global count
    url = urlsplit(ref)
    if url.scheme or url.netloc:
        return
    path = unquote(url.path)
    target = ((ROOT / path.lstrip('/')) if path.startswith('/') else base / path) if path else source
    if path.endswith('/') or target.is_dir():
        target = target / 'index.html'
    target = target.resolve()
    count += 1
    if not target.is_file():
        issues.append(f'{source.relative_to(ROOT)}: missing local file {ref}')
        return
    if url.fragment and target.suffix == '.html':
        target_page = pages.get(target.name) if target.parent == ROOT else Page(target)
        if target_page and url.fragment not in {a.get('id') for _, a in target_page.nodes}:
            issues.append(f'{source.relative_to(ROOT)}: missing anchor {ref}')

def check_css(source, text, base):
    for match in CSS_URL.finditer(text):
        ref = match[2] if match[1] else match[3].strip()
        if ref.startswith(('#', '%23')):
            continue
        check_reference(ref, source, base)

for name, page in pages.items():
    ids = [attrs['id'] for _, attrs in page.nodes if 'id' in attrs]
    for id, occurrences in Counter(ids).items():
        if occurrences > 1:
            issues.append(f'{name}: duplicate ID {id}')
    uses_wishlist = any(tag == 'script' and Path(urlsplit(attrs.get('src', '')).path).name == 'wishlist.js'
                        for tag, attrs in page.nodes)
    if uses_wishlist and 'wishlist-form' in ids:
        # The floating button is optional; the existing review button opens the dialog.
        for required in ['wishlist-form', 'wishlist-panel', 'wishlist-include', 'wishlist-review',
                         'wishlist-option-note', 'wishlist-storage-note', 'wishlist-close',
                         'wishlist-panel-summary', 'wishlist-inquiry-link']:
            if required not in ids:
                issues.append(f'{name}: missing wishlist control {required}')
    for tag, attrs in page.nodes:
        if tag == 'img' and 'alt' not in attrs:
            issues.append(f'{name}: image missing alt')
        for key in ['aria-controls', 'aria-describedby', 'aria-labelledby']:
            for id in attrs.get(key, '').split():
                if id not in ids:
                    issues.append(f'{name}: missing {key} target {id}')
        refs = [attrs[key] for key in ['src', 'href', 'poster'] if key in attrs]
        for key in ['srcset', 'imagesrcset']:
            refs += [item.strip().split()[0] for item in attrs.get(key, '').split(',') if item.strip()]
        for ref in refs:
            check_reference(ref, page.path, page.path.parent)
        if 'style' in attrs:
            check_css(page.path, attrs['style'], page.path.parent)
        if tag == 'form' and attrs.get('id') == 'wishlist-form' and not attrs.get('action', '').startswith('https://'):
            issues.append(f'{name}: inquiry action must use HTTPS')
    for css in re.findall(r'<style\b[^>]*>(.*?)</style>', page.source, re.S):
        check_css(page.path, css, page.path.parent)
    if re.search(r'https?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0)', page.source):
        issues.append(f'{name}: development URL')

for folder in ['studio', 'shared', 'proposals', 'assets']:
    for css in (ROOT / folder).rglob('*.css'):
        # This authoring file is embedded in the root homepage, not linked as an external stylesheet.
        base = ROOT if css == ROOT / 'studio/css/home-critical.css' else css.parent
        check_css(css, css.read_text(), base)

prospect_path = ROOT / 'prospects/prospects.json'
for prospect in json.loads(prospect_path.read_text()):
    logo = prospect.get('logo')
    if logo:
        # Prospect logos resolve against the public root page, not the JSON directory.
        check_reference(logo, prospect_path, ROOT)

print(json.dumps({'htmlPages': len(pages), 'localReferencesChecked': count, 'issues': issues}, indent=2))
raise SystemExit(bool(issues))
