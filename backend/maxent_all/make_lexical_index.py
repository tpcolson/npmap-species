# I run this as follows, but do what you want
# python make_index.py > index.json

import sys, json, csv

value_list = []
encountered = {}
csvfile = open('../../atbirecords/ATBI_records.csv', 'rb')
csvreader = csv.reader(csvfile)
csvreader.next()
for line in csvreader:
    if len(line) != 8:
        sys.stderr.write('error: invalid CSV file\n')
        exit(1)
    else:
        latin_name = line[0]
        common_name = line[3]

        if not latin_name in encountered:
            encountered[latin_name] = 1
        else:
            encountered[latin_name] += 1
            if encountered[latin_name] >= 30:
                index = {
                    'latin_name_ref': latin_name.replace('_', ' '),
                    'latin_name': latin_name,
                    'common_name': common_name
                }

                value_list.append(index)
                encountered[latin_name] = -sys.maxint-1

print json.dumps({'items': value_list})
print len(value_list)
