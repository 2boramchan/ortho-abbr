import pdfplumber,sys,json
pdf=pdfplumber.open(sys.argv[1])
# (page index, [ (abbr_x0, full_x0, end_x) for left, right ])
cols={8:[(0,170,420),(420,480,900)],9:[(0,140,405),(405,495,900)],10:[(0,140,415),(415,480,900)]}
out=[]
for pn,halves in cols.items():
    p=pdf.pages[pn]
    ws=[w for w in p.extract_words(extra_attrs=["size"]) if w['top']>95 and w['text'] not in('정형외과','약어')]
    for a0,f0,end in halves:
        ab=[w for w in ws if a0<=w['x0']<f0-2]
        fu=[w for w in ws if f0-2<=w['x0']<end]
        rows=[]
        for w in sorted(fu,key=lambda w:(w['top'],w['x0'])):
            if rows and abs(rows[-1]['top']-w['top'])<3: rows[-1]['f'].append(w)
            else: rows.append({'top':w['top'],'f':[w],'a':[]})
        for w in ab:
            r=min(rows,key=lambda r:abs(r['top']-w['top']))
            r['a'].append(w)
        for r in rows:
            a=' '.join(x['text'] for x in sorted(r['a'],key=lambda w:(round(w['top']),w['x0'])))
            f=' '.join(x['text'] for x in sorted(r['f'],key=lambda w:w['x0']))
            out.append({'page':pn+1,'abbr':a,'full':f,'sizes':sorted({round(x['size'],1) for x in r['f']})})
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False,indent=0)
for o in out: print(o['page'],'|',o['abbr'],'|',o['full'], o['sizes'] if len(o['sizes'])>1 else '')
print(len(out))
