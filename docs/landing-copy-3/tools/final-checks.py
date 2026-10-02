"""Round 3 final checks: sentence parity, share-card bytes served, link-preview resolution.
Usage: python3 final-checks.py <mannamila-web root> <generated card jpg>"""
import re, sys, json, html, hashlib, subprocess, time, struct, urllib.request
from pathlib import Path
W = Path(sys.argv[1]); GEN = Path(sys.argv[2]); E = W / 'docs/landing-copy-3'
raw = (W / 'skald/index.html').read_text(encoding='utf8'); app = (W / 'skald/app.js').read_text(encoding='utf8'); get = (W / 'skald/get/index.html').read_text(encoding='utf8')
page = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', raw)))
FINAL = 'Follow the voyage on the map and see what happens to the fleet.'
gone = ['look up a person or place', 'when you need a reminder', 'tap a stop', 'tap a place', 'skald-odyssey-og-20261003', 'skald-odyssey-og-20261002.jpg?v']
parity = {'finalSentencePresentOnce': page.count(FINAL) == 1, 'absent': {s: all(s not in t for t in (raw, app, get)) for s in gone},
          'nextSentenceUnchanged': 'Open a map or note, spend a little time with it, and return to your passage.' in page}
sha = lambda b: hashlib.sha256(b).hexdigest()
def jpeg_size(b):
    i = 2
    while i < len(b):
        m = b[i + 1]; n = struct.unpack('>H', b[i + 2:i + 4])[0]
        if m in (0xC0, 0xC1, 0xC2): return list(struct.unpack('>HH', b[i + 5:i + 9]))[::-1]
        i += 2 + n
srv = subprocess.Popen(['python3', '-m', 'http.server', '8765', '--bind', '127.0.0.1', '--directory', str(W / 'skald')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
try:
    doc = urllib.request.urlopen('http://127.0.0.1:8765/').read().decode()
    meta = dict(re.findall(r'<meta (?:property|name)="((?:og|twitter):[a-z:]+)" content="([^"]*)"', doc))
    og = meta['og:image']; local = og.replace('https://skald.mannamila.com', 'http://127.0.0.1:8765')
    r = urllib.request.urlopen(local); body = r.read()
    card = {'ogImage': og, 'twitterImageSame': meta['twitter:image'] == og, 'fetchedFrom': local, 'status': r.status, 'contentType': r.headers.get('Content-Type'),
            'pixelSize': jpeg_size(body), 'declared': [int(meta['og:image:width']), int(meta['og:image:height'])], 'bytes': len(body),
            'servedSha256': sha(body), 'generatedSha256': sha(GEN.read_bytes()), 'servedEqualsGenerated': sha(body) == sha(GEN.read_bytes()),
            'alt': meta['og:image:alt'], 'twitterAltSame': meta['twitter:image:alt'] == meta['og:image:alt'], 'twitterCard': meta['twitter:card'],
            'olderCardsKept': [(W / 'skald/assets' / n).exists() for n in ('skald-odyssey-og-070.jpg', 'skald-odyssey-og-20261002.jpg', 'skald-odyssey-og.jpg')]}
finally: srv.terminate()
ok = parity['finalSentencePresentOnce'] and all(parity['absent'].values()) and parity['nextSentenceUnchanged'] and card['status'] == 200 and card['pixelSize'] == card['declared'] == [1200, 630] and card['servedEqualsGenerated'] and card['twitterImageSame'] and all(card['olderCardsKept'])
rep = {'parity': parity, 'shareCard': card, 'indexSha256': sha((W / 'skald/index.html').read_bytes()), 'pass': bool(ok),
       'note': 'The card is fetched from a local static server at the path the og:image URL names; the live URL does not exist until the deploy PR is merged.'}
(E / 'final-checks.json').write_text(json.dumps(rep, indent=2, ensure_ascii=False) + '\n'); print(json.dumps(rep, indent=1)); sys.exit(0 if ok else 1)
