#!/usr/bin/env python3
"""Validate static metadata, schema references and sitemap consistency locally."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://17c.studio/'
class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(); self.nodes=[]; self.schemas=[]; self.title=''; self.capture=None
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs); self.nodes.append((tag,attrs))
        if tag=='title': self.capture='title'
        if tag=='script' and attrs.get('type')=='application/ld+json': self.capture='schema'
    def handle_endtag(self, tag):
        if tag in ['title','script']: self.capture=None
    def handle_data(self, data):
        if self.capture=='title': self.title+=data
        if self.capture=='schema': self.schemas.append(json.loads(data))

issues=[]; titles=[]; descriptions=[]; expected=[]; definitions={}; references=[]
for path in sorted(ROOT.glob('*.html')):
    page=Page(path.read_text()); titles.append(page.title)
    metas={attrs.get('name',attrs.get('property')):attrs.get('content') for tag,attrs in page.nodes if tag=='meta'}
    description=metas.get('description'); descriptions.append(description)
    if not page.title or not description: issues.append(f'{path.name}: missing title/description')
    if sum(tag=='h1' for tag,_ in page.nodes)!=1: issues.append(f'{path.name}: expected one H1')
    canonical=[a['href'] for t,a in page.nodes if t=='link' and a.get('rel')=='canonical']
    url=BASE+('' if path.name=='index.html' else path.name)
    if canonical!=[url]: issues.append(f'{path.name}: canonical mismatch')
    required=['og:type','og:site_name','og:title','og:description','og:url','og:image','og:image:alt','twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:alt']
    for key in required:
        if not metas.get(key): issues.append(f'{path.name}: missing {key}')
        if sum(t=='meta' and a.get('name',a.get('property'))==key for t,a in page.nodes)!=1: issues.append(f'{path.name}: duplicate/missing {key}')
    if metas.get('og:title')!=page.title or metas.get('twitter:description')!=description: issues.append(f'{path.name}: social metadata mismatch')
    for key in ['og:url','og:image','twitter:image']:
        if not metas.get(key,'').startswith(BASE): issues.append(f'{path.name}: nonproduction {key}')
    if 'noindex' not in metas.get('robots',''):
        expected.append(url)
        if len(page.schemas)!=1: issues.append(f'{path.name}: expected one JSON-LD graph')
    elif page.schemas: issues.append(f'{path.name}: excluded page has schema')
    def walk(value):
        if isinstance(value,dict):
            if '@id' in value:
                if '@type' in value:
                    if value['@id'] in definitions: issues.append('Duplicate schema definition '+value['@id'])
                    definitions[value['@id']]=value
                else: references.append(value['@id'])
            if '@type' in value and value['@type'] not in ['Organization','WebSite','WebPage','ContactPage','Service','Country']: issues.append('Unexpected schema type')
            for key,item in value.items():
                if key in ['url','logo','@id'] and not item.startswith(BASE): issues.append('Schema URL outside production')
                walk(item)
        elif isinstance(value,list):
            for item in value: walk(item)
    for schema in page.schemas:
        if schema.get('@context')!='https://schema.org': issues.append('Invalid schema context')
        walk(schema)
for ref in references:
    if ref not in definitions: issues.append('Unresolved schema entity '+ref)
for entity in definitions.values():
    if entity['@type']=='Service':
        fragment=urlsplit(entity['url']).fragment
        if f'id="{fragment}"' not in (ROOT/'services.html').read_text(): issues.append('Missing service anchor '+fragment)
for field,values in [('title',titles),('description',descriptions)]:
    if len(set(values))!=len(values): issues.append('Duplicate '+field)
actual=[node.text for node in ET.parse(ROOT/'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
if sorted(actual)!=sorted(expected): issues.append('Sitemap differs from canonical indexable pages')
if 'Sitemap: '+BASE+'sitemap.xml' not in (ROOT/'robots.txt').read_text(): issues.append('Missing robots sitemap reference')
print(json.dumps({'pagesChecked':len(titles),'sitemapURLs':len(actual),'schemaEntities':len(definitions),'issues':issues},indent=2))
raise SystemExit(bool(issues))
