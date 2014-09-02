#!/bin/sh

# run this from the directory containing your records file;
# makes dir by_species/;
# given a records file (src) 
#   for each unique species in src, this script will make a 
#   separate csv file containing only the records for that species;
#  places all new files into by_species/

# src must be in format:
#     Genus_species group_name x y

# also prints to stdout:
#     Genus_species num_of_records

# uses space as delimiter in by_species files becaue these will be processed
#  by make_folds

#if test $# -ne 1; then
   #echo "usage:  separate_species.sh records_file"
   #exit 1
#fi

mkdir by_species
mkdir test
mkdir training

for s in $( cut -d' ' -f1 $RECORD_FILE | sort -u); do
  #if test ! -f by_species/$s.csv; then
     #echo 'Species,x,y' > by_species/$s.csv
  #fi

  # this will produce fields separated by space (makes it easier for fields
  #  library in make_folds to process these files)
  eval "grep '^$s ' \$RECORD_FILE | awk '{print \$1,\$2,\$3}' >> by_species/$s.csv"

  echo $s $(( $(cat by_species/$s.csv | wc -l) - 1))
done

