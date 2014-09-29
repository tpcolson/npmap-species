#!/bin/sh

# separate_species_cv.sh
#
# This should be run by preprocess.sh (which is created by do_run.sh) when
# cross-validation is needed.

# Create directories
echo '   Creating directories' >&2
mkdir $RECORD_DIR
mkdir test
mkdir training

# For each unique species name, make record file in $RECORD_DIR/
echo '   Making species record files in $RECORD_DIR/' >&2
for s in $( cut -d' ' -f1 $RECORD_FILE | sort -u); do
  # this will produce fields separated by space (makes it easier for fields
  #  library in make_folds to process these files)
  eval "grep '^$s ' \$RECORD_FILE | awk '{print \$1,\$2,\$3}' >> $RECORD_DIR/$s.csv"
  echo $s $(( $(cat $RECORD_DIR/$s.csv | wc -l) - 1))
done

