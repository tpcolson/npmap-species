# I run this as follows, but do what you want
# cat ATBI_records.csv | make_index.py > index.json

import sys, json

value_list = []
encountered = []
lines = map(str.strip, sys.stdin.readlines()[1:])
for line in lines:
    tokens = map(str.strip, line.split(','))

    if len(tokens) != 4:
        sys.stderr.write('error: invalid line "' + line + '"\n')
    else:
        species_id = tokens[0].lower()
        group_id = tokens[3].lower()

        species = species_id.replace('_', ' ')
        group = group_id.replace('_', ' ')

        if not species in encountered:
            index = {
                'id': 'nps.spmap-' + species_id,
                'search_tag': species,
                'alt_tag': '', # TODO: get the common name of a species
                'name': species.capitalize(),
                'alt_name': '', # TODO: get the capitalized common name of a species
                'group': group
            }

            value_list.append(index)
            encountered.append(species)

        if group != '' and not group in encountered:
            index = {
                'id': 'nps.spmap-' + group_id,
                'search_tag': group,
                'alt_tag': group,
                'name': group.capitalize(),
                'alt_name': group.capitalize(),
                'group': group
            }

            value_list.append(index)
            encountered.append(group)

print json.dumps({'items': value_list})
