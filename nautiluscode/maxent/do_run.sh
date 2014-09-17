#!/bin/sh

# do_run.sh
#
# This is the 'meta-script' for producing other scripts to run the workflow.
# It produces:
#   preprocess.sh - creates species input files for cross-validation
#   maxent.sh - sets up and runs maxent via eden
#   postprocess.sh - post-processing and aggregation of maxent results
#   visit.sh - sets up  and runs visit via eden to generate new pngs of sdms

if test $# -ne 2; then
   echo 'usage: do_run.sh records_file num_folds'
   exit 1
fi

RUN_DIR=$(pwd)
JOBID_FILE=current_eden_job.txt
RECORD_FILE=$1
CV_NUM_FOLDS=$2
# TODO: Error check CV_NUM_FOLDS is an integer in [2-20]

#------------------------------------------------------------------------
# Configuration settings--SET APPROPRIATE PATHS HERE FOR YOUR ENVIRONMENT
TOOL_DIR=/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent
MAXENT_JAR=$TOOL_DIR/maxent.jar
ENV_DIR=$TOOL_DIR/mxe
ENV_PICK=all
CV=true
ACCOUNT=UT-TENN0033
#------------------------------------------------------------------------

# clean up previous run's output
rm -rf eden* maxent_results by_species training test png

# make pre-process script
echo "#!/bin/sh
export RUN_DIR=$RUN_DIR
export TOOL_DIR=$TOOL_DIR
export RECORD_FILE=$RECORD_FILE
export ACCOUNT=$ACCOUNT
export CV_NUM_FOLDS=$CV_NUM_FOLDS

" > preprocess.sh

if test $CV = false; then
   echo "echo 'Running separate_species.sh'" >> preprocess.sh
   echo "$TOOL_DIR/separate_species.sh > counts.txt" >> preprocess.sh

else
   echo "echo 'Running separate_species_cv.sh'" >> preprocess.sh
   echo "$TOOL_DIR/separate_species_cv.sh > counts.txt" >> preprocess.sh
   echo "echo 'Running setup_eden_folds.sh'" >> preprocess.sh
   echo "$TOOL_DIR/setup_eden_folds.sh" >> preprocess.sh
   echo "echo 'Running eden job in eden_folds/'" >> preprocess.sh
   echo "eden eden_folds > $JOBID_FILE" >> preprocess.sh
fi

chmod u+x preprocess.sh

# make maxent script
echo "#!/bin/sh
export RUN_DIR=$RUN_DIR
export TOOL_DIR=$TOOL_DIR
export MAXENT_JAR=$MAXENT_JAR
export ENV_DIR=$ENV_DIR
export ACCOUNT=$ACCOUNT
export CV_NUM_FOLDS=$CV_NUM_FOLDS

" > maxent.sh

if test $CV = false; then
   echo "echo 'Running setup_eden_maxent.sh'" >> maxent.sh
   echo "$TOOL_DIR/setup_eden_maxent.sh" >> maxent.sh

else
   echo "echo 'Running setup_eden_maxent_cv.sh'" >> maxent.sh
   echo "$TOOL_DIR/setup_eden_maxent_cv.sh" >> maxent.sh
   echo "echo -n '#PBS -W depend=afterok:' >> eden_maxent/header.pbs" >> maxent.sh
   echo "cat $JOBID_FILE | grep nics.utk.edu >> eden_maxent/header.pbs" >> maxent.sh
   echo "cat eden_maxent/footer.pbs >> eden_maxent/header.pbs" >> maxent.sh
   
fi
echo "echo 'Running eden job in eden_maxent/'" >> maxent.sh
echo "eden eden_maxent > $JOBID_FILE" >> maxent.sh
chmod u+x maxent.sh


# make postprocess script if doing cross validation
if test $CV = true; then
   
    echo "#!/bin/sh
export RUN_DIR=$RUN_DIR
export TOOL_DIR=$TOOL_DIR
export MAXENT_JAR=$MAXENT_JAR
export ENV_DIR=$ENV_DIR
export ACCOUNT=$ACCOUNT
export CV_NUM_FOLDS=$CV_NUM_FOLDS

" > postprocess.sh

    echo "echo 'Running setup_eden_aggregate.sh'" >> postprocess.sh
    echo "$TOOL_DIR/setup_eden_aggregate.sh" >> postprocess.sh
	echo "echo -n '#PBS -W depend=afterok:' >> eden_aggregate/header.pbs" >> postprocess.sh
    echo "cat $JOBID_FILE | grep nics.utk.edu >> eden_aggregate/header.pbs" >> postprocess.sh
	
    echo "echo 'Running eden job in eden_aggregate/'" >> postprocess.sh
    echo "eden eden_aggregate > $JOBID_FILE" >> postprocess.sh

    chmod u+x postprocess.sh
fi

# make visit script
echo "#!/bin/sh
export RUN_DIR=$RUN_DIR
export TOOL_DIR=$TOOL_DIR
export ACCOUNT=$ACCOUNT

" > visit.sh
if test $CV = true; then
   #echo "echo 'Running make_filelist.sh'" >> visit.sh
   #echo "$TOOL_DIR/make_filelist.sh > filelist" >> visit.sh
   echo "echo 'Running setup_eden_visit.sh'" >> visit.sh
   echo "$TOOL_DIR/setup_eden_visit.sh" >> visit.sh
   echo "echo -n '#PBS -W depend=afterok:' >> eden_visit/header.pbs" >> visit.sh
   echo "cat $JOBID_FILE | grep nics.utk.edu >> eden_visit/header.pbs" >> visit.sh
   
   echo "echo 'Running eden job in eden_visit/'" >> visit.sh
   echo "eden eden_visit > $JOBID_FILE" >> visit.sh
fi
chmod u+x visit.sh
