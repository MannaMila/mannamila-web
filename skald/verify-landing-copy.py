import json,hashlib,sys
from pathlib import Path
from html.parser import HTMLParser
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.ids=[];self.links=[];self.meta={}
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='a':self.links.append(a.get('href',''))
  if tag=='meta':self.meta[a.get('name',a.get('property'))]=a.get('content')
r=Path(__file__).resolve().parent;review=r/"docs/store-web-2026-09-13";html=(r/'index.html').read_bytes();reg=json.loads((review/'content-review-registry.json').read_text())
assert hashlib.sha256(html).hexdigest()==reg['approved_sha256']['resolved-index.html']
p=Page();p.feed(html.decode());assert len(p.ids)==len(set(p.ids));assert all(x[1:] in p.ids for x in p.links if x.startswith('#'))
assert 'Preview' in p.meta['description'];assert 'next' in p.meta['og:description'];assert any('com.mannamila.skald' in x for x in p.links);assert any('id6790579937' in x for x in p.links)
assert (r/'styles.css').exists();print('PASS: reviewed website hash, unique section IDs, anchor targets, store links and preview metadata')
