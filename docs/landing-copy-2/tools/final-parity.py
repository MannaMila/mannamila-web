"""Final-string parity for copy round 2. Parses the final string table and the "Every replaced sentence" table of
reviews/FINAL-ARBITRATION.md: every FINAL string must be on the built page, every replaced live string gone.
Usage: python3 final-parity.py <mannamila-web root>"""
import re, sys, json, html, hashlib
from pathlib import Path
W = Path(sys.argv[1]); E = W / 'docs/landing-copy-2'
md = (E / 'reviews/FINAL-ARBITRATION.md').read_text(encoding='utf8')
raw = (W / 'skald/index.html').read_text(encoding='utf8')
norm = lambda s: re.sub(r'\s+', ' ', html.unescape(s)).strip()
page = norm(re.sub(r'<[^>]+>', ' ', raw)); page = re.sub(r' ([.,;:])', r'\1', page)
frag = lambda cell: norm(cell.replace('`', '')).strip('…').strip()
def rows(start, end):
    out = []
    for line in md[md.index(start):md.index(end)].split('\n'):
        if line.startswith('| ') and not line.startswith('| ---') and not line.startswith('| #') and not line.startswith('| Where'):
            out.append([x.strip() for x in line.strip('|').split('|')])
    return out
final = [{'row': c[0], 'location': c[1].replace('`', ''), 'final': frag(c[3]), 'present': frag(c[3]) in page} for c in rows('## Final string table', "### `/app.js`, `/get/`, metas")]
gone = [{'where': c[0], 'live': frag(c[1]), 'absent': frag(c[1]) not in page} for c in rows('### Every replaced sentence that named the Greek word help', '### Expected hash')]
extra_gone = ['beside a telling or translation', 'Homeric lexicon', 'Greek glossary', 'glossary', 'Choose Parallel to read two translations together.', 'The 24 translations cover 11 languages.', '070-native']
extra = {s: (s not in page and s not in raw) for s in extra_gone}
sha = lambda p: hashlib.sha256((W / p).read_bytes()).hexdigest()
counts = {'word card': page.count('word card'), 'a Homeric dictionary': page.count('a Homeric dictionary'), 'glossary': page.lower().count('glossary'), 'lexicon': page.lower().count('lexicon')}
figures = {n: (n in page) for n in ['24 translations', '11 languages', '3,285', '258', '236', '52 journal articles', 'For 40 of them', '48 museums']}
unchanged = {'skald/app.js': sha('skald/app.js') == 'c07ce27bbe0476577ea8dfad7490732f15d32b859ef75f0866acc020efd5c899', 'skald/get/index.html': sha('skald/get/index.html') == '09ced3b5ec6f4eb5c9dd6978832358266096a64e94dc74c8ba2a13318d7d2434'}
ok = all(r['present'] for r in final) and all(r['absent'] for r in gone) and all(extra.values()) and all(figures.values()) and all(unchanged.values())
rep = {'finalRows': len(final), 'finalStringsPresent': sum(r['present'] for r in final), 'replacedLiveStrings': len(gone), 'replacedLiveStringsAbsent': sum(r['absent'] for r in gone),
       'otherRetiredStringsAbsent': extra, 'nameCounts': counts, 'figuresStillPresent': figures, 'unchangedFiles': unchanged, 'indexSha256': sha('skald/index.html'), 'pass': bool(ok), 'final': final, 'gone': gone}
(E / 'final-parity-report.json').write_text(json.dumps(rep, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
print(json.dumps({k: rep[k] for k in rep if k not in ('final', 'gone')}, indent=1, ensure_ascii=False)); sys.exit(0 if ok else 1)
