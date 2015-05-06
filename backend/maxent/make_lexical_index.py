# I run this as follows, but do what you want
# python make_index.py > index.json

import sys, json, csv

value_list = []
encountered = []
csvfile = open('../../atbirecords/ATBI_records.csv', 'rb')
csvreader = csv.reader(csvfile)
csvreader.next()
for line in csvreader:
    if len(line) != 8:
        sys.stderr.write('error: invalid CSV file\n')
    else:
        latin_name = line[0]
        common_name = line[4]

        if not latin_name in encountered:
            index = {
                'latin_name_ref': latin_name.replace('_', ' '),
                'latin_name': latin_name,
                'common_name': common_name,
            }

            value_list.append(index)
            encountered.append(latin_name)

print json.dumps({'items': value_list})
