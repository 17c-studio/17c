#!/usr/bin/env python3
"""Set domain-dependent SEO only after the actual production URL is confirmed.
Usage: python3 tools/configure_seo.py --base-url https://YOUR-CONFIRMED-HOST/path/
Run against a copy with --site-dir for preview. Legal drafts remain noindex.
"""
import argparse
from pathlib import Path
import re
import json
import ipaddress
from urllib.parse import urlsplit, urljoin
from xml.sax.saxutils import escape
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url', required=True)
parser.add_argument('--site-dir', type=Path, default=Path(__file__).resolve().parents[1])
args = parser.parse_args()
u = urlsplit(args.base_url)
if u.scheme != 'https' or not u.hostname or u.query or u.fragment or u.username or u.password:
    parser.error('Use a confirmed HTTPS URL, without credentials, query parameters, or fragments.')
if u.hostname == 'localhost' or u.hostname.endswith(('.localhost', '.test', '.invalid')):
    parser.error('Development hosts cannot be used in production SEO.')
try:
    ipaddress.ip_address(u.hostname)
except ValueError:
    pass
else:
    parser.error('Use a confirmed public hostname, not an IP address.')
base = args.base_url.rstrip('/') + '/'
paths = [('index.html', ''), ('services.html', 'services.html'), ('form.html', 'form.html'), ('accessibility.html', 'accessibility.html')]
urls = []
for file, route in paths:
    path = args.site_dir / file
    source = path.read_text()
    source = re.sub(r'\s*<!-- production-seo:start -->[\s\S]*?<!-- production-seo:end -->', '', source)
    url = urljoin(base, route)
    image = urljoin(base, 'assets/optimized/social-cover.jpg')
    block = f'\n  <!-- production-seo:start -->\n  <link rel="canonical" href="{escape(url)}">\n  <meta property="og:url" content="{escape(url)}">\n  <meta property="og:image" content="{escape(image)}">\n  <meta property="og:image:alt" content="17C Studio website cover photograph">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n'
    if file == 'index.html':
        data = {'@context':'https://schema.org','@type':'Organization','name':'17C Studio','url':base,'description':'Independent web design studio in Holland, Michigan.','areaServed':[{'@type':'Place','name':'Holland, Michigan'},{'@type':'Place','name':'West Michigan'}]}
        block += '  <script type="application/ld+json">'+json.dumps(data).replace('<','\\u003c')+'</script>\n'
    block += '  <!-- production-seo:end -->\n'
    path.write_text(source.replace('</head>',block+'</head>'))
    urls.append(url)
xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{escape(url)}</loc></url>\n' for url in urls)+'</urlset>\n'
(args.site_dir / 'sitemap.xml').write_text(xml)
(args.site_dir / 'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+urljoin(base,'sitemap.xml')+'\n')
print('Configured canonical URLs, social image URLs, organization data, sitemap, and robots.txt for '+base)
