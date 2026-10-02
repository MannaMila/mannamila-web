import re, sys, json, hashlib, subprocess
from html.parser import HTMLParser
from pathlib import Path
W=Path('/Volumes/Dev/Code/mannamila-web-eu27'); S=Path('/Volumes/Dev/Code/skald-wt-euprivacy')
INLINE={'strong','em','code','a','b','i','span'}
class Vis(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.parts=[]; s.hidden=0
    def handle_starttag(s,t,a):
        if t in('script','style','head'): s.hidden+=1
        if not s.hidden and t not in INLINE: s.parts.append('\x00' if t!='br' else ' ')
    def handle_endtag(s,t):
        if t in('script','style','head') and s.hidden: s.hidden-=1
        if not s.hidden and t not in INLINE: s.parts.append('\x00')
    def handle_data(s,d):
        if not s.hidden: s.parts.append(d)
ws=lambda t: re.sub(r'[ \t\r\n]+',' ',t).strip()   # keeps U+00A0 distinct
def page_blocks(p):
    v=Vis(); v.feed(p.read_text(encoding='utf8'))
    return [b for b in (ws(x) for x in ''.join(v.parts).split('\x00')) if b]
def md_plain(t):
    t=re.sub(r'^<!--.*?-->\n','',t,flags=re.S)
    t=re.sub(r'\[([^\]]+)\]\([^)]+\)',r'\1',t); t=re.sub(r'\*\*(.+?)\*\*',r'\1',t,flags=re.S)
    t=re.sub(r'\*(.+?)\*',r'\1',t,flags=re.S); t=t.replace('`','')
    out=[]
    for b in re.split(r'\n{2,}',t.strip('\n')):
        b=re.sub(r'^#{1,3} ','',b)
        if b.startswith('- '): out+= [ws(i[2:]) for i in re.split(r'\n(?=- )',b)]
        else: out.append(ws(b))
    return out
def sentences(blocks):
    s=[]
    for b in blocks: s+= [x for x in re.split(r'(?<=[.?!])\s+(?=[A-ZÀ-ÖØ-Þ«“])',b) if x]
    return s
def links(t): return re.findall(r'\]\((https?://[^)]+)\)',t)
MARK=re.search(r'for marker in \\\n(.*?)\ndo\n',(S/'scripts/verify_hosted_privacy_policy.sh').read_text(),re.S).group(1)
MARKERS=[m.strip().rstrip('\\').strip()[1:-1] for m in MARK.split('\n')]
class Gate(HTMLParser):   # verbatim logic of verify_hosted_privacy_policy.sh
    def __init__(s):
        super().__init__(convert_charrefs=True); s.parts=[]; s.hidden=0
    def handle_starttag(s,t,a):
        if t in('script','style','head'): s.hidden+=1
        if not s.hidden: s.parts.append(' ')
    def handle_endtag(s,t):
        if t in('script','style','head') and s.hidden: s.hidden-=1
        if not s.hidden: s.parts.append(' ')
    def handle_data(s,d):
        if not s.hidden: s.parts.append(d)
def gate(p):
    g=Gate(); raw=p.read_text(); g.feed(raw); n=' '.join(''.join(g.parts).replace('`','').split()).lower()
    res={m: (' '.join(m.split()).lower() in n) for m in MARKERS}
    return res, bool(re.search(r'\{\{[^}]+\}\}',raw))
sha=lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
CH={'en':(['English version · Version française','MannaMila LLC'],['← Skald: Odyssey Product updates privacy Support']),
    'fr':(['English version · Version française','MannaMila LLC'],['Skald · English version'])}
SRC={'en':S/'docs/legal/privacy-policy.md','fr':S/'docs/sessions/2026-10-02-eu-activation-privacy/french-resolved/privacy-policy.fr.md'}
PG={'en':W/'skald/privacy/index.html','fr':W/'skald/privacy/fr/index.html'}
rep={'renderedAt':'2026-10-02','verificationStage':'pre-publication','storeUploads':0,'languages':{}}
ok=True
for l in('en','fr'):
    mdt=SRC[l].read_text(encoding='utf8'); mb=md_plain(mdt); pb=page_blocks(PG[l]); pre,post=CH[l]
    body=pb[len(pre):len(pb)-len(post)]
    chrome_ok = pb[:len(pre)]==pre and pb[len(pb)-len(post):]==post
    ptext=' '.join(body); ms=sentences(mb); ps=sentences(body)
    missing=[s for s in ms if s not in ptext]; extra=[s for s in ps if s not in ' '.join(mb)]
    html=PG[l].read_text(encoding='utf8')
    hl=re.findall(r'<a href="(https?://[^"]+)"',html)
    r={'source':str(SRC[l].relative_to(S)),'sourceSha256':sha(SRC[l]),'page':str(PG[l].relative_to(W)),'htmlSha256':sha(PG[l]),
       'sourceBlocks':len(mb),'pageBodyBlocks':len(body),'blocksIdenticalInOrder':mb==body,
       'sourceSentences':len(ms),'pageBodySentences':len(ps),'sentencesMissingFromPage':missing,'sentencesOnPageNotInSource':extra,
       'visibleWords':len(ptext.split()),'navigationChrome':pre+post,'navigationChromeIsOnlyExtraText':chrome_ok,
       'sourceLinkTargets':links(mdt),'pageExternalLinkTargets':hl,
       'nbspU00A0InSource':mdt.count(' '),'nbspU00A0InPageBody':ptext.count(' '),'nbspEntityInPage':html.count('&nbsp;'),
       'scriptTags':re.findall(r'<script[^>]*></script>',html),
       'htmlLang':re.search(r'<html lang="([^"]+)"',html).group(1),'relCanonical':re.search(r'rel="canonical" href="([^"]+)"',html).group(1),
       'hreflang':re.findall(r'hreflang="([^"]+)" href="([^"]+)"',html)}
    ok &= mb==body and not missing and not extra and chrome_ok
    rep['languages'][l]=r
hm=S/'docs/sessions/2026-07-31-phase1-prep/hosted-privacy-policy-proposed.md'
rep['languages']['en']['hostedMirror']={'path':str(hm.relative_to(S)),'sha256':sha(hm),'bodyIdenticalToSourceAfterPreamble':re.sub(r'^<!--.*?-->\n','',hm.read_text(),flags=re.S)==SRC['en'].read_text()}
ok &= rep['languages']['en']['hostedMirror']['bodyIdenticalToSourceAfterPreamble']
res,ph=gate(PG['en'])
rep['appRepoHostedPolicyGate']={'script':'MannaMila/skald scripts/verify_hosted_privacy_policy.sh on legal/eu-privacy-0.7.10 ('+subprocess.check_output(['git','-C',str(S),'rev-parse','--short','HEAD'],text=True).strip()+')','markers':res,'allPass':all(res.values()),'unresolvedPlaceholder':ph}
ok &= all(res.values()) and not ph
rep['allChecksPass']=bool(ok)
(W/'docs/privacy-0.7.10-eu27').mkdir(exist_ok=True)
(W/'docs/privacy-0.7.10-eu27/parity-report.json').write_text(json.dumps(rep,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for l in('en','fr'):
    r=rep['languages'][l]; print(l,{k:r[k] for k in('sourceBlocks','pageBodyBlocks','blocksIdenticalInOrder','sourceSentences','pageBodySentences','sentencesMissingFromPage','sentencesOnPageNotInSource','visibleWords','navigationChromeIsOnlyExtraText','nbspU00A0InSource','nbspU00A0InPageBody','htmlLang','relCanonical','hreflang')})
    print(' links equal', [x for x in r['pageExternalLinkTargets'] if 'edpb' not in x]==r['sourceLinkTargets'])
print(rep['languages']['en']['hostedMirror']); print(len(res),'markers; failing:',[m for m,v in res.items() if not v],'placeholder',ph,'ALL',ok)
