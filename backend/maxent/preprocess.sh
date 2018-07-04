#!/bin/sh
export RUN_DIR=/home/mahmadza/repos/npmap-species/backend/maxent
export TOOL_DIR=/home/mahmadza/repos/npmap-species/backend/maxent
export CONFIG_FILE=/home/mahmadza/repos/npmap-species/twincreekscode/maxent_config/config_all.txt
export COUNTS_FILE=/home/mahmadza/repos/npmap-species/atbirecords/ATBI_counts.txt
export RECORDS_DIR=/home/mahmadza/repos/npmap-species/atbirecords/ATBI_files
export ACCOUNT=UT-TENN0241
export CV_NUM_FOLDS=10


echo 'Running setup_eden_folds.sh'
/home/mahmadza/repos/npmap-species/backend/maxent/setup_eden_folds.sh
echo 'Running eden job in eden_folds/'
eden eden_folds > current_eden_job.txt
