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
# The 2026-11-17 registry (Skald: the Greeks: new name, the Greek library section, the 0.8.1 figures and a new share card) supersedes the 2026-10-02 copy-3 registry, which supersedes copy-2, the 2026-10-02 landing-facts registry, and the two September registries.
r=Path(__file__).resolve().parent;review=r/"docs/landing-2026-11-17-greeks";html=(r/'index.html').read_bytes();reg=json.loads((review/'review-registry.json').read_text())
assert reg['decision']=='APPROVED' and len({x['sessionId'] for x in reg['roles']})==3
assert sha(r/'index.html')==reg['approved_sha256']['resolved-index.html']==sha(review/'resolved-index.html')
for name,expected in reg['websiteFilesSha256'].items():assert sha(r/name)==expected,name
priorPath=r/"docs/landing-2026-10-02-copy-3/review-registry.json";prior=json.loads(priorPath.read_text());superseded=reg['supersession']['priorWebsiteRegistry']
assert superseded['sha256']==sha(priorPath) and prior['approved_sha256']['resolved-index.html']==superseded['supersededEntries']['approved_sha256.resolved-index.html'] and superseded['replacement']==sha(r/'index.html')
for olderPath in ["docs/landing-2026-10-02-copy-2/review-registry.json","docs/landing-2026-10-02/review-registry.json","docs/store-web-2026-09-15-native/review-registry.json","docs/store-web-2026-09-13/content-review-registry.json"]:
 older=json.loads((r/olderPath).read_text());chain=prior['supersession']['priorWebsiteRegistry']
 assert older['approved_sha256']['resolved-index.html']==chain['supersededEntries']['approved_sha256.resolved-index.html'] and chain['replacement']==prior['approved_sha256']['resolved-index.html'],olderPath
 prior=older
p=Page();p.feed(html.decode());assert len(p.ids)==len(set(p.ids));assert all(x[1:] in p.ids for x in p.links if x.startswith('#'))
assert any('com.mannamila.skald' in x for x in p.links);assert any('id6790579937' in x for x in p.links)
text=reg['websiteTextBindings'];page=html.decode();app=(r/'app.js').read_text()
# The approved page retired the preview framing; it must not come back in the page or in app.js.
# The one approved exception is the email sign-up heading, which is about future news, not a version.
assert page.count(text['allowed_next_update_heading'])==1;scan=(page.replace(text['allowed_next_update_heading'],'')+app).lower()
for stale in text['forbidden_stale_framing']+['next update','coming in version','Preview the next','look up a person or place']:assert stale.lower() not in scan,stale
assert text['availability_sentence'] in page and text['availability_sentence'] in app
assert p.meta['og:image']==p.meta['twitter:image']==text['og_and_twitter_image_url'] and p.meta['og:image:alt']==p.meta['twitter:image:alt']==text['og_and_twitter_image_alt']
assert all(text[key] in p.alts for key in ['hero_alt','plate_alt','greek_alt','map_alt','art_alt']) and all(text[key] in page for key in ['hero_caption','plate_caption','art_caption'])
# The product is Skald: the Greeks. The old name may appear only where the page explains the rename.
assert p.meta['og:site_name']==text['product_name'] and text['product_name'] in page.split('<title>')[1].split('</title>')[0]
assert page.count(text['former_product_name'])==text['former_product_name_mentions'] and text['former_product_name'] not in app
get=(r/'get/index.html').read_text();assert text['product_name'] in get and text['former_product_name'] not in get
assert (r/'styles.css').exists() and (r/'assets/skald-odyssey-og.jpg').exists() and (r/'assets/skald-odyssey-og-0710.jpg').exists() and (r/'assets/skald-the-greeks-og.jpg').exists()
print('PASS: approved website hashes, supersession chain 2026-11-17 greeks -> 2026-10-02 copy-3 -> copy-2 -> 2026-10-02 -> 2026-09-15 -> 2026-09-13, unique section IDs, anchor targets, store links, no preview framing, availability sentence aligned with app.js, share card bindings, product name')
