#!/bin/sh
export RUN_DIR=/app/npmap-species/backend/maxent
export TOOL_DIR=/app/npmap-species/backend/maxent
export CONFIG_FILE=/app/npmap-species/twincreekscode/maxent_config/config_8.txt
export COUNTS_FILE=/app/npmap-species/atbirecords/ATBI_counts.txt
export RECORDS_DIR=/app/npmap-species/atbirecords/ATBI_files
export ACCOUNT=UT-TENN0241
export CV_NUM_FOLDS=10


echo 'Running setup_eden_folds.sh'
/app/npmap-species/backend/maxent/setup_eden_folds.sh
echo 'Running eden job in eden_folds/'
eden eden_folds > current_eden_job.txt
