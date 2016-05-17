import sys
import os
import re
import csv
import urllib2


"""
    separate.py

    Makes individual files for each species having at least 30 records.

    Usage:
        python separate.py

"""


def separate():
    # Create directory for individual species files
    files_dir = 'ATBI_files'
    os.mkdir(files_dir)
    count_file = open('ATBI_counts.txt', 'w')
    
    # get counts
    response = urllib2.urlopen('https://nps-grsm.cartodb.com/api/v2/sql?&filename=Unique_Species&format=csv&q=SELECT+DISTINCT+ON+(genus_speciesmaxent)+genus_speciesmaxent+,count(genus_speciesmaxent)+as+count+FROM+grsm_species_observations_maxent+group+by+genus_speciesmaxent+having+count(genus_speciesmaxent)+%3E+29')
    contents = response.read()
    counts = contents.splitlines()
    for line in counts[1:]:
        name = line.split(',')[0]
        response = urllib2.urlopen('https://nps-grsm.cartodb.com/api/v2/sql?filename=' + name + '&format=csv&q=SELECT+DISTINCT+ON+(the_geom)+*+FROM+grsm_species_observations_maxent+WHERE+lower(genus_speciesmaxent)=lower(%27' + name + '%27)')
        contents = response.read()
        lines = contents.splitlines()
        with open(files_dir + '/' + name + '.csv', 'w') as f:
            #f.write('genus_speciesmaxent,genus_speciesirma,grsm_speciesid,commonname,taxagroup,subjectcategory,lon,lat\n')
            counts = 0
            for sp_line in lines[1:]:
                words = sp_line.split(',')
                if float(words[17]) == 0.0 or float(words[16]) == 0.0:
                    continue
                counts += 1
                #f.write(','.join(words[41:47] + words[17:15:-1]) + '\n')
            if counts >= 30:
                count_file.write(name + ',' + str(counts) + ',' + words[43] + '\n')
    
if __name__ == "__main__":
    if len(sys.argv) != 1:
        print 'usage: python separate.py'
    else:
        separate()
