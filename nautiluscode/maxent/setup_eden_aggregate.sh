#!/bin/sh

# This should be called from postprocess.sh (which is created by do_run.sh)
# when you have cross-validated maxent results

# Create run directory for eden run
mkdir eden_aggregate

# Make command list for running aggregate.sh on each species.
for f in $(ls $RECORDS_DIR); do
   sp=$(echo $f | cut -d'.' -f1)
   echo "cd $RUN_DIR; export TOOL_DIR=$TOOL_DIR; export CV_NUM_FOLDS=$CV_NUM_FOLDS; $TOOL_DIR/aggregate.sh $sp" >> eden_aggregate/commands
done 

# Make PBS header file for eden run
echo -n "#!/bin/sh
#PBS -l ncpus=32
#PBS -j oe
#PBS -N eden_aggregate
#PBS -A $ACCOUNT
" > eden_aggregate/header.pbs
