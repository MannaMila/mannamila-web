import re, sys, html
def inline(s):
    s = s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s, flags=re.S)
    s = re.sub(r'\*(.+?)\*', r'<em>\1</em>', s, flags=re.S)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'(?<![">])(https://www\.edpb\.europa\.eu/[A-Za-z0-9_/\-]+)', r'<a href="\1">\1</a>', s)
    return s
def render(md):
    md = re.sub(r'^<!--.*?-->\n', '', md, flags=re.S)
    blocks = [b for b in re.split(r'\n{2,}', md.strip('\n'))]
    out=[]; first_p=True
    for b in blocks:
        if b.startswith('# '): out.append('<h1>%s</h1>'%inline(b[2:]))
        elif b.startswith('## '): out.append('<h2>%s</h2>'%inline(b[3:]))
        elif b.startswith('### '): out.append('<h3>%s</h3>'%inline(b[4:]))
        elif b.startswith('- '):
            items = re.split(r'\n(?=- )', b)
            out.append('<ul>\n'+'\n'.join('<li>%s</li>'%inline(i[2:]) for i in items)+'\n</ul>')
        else:
            t = inline(b)
            if first_p:
                t = t.replace('  \n','<br>\n'); out.append('<p class="meta">%s</p>'%t); first_p=False
            else: out.append('<p>%s</p>'%t)
    return '\n'.join(out)
if __name__=='__main__':
    md, page, endmark, outp = sys.argv[1:5]
    body = render(open(md,encoding='utf8').read())
    h = open(page,encoding='utf8').read()
    a = h.index('<h1>'); z = h.index(endmark)
    open(outp,'w',encoding='utf8').write(h[:a]+body+'\n'+h[z:])
