"""Every href on / and /get/: external links fetched, site-relative links fetched from the live site
(some routes exist only in the deploy mirror) and checked in the source tree, #anchors checked against ids.
Usage: python3 link-check.py <mannamila-web root>"""
import re, sys, json, subprocess
from pathlib import Path
from urllib.parse import urljoin
W = Path(sys.argv[1]); out = []
for page, base in (('skald/index.html', 'https://skald.mannamila.com/'), ('skald/get/index.html', 'https://skald.mannamila.com/get/')):
    t = (W / page).read_text(encoding='utf8'); ids = set(re.findall(r'\bid="([^"]+)"', t))
    for h in dict.fromkeys(re.findall(r'<a\b[^>]*\bhref="([^"]+)"', t)):
        h = h.replace('&amp;', '&')
        if h.startswith('#'): out.append({'page': page, 'href': h, 'kind': 'anchor', 'ok': h[1:] in ids}); continue
        if h.startswith('mailto:'): out.append({'page': page, 'href': h, 'kind': 'mailto', 'ok': True}); continue
        url = urljoin(base, h)
        r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-L', '-A', 'Mozilla/5.0', '--max-time', '30', '-w', '%{http_code} %{url_effective}', url], capture_output=True, text=True).stdout.split(' ', 1)
        e = {'page': page, 'href': h, 'kind': 'external' if h.startswith('http') else 'site', 'status': r[0], 'final': r[1] if len(r) > 1 else '', 'ok': r[0] == '200'}
        if e['kind'] == 'site':
            p = (W / page).parent / h.split('#')[0].split('?')[0]
            e['inSourceTree'] = (p / 'index.html').exists() or p.is_file()
        out.append(e)
rep = {'checked': len(out), 'ok': sum(e['ok'] for e in out), 'failures': [e for e in out if not e['ok']],
       'siteLinksNotInSourceTree': [e['href'] for e in out if e.get('inSourceTree') is False], 'links': out}
(W / 'docs/landing-copy-3/link-check.json').write_text(json.dumps(rep, indent=2) + '\n')
print(json.dumps({k: rep[k] for k in rep if k != 'links'}, indent=1))
