#!/usr/bin/env python3
"""Embed the homepage's critical CSS; --check detects a stale inline copy.

Keep assets/home-critical.css in sync when changing header, cover, personalization,
or shared theme styles. Other page styles remain in styles.css.
"""
from pathlib import Path
import argparse
import re

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
page = ROOT / 'index.html'
source = (ROOT / 'assets/home-critical.css').read_text()
css = re.sub(r'/\*.*?\*/', '', source, flags=re.S).strip()
block = '<!-- home-critical:start -->\n  <style id="home-critical">\n' + css + '\n  </style>\n  <!-- home-critical:end -->'
html = page.read_text()
pattern = r'<!-- home-critical:start -->.*?<!-- home-critical:end -->'
if not re.search(pattern, html, flags=re.S):
    raise SystemExit('Missing home-critical markers in index.html')
updated = re.sub(pattern, lambda _: block, html, flags=re.S)
if args.check:
    if updated != html:
        raise SystemExit('Critical CSS is stale; run python3 tools/inline_home_critical.py')
    print('Homepage critical CSS is current.')
else:
    page.write_text(updated)
    print(f'Inlined {len(css.encode())} bytes of homepage critical CSS.')
