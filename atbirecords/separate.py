
"""
    separate.py

    Given a csv file of ATBI records, makes individual files for each species
    having at least 30 records.

    Input file must have the following naming convention:
        ATBI_records.csv
    A listing of unique species with their counts will be produced named:
        ATBI_counts.txt
    The individual species files will be created in a directory called:
        ATBI_files

    Usage:
        python separate.py ATBI_records.csv

"""

def separate(input_file):
    
    counts_file = 'ATBI_counts.txt'
    files_dir = 'ATBI_files'
    geojson_dir='Geojsons'

    # make dictionary keyed by species name
    # the value for each species key will be a list of coordinate tuples (x,y)
    # NOTE: We assume the data is formatted as "Species, Latitude, Longitude, Group"
    
    species = {}
    groups = set()
    with open(input_file, 'r') as f:
        lines = [line.rstrip('\r\n') for line in f]
        num_records = 0
        for line in lines:
            fields = line.split(',')
            if len(fields) != 4:
                print "Entry not processed: "+line
                print "There are only "+ str(len(fields)) +" values."
                continue
            try: float(fields[1])
            except ValueError:
                print "Entry not processed: "+line
                print str(fields[1]) +" is not a float."
                continue
            try: float(fields[2])
            except ValueError:
                print "Entry not processed: "+line
                print str(fields[2]) +" is not a float."
                continue
            # capitalize() will uppercase first letter and lowercase the rest
            sp = fields[0].capitalize().strip()
            if sp in species:
                species[sp].append( (fields[1].strip(),fields[2].strip(),fields[3].strip()) )
            else:
                species[sp] = [(fields[1].strip(),fields[2].strip(),fields[3].strip()),]
            groups.add(fields[3].strip())
            num_records += 1

    # create directory for individual species files
    os.mkdir(files_dir)
    os.mkdir(geojson_dir)
    for group_name in groups:
        if group_name == '':
            group_name = 'No_group'
        group_dir = '/'.join([geojson_dir, group_name])
        os.mkdir(group_dir)
    
    # write individual species files
    sorted = species.keys()
    sorted.sort()
    num_species = len(sorted)
    counts_list = []
    for sp in sorted:
        num = len(species[sp])
        if num < 30:
            continue 
        group_name = species[sp][0][2]
        if group_name == '':
            group_name = 'No_group'
        counts_list.append(''.join([sp, ',', str(num), ',', group_name, '\n']))

        csv_filename = ''.join([sp,'.csv'])
        geojson_filename = ''.join([sp,'.geojson'])
        group_dir = '/'.join([geojson_dir, group_name])
        with open(os.path.join(files_dir, csv_filename), 'w') as csv, \
            open(os.path.join(group_dir, geojson_filename), 'w') as geojson:
            csv.write('Species,x,y\n')

            # NOTE: modified by John D. to work with NPMap.js.  Changed MultiPoint to FeatureCollection.  This slows things down, but this isn't a bottleneck in the process so don't worry about it.  :-)
            found = []
            s = []
            for coord in species[sp]:
                csv.write(','.join([sp,coord[1],coord[0]]) + '\n')
                feature = Feature(geometry=Point((float(coord[1]), float(coord[0]))))
                if not feature in found:
                    found.append(feature)
                    feature['properties']['count'] = 1
                    s.append(feature)
                else:
                    for f in s:
                        if f['geometry'] == feature['geometry']:
                            f['properties']['count'] += 1
                            break
            FC = FeatureCollection(list(s))
            geojson.write(str(FC))

    # write counts file
    with open(counts_file,'w') as f:
        f.writelines(counts_list)

    print 'Species records processed:      ' + str(num_records)
    print 'Total unique species:           ' + str(num_species)
    print 'Total species with 30+ records: ' + str(len(counts_list))
    print 'Counts file written: ' + counts_file
    print str(len(counts_list)) + ' files created in ' + files_dir + '/'
   
if __name__ == "__main__":
    import sys
    import os
    import re
    from geojson import Feature, Point, FeatureCollection
    if len(sys.argv) != 2:
        print 'usage: python separate.py input_file'
    else:
        separate(sys.argv[1])
