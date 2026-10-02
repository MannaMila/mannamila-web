"""Text parity: the 0.7.10 post on skald/updates/index.html against the resolved brief (variant B).

Usage: python3 parity.py <mannamila-web root> <app-repo worktree holding the brief>
Adapted from docs/privacy-0.7.10-eu27/tools/parity.py (privacy precedent).
"""
import re, sys, json, hashlib
from html.parser import HTMLParser
from pathlib import Path
W = Path(sys.argv[1]); A = Path(sys.argv[2])
BRIEF = A / 'docs/marketing/updates/2026-10-02-release-0.7.10.md'
PAGE = W / 'skald/updates/index.html'
POST_ID = '2026-10-02'
INLINE = {'strong', 'em', 'a', 'span', 'time'}
ws = lambda t: re.sub(r'\s+', ' ', t).strip()
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

class Post(HTMLParser):
    """Collects the visible text blocks of one <article>, with captions, alts and links kept apart."""
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.depth = 0; s.parts = []; s.cap = []; s.in_cap = 0; s.alts = []; s.imgs = []; s.links = []; s.href = None; s.tags = []; s.aria = []
    def handle_starttag(s, t, a):
        a = dict(a)
        if t == 'article' and a.get('id') == POST_ID: s.depth = 1; return
        if not s.depth: return
        if t == 'article': s.depth += 1
        s.tags.append(t)
        if t == 'img': s.alts.append(a.get('alt')); s.imgs.append(a)
        if a.get('aria-label'): s.aria.append(a['aria-label'])
        if t == 'a': s.href = a.get('href'); s.links.append([a.get('href'), a.get('class'), ''])
        if t == 'figcaption': s.in_cap = 1; s.cap.append([])
        tgt = s.cap[-1] if s.in_cap else s.parts
        if t == 'br' or (s.in_cap and t == 'span'): tgt.append('\x00')
        elif t not in INLINE: tgt.append('\x00')
    def handle_endtag(s, t):
        if not s.depth: return
        if t == 'article':
            s.depth -= 1; return
        if t == 'a': s.href = None
        if t == 'figcaption': s.in_cap = 0; return
        (s.cap[-1] if s.in_cap else s.parts).append('\x00' if (t not in INLINE or (s.in_cap and t == 'span')) else '')
    def handle_data(s, d):
        if not s.depth: return
        (s.cap[-1] if s.in_cap else s.parts).append(d)
        if s.href is not None: s.links[-1][2] += d
blocks = lambda parts: [b for b in (ws(x) for x in ''.join(parts).split('\x00')) if b]
sentences = lambda bl: [x for b in bl for x in re.split(r'(?<=[.?!”])\s+(?=[A-Z“])', b) if x]

md = BRIEF.read_text(encoding='utf8')
def quoted(text):
    out = []
    for para in re.split(r'\n>\s*\n', '\n'.join(l for l in text.strip('\n').split('\n') if l.lstrip().startswith('>'))):
        p = ws(re.sub(r'^\s*> ?', '', para, flags=re.M))
        p = re.sub(r'^### ', '', p); p = re.sub(r'\*\*(.+?)\*\*', r'\1', p); p = re.sub(r'\*(.+?)\*', r'\1', p)
        out.append(p)
    return out
body_b = quoted(re.search(r'<!-- copy:body-b:start -->\n(.*?)<!-- copy:body-b:end -->', md, re.S).group(1))
headline = quoted(re.search(r'\nHeadline:\n\n(.*?)\n\n', md, re.S).group(1))[0]
og = quoted(re.search(r'everything since launch\.":\n\n(.*?)\n\n', md, re.S).group(1))[0]
alts = [quoted(x)[0] for x in re.findall(r'- Alt text:\n\n(.*?)\n\n', md, re.S)]
caps = [quoted(x)[0] for x in re.findall(r'- Caption[^\n]*:\n\n(.*?)\n\n', md, re.S)]
assets = re.findall(r'^\| `([^`]+\.webp)` \| (\d+)×(\d+) \| ([\d,]+) \| `([0-9a-f]{64})` \|', md, re.M)

