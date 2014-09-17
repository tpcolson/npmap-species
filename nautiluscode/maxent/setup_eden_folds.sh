#!/bin/sh

# This should be called from preprocess.sh (which is created by do_run.sh)
# when cross-validation is needed.

# Create run directory for eden run
mkdir eden_folds

# Make command list for running make_folds on each species.
#  Use info from counts.txt to produce correct arguments for make_folds.
i=0
while read line; do
   sp=$(echo $line | cut -d' ' -f1)
   count=$(echo $line | cut -d' ' -f2)
   echo "cd $RUN_DIR; $TOOL_DIR/make_folds $sp $count $CV_NUM_FOLDS" >> eden_folds/commands
   i=$(($i + 1))
done < counts.txt

# Make PBS header file for eden run
echo "#!/bin/sh
#PBS -l ncpus=32
#PBS -j oe
#PBS -N eden_folds
#PBS -A $ACCOUNT
" > eden_folds/header.pbs

