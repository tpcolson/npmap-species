#!/bin/sh
export RUN_DIR=/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent
export TOOL_DIR=/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent
export MAXENT_JAR=/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent/maxent.jar
export ENV_DIR=/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent/mxe
export ACCOUNT=UT-TENN0033
export CV_NUM_FOLDS=10


echo 'Running setup_eden_maxent_cv.sh'
/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent/setup_eden_maxent_cv.sh
echo -n '#PBS -W depend=afterok:' >> eden_maxent/header.pbs
cat current_eden_job.txt | grep nics.utk.edu >> eden_maxent/header.pbs
cat eden_maxent/footer.pbs >> eden_maxent/header.pbs
echo 'Running eden job in eden_maxent/'
eden eden_maxent > current_eden_job.txt