html = PAGE.read_text(encoding='utf8')
v = Post(); v.feed(html)
pb = blocks(v.parts)
date_line, page_headline, page_body = pb[0], pb[1], pb[2:]
page_body = [b for b in page_body if b not in ('←', '→')]          # the carousel's two arrow buttons
page_caps = [' '.join(blocks(c)) for c in v.cap]
ms, ps = sentences(body_b), sentences(page_body)
img = []
for (name, w, h, size, digest), a in zip(assets, v.imgs):
    f = W / 'skald/updates' / a['src']
    img.append({'file': a['src'], 'sha256': sha(f), 'sha256MatchesBrief': sha(f) == digest, 'bytes': f.stat().st_size,
                'bytesMatchBrief': f.stat().st_size == int(size.replace(',', '')),
                'identicalToAppRepoAsset': f.read_bytes() == (A / 'core/src/main/assets/images/odyssey/artifacts' / name).read_bytes(),
                'widthHeightAttrs': [a.get('width'), a.get('height')], 'attrsMatchBrief': [a.get('width'), a.get('height')] == [w, h],
                'loading': a.get('loading'), 'nameMatches': a['src'].endswith(name)})
EXPECT_LINKS = [['https://apps.apple.com/app/id6790579937', 'text-link', 'App Store'],
                ['https://play.google.com/store/apps/details?id=com.mannamila.skald', 'text-link', 'Google Play']]
first_article = re.search(r'<article class="post" id="([^"]+)"', html).group(1)
rep = {
    'brief': str(BRIEF.relative_to(A)), 'briefSha256': sha(BRIEF), 'page': str(PAGE.relative_to(W)), 'pageSha256': sha(PAGE),
    'variant': 'B', 'postIsFirstArticle': first_article == POST_ID,
    'dateLine': date_line, 'dateTriplet': {'articleId': POST_ID, 'timeDatetime': re.search(r'<article class="post" id="%s".*?<time datetime="([^"]+)"' % POST_ID, html, re.S).group(1), 'visible': date_line},
    'headlineIdentical': page_headline == headline,
    'briefBlocks': len(body_b), 'pageBlocks': len(page_body), 'blocksIdenticalInOrder': body_b == page_body,
    'briefSentences': len(ms), 'pageSentences': len(ps), 'sentencesIdenticalInOrder': ms == ps,
    'sentencesMissingFromPage': [s for s in ms if s not in ps], 'sentencesOnPageNotInBrief': [s for s in ps if s not in ms],
    'bodyWords': len(' '.join(page_body).split()),
    'altTextsIdentical': v.alts == alts, 'captionsIdentical': page_caps == [ws(c) for c in caps], 'captions': page_caps,
    'ariaLabels': v.aria, 'links': v.links, 'linksAsBrief': v.links == EXPECT_LINKS,
    'ogDescriptionIdentical': re.search(r'og:description" content="([^"]+)"', html).group(1) == og,
    'titleUnchanged': '<title>Updates — Skald: Odyssey</title>' in html,
    'scriptOrIframeInsidePost': [t for t in v.tags if t in ('script', 'iframe', 'link', 'style')],
    'pageScriptSrcs': re.findall(r'<script[^>]*src="([^"]+)"', html),
    'images': img,
}
ok = (rep['postIsFirstArticle'] and rep['headlineIdentical'] and rep['blocksIdenticalInOrder'] and rep['sentencesIdenticalInOrder']
      and rep['altTextsIdentical'] and rep['captionsIdentical'] and rep['linksAsBrief'] and rep['ogDescriptionIdentical'] and rep['titleUnchanged']
      and not rep['scriptOrIframeInsidePost'] and len(img) == 2
      and all(i['sha256MatchesBrief'] and i['bytesMatchBrief'] and i['identicalToAppRepoAsset'] and i['attrsMatchBrief'] and i['loading'] == 'lazy' for i in img))
rep['pass'] = ok
(W / 'docs/updates-0.7.10/parity-report.json').write_text(json.dumps(rep, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
print(json.dumps({k: rep[k] for k in rep if k not in ('captions', 'images')}, indent=1, ensure_ascii=False))
sys.exit(0 if ok else 1)
