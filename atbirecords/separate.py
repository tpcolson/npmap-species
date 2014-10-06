
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

    # check format of filename
    # result = re.match('ATBI_records_(20[0-9][0-9]-[0-1][0-9]-[0-3][0-9])\.csv',
            # input_file)
    # if result == None:
        # print 'Please use the following format for input filenames:'
        # print '  ATBI_records_yyyy-mm-dd.csv'
        # return
    # date_string = result.group(1)

    # counts_file = ''.join(['ATBI_counts_',date_string,'.txt'])   
    # files_dir = ''.join(['ATBI_files_',date_string])   
    
    counts_file = 'ATBI_counts.txt'
    files_dir = 'ATBI_files'

    # make dictionary keyed by species name
    # the value for each species key will be a list of coordinate tuples (x,y)
    species = {}
    with open(input_file, 'r') as f:
        lines = [line.rstrip('\r\n') for line in f]
        num_records = -1
        for line in lines:
            # skip first header line
            if num_records > -1:
               fields = line.split(',')
               # capitalize() will uppercase first letter and lowercase the rest
               sp = fields[0].capitalize().strip()
               if sp in species:
                   species[sp].append( (fields[1].strip(),fields[2].strip(),fields[3].strip()) )
               else:
                   species[sp] = [(fields[1].strip(),fields[2].strip(),fields[3].strip()),]
            num_records += 1

    # create directory for individual species files
    os.mkdir(files_dir)

    # write individual species files
    sorted = species.keys()
    sorted.sort()
    num_species = len(sorted)
    counts_list = []
    for sp in sorted:
        num = len(species[sp])
        if num < 30:
            continue 
        counts_list.append(''.join([sp,',',str(num),',',species[sp][0][2],'\n']))

        filename = ''.join([sp,'.csv'])
        with open(os.path.join(files_dir,filename),'w') as f:
            f.write('Species,x,y\n')
            for coord in species[sp]:
                f.write(','.join([sp,coord[0],coord[1]]) + '\n')

    # write counts file
    with open(counts_file,'w') as f:
        f.writelines(counts_list)

    print 'Species records processed:      ' + str(num_records)
    print 'Total unique species:           ' + str(num_species)
    print 'Total species with 30+ records: ' + str(len(counts_list))
    print 'Counts file written: ' + counts_file
    print str(len(counts_list)) + ' files created in ' + files_dir
   
if __name__ == "__main__":
    import sys
    import os
    import re
    if len(sys.argv) != 2:
        print 'usage: python separate.py input_file'
    else:
        separate(sys.argv[1])
