import json, re, zipfile, hashlib
from pathlib import Path
from xml.etree import ElementTree as E

source = Path(r'C:\Users\Mayn\Downloads\Relationship_Reading_V2_Game_Design.docx')
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
root = E.fromstring(zipfile.ZipFile(source).read('word/document.xml'))
def text(node):
    return '\n'.join(''.join(('\n' if t.tag.endswith('}br') else t.text or '') for t in p.iter() if t.tag.endswith(('}t','}br'))) for p in node.findall('.//w:p', ns))
rows = []
for table in root.findall('.//w:tbl', ns):
    for row in table.findall('w:tr', ns):
        cells = [text(c) for c in row.findall('w:tc', ns)]
        if cells and re.match(r'^[MF]\d\d', cells[0]):
            choices = re.split(r'(?:^|\n)([ABCD])\s*', cells[2])
            if len(choices) != 9:
                raise ValueError((cells[0], cells[2], choices))
            rows.append(dict(id=cells[0][:3], targetGender='male' if cells[0][0]=='M' else 'female',
                relatability=int(re.search(r'(\d)/5', cells[0])[1]), context=cells[1],
                choices=[choices[i+1].strip() for i in (1,3,5,7)],
                anchor=cells[3], prdEvidence=cells[4]))
assert len(rows)==40
Path('backend/content').mkdir(parents=True, exist_ok=True)
Path('docs').mkdir(exist_ok=True)
Path('backend/content/prd-questions.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
Path('docs/V2-PRD-source.txt').write_text(text(root), encoding='utf-8')
Path('docs/V2-PRD-source.json').write_text(json.dumps({'filename':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'questionCount':len(rows)}, indent=2),encoding='utf-8')
print('Imported exactly 40 PRD questions, options and anchors.')
