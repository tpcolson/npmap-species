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

# Cap ncpus at 32 so it will run on harpoon node
if test $i -gt 32; then
   ncpus=32
else
   ncpus=$i
fi

# Make PBS header file for eden run
   echo "#!/bin/sh
#PBS -l ncpus=$ncpus
#PBS -j oe
#PBS -N eden_folds
#PBS -A $ACCOUNT
" > eden_folds/header.pbs

