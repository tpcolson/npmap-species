#!/bin/bash
export RUN_DIR=/app/npmap-species/backend/maxent
export TOOL_DIR=/app/npmap-species/backend/maxent
if [[ -z "${CONFIG_ENV}" ]]; then
	export CONFIG_FILE=/app/npmap-species/twincreekscode/maxent_config/config_full.txt
else
	export CONFIG_FILE=/app/data/config.txt
fi
export COUNTS_FILE=/app/npmap-species/atbirecords/ATBI_counts.txt
export RECORDS_DIR=/app/npmap-species/atbirecords/ATBI_files
export ACCOUNT=UT-TENN0241
export CV_NUM_FOLDS=10


echo 'Running setup_eden_folds.sh'
/app/npmap-species/backend/maxent/setup_eden_folds.sh
echo 'Running eden job in eden_folds/'
eden eden_folds > current_eden_job.txt
