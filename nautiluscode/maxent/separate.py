
"""
    separate.py

    Given a list of species records and a path for output, makes individual
    files of the records for each unique species
"""

def separate(input_file, output_path):

    # make dictionary keyed by species name
    # the value for each species key will be a list of coordinate tuples (x,y)
    species = {}
    with open(input_file, 'r') as f:
        # TODO account for different line endings??
        lines = [line.rstrip('\n') for line in f]
        for line in lines:
            # CHANGE HERE TO SPLIT ON COMMAS OR SPACES
            #fields = line.split(',')
            fields = line.split()
            # TODO check capitalization?
            sp = fields[0]
            if sp in species:
                species[sp].append( (fields[1],fields[2]) )
            else:
                species[sp] = [(fields[1],fields[2]),]

    sorted = species.keys()
    sorted.sort()
    for sp in sorted:
        num = len(species[sp])
        print ' '.join([sp,str(num)])
        filename = ''.join([sp,'.csv'])
        with open(os.path.join(output_path,filename),'w') as f:
            # CHANGE HERE FOR DIFFERENT OUTPUT FORMAT
            f.write('Species,x,y\n')
            for coord in species[sp]:
                f.write(','.join([sp,coord[0],coord[1]]) + '\n')

if __name__ == "__main__":
    import sys
    import os
    if len(sys.argv) != 3:
        print 'usage: python separate.py input_file output_path'
    else:
        separate(sys.argv[1], sys.argv[2])
