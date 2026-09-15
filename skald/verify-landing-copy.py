import json,hashlib,sys
from pathlib import Path
from html.parser import HTMLParser
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.ids=[];self.links=[];self.meta={};self.alts=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='a':self.links.append(a.get('href',''))
  if tag=='meta':self.meta[a.get('name',a.get('property'))]=a.get('content')
  if tag=='img':self.alts.append(a.get('alt'))
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
# The 2026-09-15 native-screenshot approval supersedes only the landing index hash of the 2026-09-13 registry, which stays as history.
r=Path(__file__).resolve().parent;review=r/"docs/store-web-2026-09-15-native";html=(r/'index.html').read_bytes();reg=json.loads((review/'review-registry.json').read_text())
assert reg['decision']=='APPROVED' and len({x['sessionId'] for x in reg['roles']})==3
assert sha(r/'index.html')==reg['approved_sha256']['resolved-index.html']==sha(review/'resolved-index.html')
for name,expected in reg['websiteFilesSha256'].items():assert sha(r/name)==expected,name
prior=json.loads((r/"docs/store-web-2026-09-13/content-review-registry.json").read_text());superseded=reg['supersession']['priorWebsiteRegistry']
assert prior['approved_sha256']['resolved-index.html']==superseded['supersededEntries']['approved_sha256.resolved-index.html'] and superseded['replacement']==sha(r/'index.html')
p=Page();p.feed(html.decode());assert len(p.ids)==len(set(p.ids));assert all(x[1:] in p.ids for x in p.links if x.startswith('#'))
assert 'Preview' in p.meta['description'];assert 'next' in p.meta['og:description'];assert any('com.mannamila.skald' in x for x in p.links);assert any('id6790579937' in x for x in p.links)
text=reg['websiteTextBindings'];assert text['retained_release_notice'] in html.decode()
assert p.meta['og:image']==p.meta['twitter:image']==text['og_and_twitter_image_url'] and p.meta['og:image:alt']==p.meta['twitter:image:alt']==text['og_and_twitter_image_alt']
assert all(text[key] in p.alts for key in ['hero_alt','greek_alt','map_alt','art_alt']) and text['art_caption'] in html.decode()
assert (r/'styles.css').exists() and (r/'assets/skald-odyssey-og.jpg').exists()
print('PASS: approved 7-file website hashes, superseded index history, unique section IDs, anchor targets, store links, preview notice and native image metadata')
