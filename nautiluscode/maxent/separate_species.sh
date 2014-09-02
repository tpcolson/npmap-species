#!/bin/sh

# run this from the directory containing your records file;
# given a records file (src) 
#   for each unique species in src, this script will make a 
#   separate csv file containing only the records for that species;
#  places all new files into by_species/

# src must be in format:
#     Genus_species x y
# (can have extra fields after these 3)

# also prints to stdout:
#     Genus_species num_of_records

#if test $# -ne 1; then
   #echo "usage:  separate_species.sh records_file"
   #exit 1
#fi

mkdir by_species

for s in $(cut -d' ' -f1 $RECORD_FILE | sort -u); do
  if test ! -f by_species/$s.csv; then
     echo 'Species,x,y' > by_species/$s.csv
  fi
  # this will produce fields separated by commas
  eval "grep '^$s ' \$RECORD_FILE | awk '{OFS=\",\";print \$1,\$2,\$3}' >> by_species/$s.csv"

  echo $s $(( $(cat by_species/$s.csv | wc -l) - 1))
done

