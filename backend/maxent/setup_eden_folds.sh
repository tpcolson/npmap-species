#!/bin/bash

# This should be called from preprocess.sh (which is created by do_run.sh)
# when cross-validation is needed.

# Create run directory for eden run
mkdir $RUN_DIR/test
mkdir $RUN_DIR/training
mkdir $RUN_DIR/eden_folds

# Make command list for running make_folds on each species.
#  Use info from counts.txt to produce correct arguments for make_folds.
i=-1
while read line; do
   i=$(($i + 1))
   # Skip first line
   if test $i -eq 0; then continue; fi
   species=$line
   count=$(grep -w $species $COUNTS_FILE | cut -d',' -f2)
   if [[ ! -z "$count" ]]; then
       echo "cd $RUN_DIR; $TOOL_DIR/make_folds $RECORDS_DIR/$species.csv $count $CV_NUM_FOLDS" >> eden_folds/commands
   fi
done < $CONFIG_FILE

# Make PBS header file for eden run
echo "#!/bin/sh
#PBS -l ncpus=32
#PBS -j oe
#PBS -N eden_folds
#PBS -A $ACCOUNT
" > eden_folds/header.pbs
