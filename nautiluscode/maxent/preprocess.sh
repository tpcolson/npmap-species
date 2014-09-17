#!/bin/sh
export RUN_DIR=/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent
export TOOL_DIR=/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent
export RECORD_FILE=../maxent/speciesGreaterThanEqual30.csv
export ACCOUNT=UT-TENN0033
export CV_NUM_FOLDS=10


echo 'Running separate_species_cv.sh'
/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent/separate_species_cv.sh > counts.txt
echo 'Running setup_eden_folds.sh'
/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent/setup_eden_folds.sh
echo 'Running eden job in eden_folds/'
eden eden_folds > current_eden_job.txt
