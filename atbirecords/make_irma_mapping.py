# I run this as follows, but do what you want
# python make_index.py > index.json

import sys
import json
import csv

counts = {}
encountered = {}
csvfile = open('ATBI_records.csv', 'rb')
csvreader = csv.reader(csvfile)
next(csvreader)
for line in csvreader:
    if len(line) != 8:
        sys.stderr.write('error: invalid CSV file\n')
        exit(1)
    else:
        latin_name = line[0].capitalize()
        common_name = line[3].lstrip()
        id_num = int(line[2].replace(',', ''))

        if latin_name not in counts:
            counts[latin_name] = 0
        counts[latin_name] += 1
        if counts[latin_name] >= 30:
            encountered[latin_name] = {
                'common': common_name,
                'id': str(id_num).zfill(7)
            }

print(json.dumps(encountered))
