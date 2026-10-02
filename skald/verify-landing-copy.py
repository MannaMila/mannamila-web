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
# The 2026-10-02 landing corrections (0.7.10) supersede the landing index hash and text bindings of the 2026-09-15 native-screenshot registry, which superseded the 2026-09-13 one. Both stay as history.
r=Path(__file__).resolve().parent;review=r/"docs/landing-2026-10-02";html=(r/'index.html').read_bytes();reg=json.loads((review/'review-registry.json').read_text())
assert reg['decision']=='APPROVED' and len({x['sessionId'] for x in reg['roles']})==3
assert sha(r/'index.html')==reg['approved_sha256']['resolved-index.html']==sha(review/'resolved-index.html')
for name,expected in reg['websiteFilesSha256'].items():assert sha(r/name)==expected,name
priorPath=r/"docs/store-web-2026-09-15-native/review-registry.json";prior=json.loads(priorPath.read_text());superseded=reg['supersession']['priorWebsiteRegistry']
assert superseded['sha256']==sha(priorPath) and prior['approved_sha256']['resolved-index.html']==superseded['supersededEntries']['approved_sha256.resolved-index.html'] and superseded['replacement']==sha(r/'index.html')
older=json.loads((r/"docs/store-web-2026-09-13/content-review-registry.json").read_text());chain=prior['supersession']['priorWebsiteRegistry']
assert older['approved_sha256']['resolved-index.html']==chain['supersededEntries']['approved_sha256.resolved-index.html'] and chain['replacement']==prior['approved_sha256']['resolved-index.html']
p=Page();p.feed(html.decode());assert len(p.ids)==len(set(p.ids));assert all(x[1:] in p.ids for x in p.links if x.startswith('#'))
assert any('com.mannamila.skald' in x for x in p.links);assert any('id6790579937' in x for x in p.links)
text=reg['websiteTextBindings']
# The approved page retired the preview framing; it must not come back in the page or in app.js.
# The one approved exception is the email sign-up heading, which is about future news, not a version.
assert html.decode().count(text['allowed_next_update_heading'])==1;scan=(html.decode().replace(text['allowed_next_update_heading'],'')+(r/'app.js').read_text()).lower()
for stale in text['forbidden_stale_framing']+['next update','coming in version','Preview the next']:assert stale.lower() not in scan,stale
assert text['availability_sentence'] in html.decode() and text['availability_sentence'] in (r/'app.js').read_text()
assert p.meta['og:image']==p.meta['twitter:image']==text['og_and_twitter_image_url'] and p.meta['og:image:alt']==p.meta['twitter:image:alt']==text['og_and_twitter_image_alt']
assert all(text[key] in p.alts for key in ['hero_alt','greek_alt','map_alt','art_alt']) and text['art_caption'] in html.decode()
assert (r/'styles.css').exists() and (r/'assets/skald-odyssey-og.jpg').exists()
print('PASS: approved website hashes, supersession chain 2026-10-02 -> 2026-09-15 -> 2026-09-13, unique section IDs, anchor targets, store links, no preview framing, availability sentence and image metadata')
