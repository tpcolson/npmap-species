#!/bin/sh
export RUN_DIR=/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent
export TOOL_DIR=/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent
export ACCOUNT=UT-TENN0033


echo 'Running setup_eden_visit.sh'
/lustre/medusa/lyu6/npmap-species/nautiluscode/maxent/setup_eden_visit.sh
echo -n '#PBS -W depend=afterok:' >> eden_visit/header.pbs
cat current_eden_job.txt | grep nics.utk.edu >> eden_visit/header.pbs
echo 'Running eden job in eden_visit/'
eden eden_visit > current_eden_job.txt
