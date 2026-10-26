#!/usr/bin/env python3
"""Dependency-free static launch checks. Does not send forms or crawl external sites."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from collections import Counter
import re,json
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self,path):
  super().__init__();self.path=path;self.nodes=[];self.feed(path.read_text())
 def handle_starttag(self,tag,attrs):self.nodes.append((tag,dict(attrs)))
pages={p.name:Page(p) for p in ROOT.glob('*.html')}
issues=[];count=0
for name,page in pages.items():
 ids=[a['id'] for _,a in page.nodes if 'id' in a]
 for id,n in Counter(ids).items():
  if n>1:issues.append(f'{name}: duplicate ID {id}')
 if any(tag=='script' and a.get('src','').split('?')[0]=='wishlist.js' for tag,a in page.nodes) and 'wishlist-form' in ids:
  for required in ['wishlist-form','wishlist-panel','wishlist-floating','wishlist-include','wishlist-review','wishlist-option-note','wishlist-storage-note','wishlist-close','wishlist-panel-summary','wishlist-inquiry-link']:
   if required not in ids:issues.append(f'{name}: missing wishlist control {required}')
 for tag,a in page.nodes:
  if tag=='img' and 'alt' not in a:issues.append(f'{name}: image missing alt')
  for key in ['aria-controls','aria-describedby','aria-labelledby']:
   for id in a.get(key,'').split():
    if id not in ids:issues.append(f'{name}: missing {key} target {id}')
  refs=[a[k] for k in ['src','href','poster'] if k in a]
  refs += [v.strip().split()[0] for v in a.get('srcset','').split(',') if v.strip()]
  for ref in refs:
   u=urlsplit(ref)
   if u.scheme or u.netloc:continue
   target=unquote(u.path) or name
   if target.endswith('/'):target+='index.html'
   if target.startswith('/'):target=target.lstrip('/')
   file=ROOT/target
   count+=1
   if not file.is_file():issues.append(f'{name}: missing local file {target}')
   if u.fragment and file.name in pages:
    target_ids={a.get('id') for _,a in pages[file.name].nodes}
    if u.fragment not in target_ids:issues.append(f'{name}: missing anchor {ref}')
  if tag=='form' and a.get('id')=='wishlist-form' and not a.get('action','').startswith('https://'):
   issues.append(f'{name}: inquiry action must use HTTPS')
 for host in ['localhost','127.0.0.1','0.0.0.0']:
  if re.search(r'https?://'+re.escape(host),page.path.read_text()):issues.append(f'{name}: development URL')
for css in ROOT.glob('*.css'):
 for ref in re.findall(r'url\([\'"]?([^\)\'"\s]+)',css.read_text()):
  u=urlsplit(ref)
  if u.scheme or u.netloc or ref.startswith(('#', '%23')):continue
  if not (css.parent/unquote(u.path)).is_file():issues.append(f'{css.name}: missing asset {ref}')
result={'htmlPages':len(pages),'localReferencesChecked':count,'issues':issues}
print(json.dumps(result,indent=2))
raise SystemExit(bool(issues))
