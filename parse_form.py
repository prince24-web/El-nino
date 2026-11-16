import urllib.request
import re
import json

url = 'https://docs.google.com/forms/d/e/1FAIpQLSeZSs6VPFtC7_eXx4xasyPnFrX-UNwhlydTvnc4r6Y_C3XxtA/viewform?pli=1'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')

with open('form.html', 'w', encoding='utf-8') as f:
    f.write(html)

match = re.search(r'FB_PUBLIC_LOAD_DATA_\s*=\s*(.*?);</script>', html)
if match:
    data = json.loads(match.group(1))
    title = data[1][8] if len(data[1]) > 8 and data[1][8] else (data[3] if len(data) > 3 else "Google Form")
    desc = data[1][0]
    print(f"TITLE: {title}")
    print(f"DESC: {desc}")
    questions = data[1][1]
    print(f"Total questions: {len(questions)}")
    for i, q in enumerate(questions):
        q_id = q[0]
        q_text = q[1]
        q_desc = q[2]
        q_type = q[3]
        options = []
        if len(q) > 4 and q[4]:
            for sub in q[4]:
                if len(sub) > 1 and sub[1]:
                    options = [opt[0] for opt in sub[1] if opt and len(opt) > 0]
        required = False
        if len(q) > 4 and q[4] and len(q[4][0]) > 2:
            required = bool(q[4][0][2])
        print(f"\n[{i+1}] Question: {q_text} {'(REQUIRED)' if required else ''}")
        if q_desc:
            print(f"    Help text: {q_desc}")
        print(f"    Type code: {q_type}")
        if options:
            print(f"    Options: {options}")
else:
    print("No FB_PUBLIC_LOAD_DATA_ found")
