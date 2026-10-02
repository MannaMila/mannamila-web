"""Visible text of a page in reading order, one block per line. Usage: extract-text.py <file.html>"""
import re, sys
from html.parser import HTMLParser
INLINE = {'strong', 'em', 'a', 'span', 'b', 'i', 'time', 'small', 'abbr'}
class V(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=True); s.p = []; s.h = 0
    def handle_starttag(s, t, a):
        a = dict(a)
        if t in ('script', 'style', 'head', 'svg', 'iframe'): s.h += 1
        if s.h: return
        if t == 'img': s.p.append('\x00[Image: %s]\x00' % a.get('alt', '')); return
        if t in ('h1', 'h2', 'h3', 'summary'): s.p.append('\x00%s ' % {'h1': '#', 'h2': '##', 'h3': '###', 'summary': 'Q:'}[t]); return
        s.p.append(' ' if t in INLINE or t == 'br' else '\x00')
    def handle_endtag(s, t):
        if t in ('script', 'style', 'head', 'svg', 'iframe'): s.h -= 1; return
        if not s.h and t not in INLINE: s.p.append('\x00')
    def handle_data(s, d):
        if not s.h: s.p.append(d)
v = V(); v.feed(open(sys.argv[1], encoding='utf8').read())
for b in ''.join(v.p).split('\x00'):
    b = re.sub(r'\s+', ' ', b).strip(); b = re.sub(r' ([.,;:])', r'\1', b)
    if b and b not in ('#', '##', '###', 'Q:'): print(b)
