import json

sims = json.loads(open('most_similar_distribution.json').read())

print len(sims)
for sp in sims:
    print sp

for sp in sims:
    row = ''
    for inner_sp in sims[sp]:
        row += str(sims[sp][inner_sp]) + ' '
    print row.strip()
