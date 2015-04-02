
"""
    separate.py

    Given a csv file of ATBI records, makes individual files for each species having at least 30 records.
    Creates geojsons for all species records regardless of number of records per species.

    Input file must have the following file naming convention:
        ATBI_records.csv
    A listing of unique species with their counts are created in:
        ATBI_counts.txt
    The individual species files are created in a directory called:
        ATBI_files
    Geojsons are created in a directory called:
        Geojsons

    Usage:
        python separate.py ATBI_records.csv

"""

counts_file = 'ATBI_counts.txt'
files_dir = 'ATBI_files'
geojson_dir = 'Geojsons'

# NOTE: The data is formatted as 
# "Genus_SpeciesMaxEnt,Genus_SpeciesIRMA,GRSM_SpeciesID,CommonName,taxaGroup,Category,LAT,LON"
num_fields = 8

def separate(input_file):
    # make dictionary keyed by species name
    # the value for each species key will be a list of coordinate tuples (x,y)
    
    # Read csv file
    species = {}
    groups = set()
    with open(input_file, 'r') as csvfile:
        csvreader = csv.DictReader(csvfile)
        num_records = 0
        num_records_processed = 0
        num_records_not_processed = 0
        for line in csvreader:
            num_records += 1
            
            if len(line) != num_fields:
                print "Entry not processed: "+ str_dict(line)
                print "There are "+ str(len(line)) +" instead of "+ str(num_fields) +" fields."
                num_records_not_processed += 1
                continue
            try: float(line['LAT'])
            except ValueError:
                print "Entry not processed: "+ str_dict(line)
                print str(line['LAT']) +" is not a float."
                num_records_not_processed += 1
                continue
            try: float(line['LON'])
            except ValueError:
                print "Entry not processed: "+ str_dict(line)
                print str(line['LON']) +" is not a float."
                num_records_not_processed += 1
                continue
            # capitalize() will uppercase first letter and lowercase the rest
            sp = line['Genus_SpeciesMaxEnt'].strip().capitalize()
            if sp in species:
                species[sp].append( (line['LAT'].strip(), line['LON'].strip(), line['taxaGroup'].strip()) )
            else:
                species[sp] = [(line['LAT'].strip(), line['LON'].strip(), line['taxaGroup'].strip())]
            groups.add(line['taxaGroup'].strip())
            num_records_processed += 1
            
    # Create directory for individual species files
    os.mkdir(files_dir)
    os.mkdir(geojson_dir)
    for group_name in groups:
        if group_name == '':
            # group_name = 'No_group'
            continue
        group_dir = '/'.join([geojson_dir, group_name])
        os.mkdir(group_dir)
    
    # Write individual species files and geojsons
    sorted = species.keys()
    sorted.sort()
    num_species = len(sorted)
    counts_list = []
    num_species_less_than_30 = 0
    for sp in sorted:
        num = len(species[sp])
        group_name = species[sp][0][2]
        # if group_name == '':
            # group_name = 'No_group'
        if num < 30:
            num_species_less_than_30 += 1
            geojson_filename = sp +'.geojson'
            group_dir = '/'.join([geojson_dir, group_name])
            with open(os.path.join(group_dir, geojson_filename), 'w') as geojson:
                s = []
                for coord in species[sp]:
                    feature = Feature(properties = {'coordinates':'['+ str(coord[0]) +', '+ str(coord[1]) +']'}, geometry = Point((float(coord[1]), float(coord[0]))) )
                    if not feature in s:
                        s.append(feature)
                FC = FeatureCollection(list(s))
                geojson.write(str(FC))
            continue

        counts_list.append(sp +','+ str(num) +','+ group_name +'\n')
        csv_filename = sp +'.csv'
        geojson_filename = sp +'.geojson'
        group_dir = '/'.join([geojson_dir, group_name])
        with open(os.path.join(files_dir, csv_filename), 'w') as csvfile, \
            open(os.path.join(group_dir, geojson_filename), 'w') as geojson:
            csvfile.write('Species,x,y\n')

            # NOTE: modified by John D. to work with NPMap.js.  Changed MultiPoint to FeatureCollection.  
            # This slows things down, but this isn't a bottleneck in the process so don't worry about it.  :-)
            s = []
            for coord in species[sp]:
                csvfile.write(','.join([sp,coord[1],coord[0]]) +'\n')
                feature = Feature(properties = {'coordinates':'['+ str(coord[0]) +', '+ str(coord[1]) +']'}, geometry = Point((float(coord[1]), float(coord[0]))) )
                if not feature in s:
                    s.append(feature)
            FC = FeatureCollection(list(s))
            geojson.write(str(FC))

    # Write counts file
    with open(counts_file,'w') as f:
        f.writelines(counts_list)

    print ''
    print 'Species records in total:            ' + str(num_records)
    print 'Species records processed:           ' + str(num_records_processed)
    print 'Species records not processed:       ' + str(num_records_not_processed)
    print 'Total unique species:                ' + str(num_species)
    print 'Total species with >= 30 records:    ' + str(len(counts_list))
    print 'Total species with < 30 records:     ' + str(num_species_less_than_30)
    print 'Counts file written: ' + counts_file
    print str(len(counts_list)) + ' files created in ' + files_dir + '/'
    
def str_dict(dict):
    string = dict['Genus_SpeciesMaxEnt'] +','+ dict['Genus_SpeciesIRMA'] +',\"'+ dict['GRSM_SpeciesID'] +'\",'+ dict['CommonName'] +','+ \
        dict['taxaGroup'] +','+ dict['Category'] +','+ dict['LAT'] +','+ dict['LON']
    return string
    
if __name__ == "__main__":
    import sys
    import os
    import re
    from geojson import Feature, Point, FeatureCollection
    import csv
    if len(sys.argv) != 2:
        print 'usage: python separate.py input_file'
    else:
        separate(sys.argv[1])
