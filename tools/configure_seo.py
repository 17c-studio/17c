#!/usr/bin/env python3
"""Generate production SEO from each page's title, description and indexability.
Usage: python3 tools/configure_seo.py --base-url https://17c.studio/
Use --site-dir to configure a preview copy. No files are uploaded or deployed.
"""
import argparse
import ipaddress
import json
import re
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

class Metadata(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.title = ''
        self.description = ''
        self.noindex = False
        self.in_title = False
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title':
            self.in_title = True
        if tag == 'meta':
            if attrs.get('name') == 'description':
                self.description = attrs.get('content', '')
            if attrs.get('name') == 'robots':
                self.noindex = 'noindex' in attrs.get('content', '').lower()
    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
    def handle_data(self, text):
        if self.in_title:
            self.title += text

SERVICES = [
    ('Custom website design and development', 'Custom websites built around your business.'),
    ('Website strategy and user experience design', 'Website audits, content organization and customer journey planning.'),
    ('Website redesign and optimization', 'Website refreshes, mobile optimization and usability improvements.'),
    ('E-commerce website design', 'Shopify design, storefront customization and online shopping experiences.'),
    ('SEO and analytics', 'Search visibility, on-page SEO and analytics setup.'),
    ('Website maintenance and support', 'Ongoing website updates, technical maintenance and improvements.'),
]

def configure(base, root):
    organization_id = base + '#organization'
    website_id = base + '#website'
    urls = []
    for path in sorted(root.glob('*.html')):
        source = path.read_text()
        # Standalone noindex proposals do not use the public site's SEO template.
        if Metadata(source).noindex and '<!-- production-seo:start -->' not in source:
            continue
        source = re.sub(r'\s*<!-- production-seo:start -->[\s\S]*?<!-- production-seo:end -->', '', source)
        # These tags are owned by the generated block to prevent duplicates.
        source = re.sub(r'^\s*<meta (?:property="og:[^"]+"|name="twitter:[^"]+")[^>]*>\s*$', '', source, flags=re.M)
        meta = Metadata(source)
        if not meta.title.strip() or not meta.description:
            raise ValueError(f'{path.name} needs a title and description')
        url = urljoin(base, '' if path.name == 'index.html' else path.name)
        image = urljoin(base, 'assets/optimized/social-cover.jpg')
        tags = [f'<link rel="canonical" href="{escape(url)}">']
        social = {
            'og:type': 'website', 'og:site_name': '17C Studio',
            'og:title': meta.title.strip(), 'og:description': meta.description,
            'og:url': url, 'og:image': image,
            'og:image:alt': '17C Studio website cover photograph',
            'og:image:width': '1200', 'og:image:height': '630',
            'twitter:card': 'summary_large_image', 'twitter:title': meta.title.strip(),
            'twitter:description': meta.description, 'twitter:image': image,
            'twitter:image:alt': '17C Studio website cover photograph',
        }
        for key, value in social.items():
            attr = 'property' if key.startswith('og:') else 'name'
            tags.append(f'<meta {attr}="{key}" content="{escape(value)}">')
        if not meta.noindex:
            urls.append(url)
            graph = []
            if path.name == 'index.html':
                graph.extend([
                    {'@type': 'Organization', '@id': organization_id, 'name': '17C Studio',
                     'url': base, 'logo': urljoin(base, 'assets/optimized/17c-logo-224.png'),
                     'description': 'A web design business based in Holland, Michigan, creating custom websites, redesigns and ongoing support for independent businesses across the United States.',
                     'address': {'@type': 'PostalAddress', 'addressLocality': 'Holland',
                                 'addressRegion': 'Michigan', 'addressCountry': 'US'},
                     'areaServed': {'@type': 'Country', 'name': 'United States'}},
                    {'@type': 'WebSite', '@id': website_id, 'url': base, 'name': '17C Studio',
                     'publisher': {'@id': organization_id}, 'inLanguage': 'en-US'},
                ])
            page = {'@type': 'ContactPage' if path.name == 'form.html' else 'WebPage',
                    '@id': url + '#webpage', 'url': url, 'name': meta.title.strip(),
                    'description': meta.description, 'isPartOf': {'@id': website_id},
                    'about': {'@id': organization_id}, 'inLanguage': 'en-US'}
            if path.name == 'services.html':
                service_nodes = []
                for number, (name, description) in enumerate(SERVICES, 1):
                    service_url = url + f'#service-{number}'
                    service_nodes.append({'@type': 'Service', '@id': service_url,
                        'url': service_url, 'name': name, 'description': description,
                        'provider': {'@id': organization_id},
                        'areaServed': {'@type': 'Country', 'name': 'United States'}})
                page['mainEntity'] = [{'@id': node['@id']} for node in service_nodes]
                graph.extend(service_nodes)
            graph.append(page)
            data = {'@context': 'https://schema.org', '@graph': graph}
            tags.append('<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False).replace('<', '\\u003c') + '</script>')
        block = '\n  <!-- production-seo:start -->\n  ' + '\n  '.join(tags) + '\n  <!-- production-seo:end -->\n'
        path.write_text(source.replace('</head>', block + '</head>'))
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += ''.join(f'  <url><loc>{escape(url)}</loc></url>\n' for url in urls) + '</urlset>\n'
    (root / 'sitemap.xml').write_text(xml)
    (root / 'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: ' + urljoin(base, 'sitemap.xml') + '\n')
    print(f'Configured {len(urls)} indexable pages for {base}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--site-dir', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    url = urlsplit(args.base_url)
    if url.scheme != 'https' or not url.hostname or url.query or url.fragment or url.username or url.password:
        parser.error('Use a confirmed HTTPS URL without credentials, query parameters or fragments.')
    if url.hostname == 'localhost' or url.hostname.endswith(('.localhost', '.test', '.invalid')):
        parser.error('Development hosts cannot be used in production SEO.')
    try:
        ipaddress.ip_address(url.hostname)
    except ValueError:
        pass
    else:
        parser.error('Use a public hostname, not an IP address.')
    configure(args.base_url.rstrip('/') + '/', args.site_dir)
