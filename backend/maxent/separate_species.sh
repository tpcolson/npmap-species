#!/bin/sh

# separate_species.sh
#
# This should be run by preprocess.sh (which is created by do_run.sh).


# Create directory
mkdir by_species

# For each unique species name, make record file in by_species/
for s in $(cut -d' ' -f1 $RECORD_FILE | sort -u); do
  if test ! -f by_species/$s.csv; then
     echo 'Species,x,y' > by_species/$s.csv
  fi
  # this will produce fields separated by commas
  eval "grep '^$s ' \$RECORD_FILE | awk '{OFS=\",\";print \$1,\$2,\$3}' >> by_species/$s.csv"

  echo $s $(( $(cat by_species/$s.csv | wc -l) - 1))
done

