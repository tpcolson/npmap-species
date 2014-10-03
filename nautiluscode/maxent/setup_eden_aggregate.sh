#!/bin/sh

# This should be called from postprocess.sh (which is created by do_run.sh)
# when you have cross-validated maxent results

# Create run directory for eden run
mkdir eden_aggregate

# Make command list for running aggregate.sh on each species.
while read line; do
   # Skip first line
   if test $i -eq 0; then continue; fi
   species=$line
   echo "cd $RUN_DIR; export TOOL_DIR=$TOOL_DIR; export CV_NUM_FOLDS=$CV_NUM_FOLDS; $TOOL_DIR/aggregate.sh $species" >> eden_aggregate/commands
done < $CONFIG_FILE

# Make PBS header file for eden run
echo -n "#!/bin/sh
#PBS -l ncpus=32
#PBS -j oe
#PBS -N eden_aggregate
#PBS -A $ACCOUNT
#PBS -m e
#PBS -M lyu6@vols.utk.edu
" > eden_aggregate/header.pbs
