"""Final-string parity: parses the "Final string table" of reviews/FINAL-ARBITRATION.md and checks that every
FINAL string is in the built file and that no LIVE string from the table remains.
Usage: python3 final-parity.py <mannamila-web root>"""
import re, sys, json, html, hashlib
from pathlib import Path
W = Path(sys.argv[1]); E = W / 'docs/landing-facts-0.7.10'
md = (E / 'reviews/FINAL-ARBITRATION.md').read_text(encoding='utf8')
table = md[md.index('## Final string table'):md.index('### Rows that depart from the candidate')]
FILES = {'### `/` (`skald/index.html`)': 'skald/index.html', '### `/app.js`': 'skald/app.js',
         '### `/availability.json`': 'skald/availability.json', '### `/get/` (`skald/get/index.html`)': 'skald/get/index.html'}
norm = lambda s: re.sub(r'\s+', ' ', html.unescape(s)).strip()
def clean(cell):
    cell = re.sub(r' ?\((source keeps|curly apostrophe kept|file `|element removed)[^)]*\)', lambda m: '' if not m.group(0).strip().startswith('(element removed') else m.group(0), cell)
    urls = re.findall(r'`(https?://[^`]+|\./app[^`]+|\d{4}-\d\d-\d\dT[^`]+)`', cell)
    return urls[0] if urls else cell.replace('`', '').strip()
rows = []; cur = None
for line in table.split('\n'):
    if line.strip() in FILES: cur = FILES[line.strip()]; continue
    if cur and line.startswith('| ') and not line.startswith('| #') and not line.startswith('| ---'):
        c = [x.strip() for x in line.strip('|').split('|')]
        rows.append({'file': cur, 'row': c[0], 'location': c[1].replace('`', ''), 'live': clean(c[2]), 'final': c[3], 'finalClean': clean(c[3])})
res = []; ok = True
for r in rows:
    raw = (W / r['file']).read_text(encoding='utf8')
    # Three views: the source, and the visible text with tags removed (joined, and spaced) for strings that span markup.
    views = [norm(raw), norm(re.sub(r'<[^>]+>', '', raw)), norm(re.sub(r'<[^>]+>', ' ', raw))]
    removed = r['final'].startswith('(element removed')
    # /get/ cells quote one sentence of a paragraph; '·' is &middot; in the source and unescapes the same.
    final_ok = True if removed else any(norm(r['finalClean']) in v for v in views)
    live_gone = all(norm(r['live']) not in v for v in views)
    ok &= final_ok and live_gone
    res.append({'file': r['file'], 'row': r['row'], 'location': r['location'], 'finalPresent': final_ok, 'liveAbsent': live_gone, 'removal': removed})
sha = lambda p: hashlib.sha256((W / p).read_bytes()).hexdigest()
exp = dict(re.findall(r'\| `(skald/[^`]+)` \| `([0-9a-f]{64})`', md[md.index('### Expected hashes'):md.index('## Social card')]))
hashes = {p: {'expected': h, 'actual': sha(p), 'match': sha(p) == h} for p, h in exp.items()}
idx = (W / 'skald/index.html').read_text(encoding='utf8'); app = (W / 'skald/app.js').read_text(encoding='utf8')
faq = re.search(r'<p data-availability-faq>(.*?)</p>', idx).group(1)
extra = {'staticFaqEqualsAppJsFaq': ('faq: "%s"' % faq) in app, 'noVersion070InIndex': '0.7.0' not in idx,
         'appJsCacheKey': re.findall(r'app\.js\?v=(\d+)', idx)}
ok &= all(h['match'] for h in hashes.values()) and extra['staticFaqEqualsAppJsFaq'] and extra['noVersion070InIndex']
rep = {'rowsChecked': len(res), 'finalStringsPresent': sum(r['finalPresent'] for r in res), 'liveStringsAbsent': sum(r['liveAbsent'] for r in res),
       'failures': [r for r in res if not (r['finalPresent'] and r['liveAbsent'])], 'expectedHashes': hashes, **extra, 'pass': bool(ok), 'rows': res}
(E / 'final-parity-report.json').write_text(json.dumps(rep, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
print(json.dumps({k: rep[k] for k in rep if k != 'rows'}, indent=1, ensure_ascii=False)); sys.exit(0 if ok else 1)
