import json

def get_num_leaf_nodes(h):
    if not 'children' in h:
        return 1

    total = 0
    for i in range(len(h['children'])):
        total += get_num_leaf_nodes(h['children'][i])
    return total

hierarchy = json.loads(open('groups.json', 'r').read())
groups = []

queue = [ hierarchy ]
while len(queue) > 0:
    h = queue.pop(0)
    if get_num_leaf_nodes(h) > 15:
        for i in range(len(h['children'])):
            queue.append(h['children'][i])
    else:
        groups.append(h)

for group in groups:
    queue = [ group ]
    while len(queue) > 0:
        h = queue.pop(0)
        if not 'children' in h:
            print h['name']
        else:
            for i in range(len(h['children'])):
                queue.append(h['children'][i])

    print ''
